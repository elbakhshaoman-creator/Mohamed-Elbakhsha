import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  AppData,
  Student,
  ClassId,
  ClassInfo,
  Group,
  PointRecord,
  ClassSession,
  Competition,
  TeacherSettings,
  AuthState
} from '../types';
import {
  generateInitialStudents,
  INITIAL_CLASSES,
  DEFAULT_TEACHER_SETTINGS
} from '../data/initialStudents';
import { createBalancedGroups, pickFairLeader } from '../utils/grouping';
import { createUndoRecord } from '../utils/scoring';
import { soundEffects } from '../utils/soundEffects';

interface ClassroomContextType {
  data: AppData;
  selectedClassId: ClassId | null;
  activeSession: ClassSession | null;
  authState: AuthState;
  isLoading: boolean;
  error: string | null;
  bigScreenMode: boolean;

  // Navigation & View actions
  selectClass: (id: ClassId | null) => void;
  setBigScreenMode: (active: boolean) => void;
  clearError: () => void;

  // Auth actions
  loginWithGoogle: (params: {
    idToken?: string;
    accessToken?: string;
    testMode?: boolean;
    email?: string;
    name?: string;
  }) => Promise<{ success: boolean; isOwner: boolean; message?: string }>;
  logoutTeacher: () => Promise<void>;
  updateAuthConfig: (config: { googleClientId?: string; ownerEmail?: string; teacherName?: string }) => Promise<boolean>;

  // Session actions
  startNewSession: (classId: ClassId, title?: string) => Promise<ClassSession>;
  endSession: (sessionId: string) => Promise<void>;

  // Student actions
  addStudent: (classId: ClassId, name: string, notes?: string) => Promise<boolean>;
  updateStudent: (studentId: string, updates: Partial<Student>) => Promise<boolean>;
  toggleStudentParticipation: (studentId: string) => void;

  // Point actions
  addStudentPoints: (studentId: string, points: number, reason: string) => Promise<boolean>;
  addGroupPoints: (groupId: string, points: number, reason: string) => Promise<boolean>;
  undoLastOperation: (classId: ClassId) => Promise<boolean>;

  // Group actions
  generateRandomGroups: (classId: ClassId, targetSize: 5 | 6) => Promise<Group[]>;
  rerollGroupLeader: (classId: ClassId, groupId: string) => Promise<string>;

  // Random wheel actions
  recordStudentPick: (studentId: string) => void;

  // Competitions
  saveCompetitionResult: (comp: Omit<Competition, 'id' | 'timestamp'>) => Promise<void>;

  // Settings & Reset
  updateSettings: (newSettings: Partial<TeacherSettings>) => void;
  resetAllData: () => Promise<boolean>;
}

const ClassroomContext = createContext<ClassroomContextType | null>(null);

const STORAGE_KEY = 'math_classroom_cache_v2';
const TOKEN_KEY = 'math_teacher_token';

export const ClassroomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => {
    // Try to load cached data for instant render
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.students && parsed.students.length >= 73) {
            return parsed;
          }
        }
      } catch {}
    }
    return {
      classes: INITIAL_CLASSES,
      students: generateInitialStudents(),
      groups: { '9-1': [], '9-2': [], '9-3': [] },
      pointRecords: [],
      sessions: [],
      competitions: [],
      settings: DEFAULT_TEACHER_SETTINGS,
      teacherConfigured: false
    };
  });

  const [selectedClassId, setSelectedClassId] = useState<ClassId | null>(null);
  const [bigScreenMode, setBigScreenMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [authState, setAuthState] = useState<AuthState>(() => {
    let token: string | undefined;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem(TOKEN_KEY) || undefined;
    }
    return {
      isAuthenticated: Boolean(token),
      isOwner: Boolean(token),
      teacherName: 'أ. مالك المنصة',
      ownerEmail: 'elbakhshaoman@gmail.com',
      token,
      isConfigured: true
    };
  });

  // Apply dark mode and sound settings
  useEffect(() => {
    if (data.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    soundEffects.setMuted(!data.settings.soundEnabled);
    soundEffects.setVolume(data.settings.soundVolume);
  }, [data.settings]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  // Fetch initial server data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/data');
      if (res.ok) {
        const serverData: AppData = await res.json();
        setData(serverData);
      }

      // Check auth status
      const authRes = await fetch('/api/auth/status', {
        headers: authState.token ? { Authorization: `Bearer ${authState.token}` } : {}
      });
      if (authRes.ok) {
        const authStatus = await authRes.json();
        setAuthState(prev => ({
          ...prev,
          isConfigured: true,
          isAuthenticated: authStatus.isAuthenticated,
          isOwner: authStatus.isOwner,
          teacherName: authStatus.teacherName || prev.teacherName,
          userEmail: authStatus.userEmail,
          picture: authStatus.picture,
          ownerEmail: authStatus.ownerEmail || 'elbakhshaoman@gmail.com',
          googleClientId: authStatus.googleClientId
        }));
      }
    } catch (err) {
      console.warn('Backend server not connected or offline, using client cache', err);
    } finally {
      setIsLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync helper to server
  const syncToServer = useCallback(
    async (partial: Partial<AppData>) => {
      if (!authState.token) return;
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authState.token}`
          },
          body: JSON.stringify(partial)
        });
      } catch (err) {
        console.error('Failed to sync to server', err);
      }
    },
    [authState.token]
  );

  // Active session for selected class
  const activeSession = selectedClassId
    ? data.sessions.find(s => s.classId === selectedClassId && s.isActive) || null
    : null;

  // --- Google OAuth Handlers ---

  const loginWithGoogle = async (params: {
    idToken?: string;
    accessToken?: string;
    testMode?: boolean;
    email?: string;
    name?: string;
  }): Promise<{ success: boolean; isOwner: boolean; message?: string }> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const resData = await res.json();
      if (!res.ok) {
        const errMsg = resData.error || 'فشل التحقق من حساب Google';
        setError(errMsg);
        return { success: false, isOwner: false, message: errMsg };
      }

      if (resData.isOwner && resData.token) {
        localStorage.setItem(TOKEN_KEY, resData.token);
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          isOwner: true,
          teacherName: resData.name || prev.teacherName,
          userEmail: resData.email,
          picture: resData.picture,
          token: resData.token
        }));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          isOwner: false,
          teacherName: resData.name || 'زائر',
          userEmail: resData.email,
          picture: resData.picture,
          token: undefined
        }));
      }

      return {
        success: true,
        isOwner: Boolean(resData.isOwner),
        message: resData.message
      };
    } catch {
      const errMsg = 'تعذر الاتصال بخادم المنصة للتحقق من حساب Google';
      setError(errMsg);
      return { success: false, isOwner: false, message: errMsg };
    }
  };

  const updateAuthConfig = async (config: {
    googleClientId?: string;
    ownerEmail?: string;
    teacherName?: string;
  }): Promise<boolean> => {
    if (!authState.token) return false;
    try {
      const res = await fetch('/api/auth/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`
        },
        body: JSON.stringify(config)
      });
      const resData = await res.json();
      if (res.ok) {
        setAuthState(prev => ({
          ...prev,
          ownerEmail: resData.ownerEmail || prev.ownerEmail,
          googleClientId: resData.googleClientId !== undefined ? resData.googleClientId : prev.googleClientId
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logoutTeacher = async () => {
    if (authState.token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authState.token}` }
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false,
      isOwner: false,
      userEmail: undefined,
      picture: undefined,
      token: undefined
    }));
  };

  // --- Session Handlers ---

  const startNewSession = async (classId: ClassId, title?: string): Promise<ClassSession> => {
    const classSessions = data.sessions.filter(s => s.classId === classId);
    const sessionNumber = classSessions.length + 1;
    const sessionTitle = title || `الحصة ${sessionNumber} - رياضيات الصف التاسع`;

    // Snapshot student points at start
    const classStudents = data.students.filter(s => s.classId === classId);
    const initialPointsSnapshot: Record<string, number> = {};
    classStudents.forEach(s => {
      initialPointsSnapshot[s.id] = s.netPoints;
    });

    const newSession: ClassSession = {
      id: `sess_${classId}_${Date.now()}`,
      classId,
      sessionNumber,
      title: sessionTitle,
      startTime: new Date().toISOString(),
      isActive: true,
      durationMinutes: 45,
      notes: '',
      totalOperations: 0,
      initialPointsSnapshot
    };

    // Close any previous active session and reset current sessionPoints for students in this class
    const updatedSessions = data.sessions.map(s =>
      s.classId === classId && s.isActive
        ? { ...s, isActive: false, endTime: new Date().toISOString() }
        : s
    );
    updatedSessions.unshift(newSession);

    const updatedStudents = data.students.map(s =>
      s.classId === classId ? { ...s, sessionPoints: 0 } : s
    );

    const updatedClasses = {
      ...data.classes,
      [classId]: {
        ...data.classes[classId],
        activeSessionId: newSession.id
      }
    };

    const nextData = {
      ...data,
      sessions: updatedSessions,
      students: updatedStudents,
      classes: updatedClasses
    };

    setData(nextData);
    syncToServer({ sessions: updatedSessions, students: updatedStudents, classes: updatedClasses });

    return newSession;
  };

  const endSession = async (sessionId: string) => {
    const session = data.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const classId = session.classId;
    const finalPointsSnapshot: Record<string, number> = {};
    data.students
      .filter(s => s.classId === classId)
      .forEach(s => {
        finalPointsSnapshot[s.id] = s.netPoints;
      });

    const updatedSessions = data.sessions.map(s =>
      s.id === sessionId
        ? {
            ...s,
            isActive: false,
            endTime: new Date().toISOString(),
            finalPointsSnapshot
          }
        : s
    );

    const updatedClasses = {
      ...data.classes,
      [classId]: {
        ...data.classes[classId],
        activeSessionId: null
      }
    };

    const nextData = {
      ...data,
      sessions: updatedSessions,
      classes: updatedClasses
    };

    setData(nextData);
    syncToServer({ sessions: updatedSessions, classes: updatedClasses });
  };

  // --- Student Handlers ---

  const addStudent = async (classId: ClassId, name: string, notes?: string): Promise<boolean> => {
    if (!name.trim()) return false;
    const exists = data.students.some(s => s.classId === classId && s.name.trim() === name.trim());
    if (exists) {
      setError('يوجد طالب مسجل بهذا الاسم بالفعل في هذا الفصل');
      return false;
    }

    const newStudent: Student = {
      id: `stu_${classId}_${Date.now()}`,
      name: name.trim(),
      classId,
      positivePoints: 0,
      negativePoints: 0,
      netPoints: 0,
      sessionPoints: 0,
      participations: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      randomPickCount: 0,
      leadershipCount: 0,
      notes: notes || '',
      isParticipatingInActivity: true,
      achievements: [],
      createdAt: new Date().toISOString()
    };

    const updatedStudents = [...data.students, newStudent];
    const updatedClasses = {
      ...data.classes,
      [classId]: {
        ...data.classes[classId],
        totalStudents: updatedStudents.filter(s => s.classId === classId).length
      }
    };

    setData(prev => ({
      ...prev,
      students: updatedStudents,
      classes: updatedClasses
    }));

    if (authState.token) {
      fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`
        },
        body: JSON.stringify({ name, classId, notes })
      }).catch(() => {});
    }

    return true;
  };

  const updateStudent = async (studentId: string, updates: Partial<Student>): Promise<boolean> => {
    const student = data.students.find(s => s.id === studentId);
    if (!student) return false;

    if (updates.name && updates.name.trim()) {
      const duplicate = data.students.some(
        s => s.id !== studentId && s.classId === student.classId && s.name.trim() === updates.name!.trim()
      );
      if (duplicate) {
        setError('يوجد طالب آخر بهذا الاسم في نفس الفصل');
        return false;
      }
    }

    const updatedStudents = data.students.map(s => (s.id === studentId ? { ...s, ...updates } : s));

    setData(prev => ({ ...prev, students: updatedStudents }));

    if (authState.token) {
      fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`
        },
        body: JSON.stringify(updates)
      }).catch(() => {});
    }

    return true;
  };

  const toggleStudentParticipation = (studentId: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s =>
        s.id === studentId ? { ...s, isParticipatingInActivity: !s.isParticipatingInActivity } : s
      )
    }));
  };

  // --- Point Handlers ---

  const addStudentPoints = async (studentId: string, points: number, reason: string): Promise<boolean> => {
    const student = data.students.find(s => s.id === studentId);
    if (!student) return false;

    const classId = student.classId;
    const currentSession = data.sessions.find(s => s.classId === classId && s.isActive);
    const sessionId = currentSession ? currentSession.id : `sess_${classId}_adhoc`;

    const record: PointRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId,
      studentId: student.id,
      studentName: student.name,
      type: points >= 0 ? 'positive' : 'negative',
      points,
      reason,
      timestamp: new Date().toISOString(),
      sessionId
    };

    const isCorrect = reason.includes('صحيحة') || reason.includes('متميزة') || reason.includes('استثنائي');
    const isIncorrect = reason.includes('خاطئة');

    const updatedStudents = data.students.map(s => {
      if (s.id !== studentId) return s;
      const pos = points > 0 ? s.positivePoints + points : s.positivePoints;
      const neg = points < 0 ? s.negativePoints + Math.abs(points) : s.negativePoints;
      return {
        ...s,
        positivePoints: pos,
        negativePoints: neg,
        netPoints: pos - neg,
        sessionPoints: s.sessionPoints + points,
        participations: s.participations + 1,
        correctAnswers: isCorrect ? s.correctAnswers + 1 : s.correctAnswers,
        incorrectAnswers: isIncorrect ? s.incorrectAnswers + 1 : s.incorrectAnswers
      };
    });

    const updatedRecords = [record, ...data.pointRecords];

    // Update class total
    const classTotal = updatedStudents.filter(s => s.classId === classId).reduce((sum, s) => sum + s.netPoints, 0);
    const updatedClasses = {
      ...data.classes,
      [classId]: {
        ...data.classes[classId],
        totalPoints: classTotal
      }
    };

    // Update session op count
    const updatedSessions = data.sessions.map(sess =>
      sess.id === sessionId ? { ...sess, totalOperations: sess.totalOperations + 1 } : sess
    );

    setData(prev => ({
      ...prev,
      students: updatedStudents,
      pointRecords: updatedRecords,
      classes: updatedClasses,
      sessions: updatedSessions
    }));

    if (points > 0) {
      soundEffects.playPointAwarded();
    } else {
      soundEffects.playPointDeducted();
    }

    if (authState.token) {
      fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          classId,
          studentId,
          points,
          reason,
          type: points >= 0 ? 'positive' : 'negative'
        })
      }).catch(() => {});
    }

    return true;
  };

  const addGroupPoints = async (groupId: string, points: number, reason: string): Promise<boolean> => {
    let targetClassId: ClassId | null = null;
    let foundGroup: Group | null = null;

    for (const cid of ['9-1', '9-2', '9-3'] as ClassId[]) {
      const g = (data.groups[cid] || []).find(grp => grp.id === groupId);
      if (g) {
        targetClassId = cid;
        foundGroup = g;
        break;
      }
    }

    if (!targetClassId || !foundGroup) return false;

    const currentSession = data.sessions.find(s => s.classId === targetClassId && s.isActive);
    const sessionId = currentSession ? currentSession.id : `sess_${targetClassId}_adhoc`;

    const record: PointRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId: targetClassId,
      groupId: foundGroup.id,
      groupName: foundGroup.name,
      type: points >= 0 ? 'positive' : 'negative',
      points,
      reason,
      timestamp: new Date().toISOString(),
      sessionId
    };

    const isChallengeWin = reason.includes('تحدي') || reason.includes('فوز') || reason.includes('الفوز');
    const isCorrectTeam = reason.includes('صحيحة');

    const updatedGroups = (data.groups[targetClassId] || []).map(g => {
      if (g.id !== groupId) return g;
      const pos = points > 0 ? g.positivePoints + points : g.positivePoints;
      const neg = points < 0 ? g.negativePoints + Math.abs(points) : g.negativePoints;
      return {
        ...g,
        positivePoints: pos,
        negativePoints: neg,
        netPoints: pos - neg,
        challengeWins: isChallengeWin ? g.challengeWins + 1 : g.challengeWins,
        correctGroupAnswers: isCorrectTeam ? g.correctGroupAnswers + 1 : g.correctGroupAnswers
      };
    });

    let updatedStudents = data.students;
    if (data.settings.allowDirectStudentPointsFromGroup) {
      updatedStudents = data.students.map(s => {
        if (!foundGroup!.memberIds.includes(s.id)) return s;
        const pos = points > 0 ? s.positivePoints + points : s.positivePoints;
        const neg = points < 0 ? s.negativePoints + Math.abs(points) : s.negativePoints;
        return {
          ...s,
          positivePoints: pos,
          negativePoints: neg,
          netPoints: pos - neg,
          sessionPoints: s.sessionPoints + points
        };
      });
    }

    const nextGroups = {
      ...data.groups,
      [targetClassId]: updatedGroups
    };

    setData(prev => ({
      ...prev,
      groups: nextGroups,
      students: updatedStudents,
      pointRecords: [record, ...prev.pointRecords]
    }));

    if (points > 0) {
      soundEffects.playPointAwarded();
    } else {
      soundEffects.playPointDeducted();
    }

    if (authState.token) {
      fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          classId: targetClassId,
          groupId,
          points,
          reason,
          type: points >= 0 ? 'positive' : 'negative'
        })
      }).catch(() => {});
    }

    return true;
  };

  const undoLastOperation = async (classId: ClassId): Promise<boolean> => {
    // Find the latest non-undo record for this class
    const lastRecord = data.pointRecords.find(r => r.classId === classId && !r.isUndo);
    if (!lastRecord) {
      setError('لا توجد عمليات سابقة للتراجع عنها في هذا الفصل');
      return false;
    }

    const currentSession = data.sessions.find(s => s.classId === classId && s.isActive);
    const sessionId = currentSession ? currentSession.id : lastRecord.sessionId;
    const undoRecord = createUndoRecord(lastRecord, classId, sessionId);

    // Revert student points if student operation
    let updatedStudents = data.students;
    if (lastRecord.studentId) {
      updatedStudents = data.students.map(s => {
        if (s.id !== lastRecord.studentId) return s;
        const revertPos = lastRecord.points > 0 ? Math.max(0, s.positivePoints - lastRecord.points) : s.positivePoints;
        const revertNeg = lastRecord.points < 0 ? Math.max(0, s.negativePoints - Math.abs(lastRecord.points)) : s.negativePoints;
        return {
          ...s,
          positivePoints: revertPos,
          negativePoints: revertNeg,
          netPoints: revertPos - revertNeg,
          sessionPoints: s.sessionPoints - lastRecord.points
        };
      });
    }

    // Revert group points if group operation
    let nextGroups = data.groups;
    if (lastRecord.groupId) {
      const updatedClassGroups = (data.groups[classId] || []).map(g => {
        if (g.id !== lastRecord.groupId) return g;
        const revertPos = lastRecord.points > 0 ? Math.max(0, g.positivePoints - lastRecord.points) : g.positivePoints;
        const revertNeg = lastRecord.points < 0 ? Math.max(0, g.negativePoints - Math.abs(lastRecord.points)) : g.negativePoints;
        return {
          ...g,
          positivePoints: revertPos,
          negativePoints: revertNeg,
          netPoints: revertPos - revertNeg
        };
      });
      nextGroups = {
        ...data.groups,
        [classId]: updatedClassGroups
      };
    }

    const updatedRecords = [undoRecord, ...data.pointRecords];

    setData(prev => ({
      ...prev,
      students: updatedStudents,
      groups: nextGroups,
      pointRecords: updatedRecords
    }));

    soundEffects.playTone(400, 0.2, 'sine', 0.2);

    syncToServer({
      students: updatedStudents,
      groups: nextGroups,
      pointRecords: updatedRecords
    });

    return true;
  };

  // --- Group Handlers ---

  const generateRandomGroups = async (classId: ClassId, targetSize: 5 | 6): Promise<Group[]> => {
    const classStudents = data.students.filter(s => s.classId === classId);
    const result = createBalancedGroups(classStudents, classId, targetSize);

    // Update students leadership count for the new leaders
    const newLeaderIds = result.groups.map(g => g.leaderId);
    const updatedStudents = data.students.map(s => {
      if (newLeaderIds.includes(s.id)) {
        return { ...s, leadershipCount: (s.leadershipCount || 0) + 1 };
      }
      return s;
    });

    const nextGroups = {
      ...data.groups,
      [classId]: result.groups
    };

    setData(prev => ({
      ...prev,
      groups: nextGroups,
      students: updatedStudents
    }));

    soundEffects.playTone(523.25, 0.3, 'triangle', 0.2);
    syncToServer({ groups: nextGroups, students: updatedStudents });

    return result.groups;
  };

  const rerollGroupLeader = async (classId: ClassId, groupId: string): Promise<string> => {
    const group = (data.groups[classId] || []).find(g => g.id === groupId);
    if (!group) return '';

    const members = data.students.filter(s => group.memberIds.includes(s.id));
    const newLeaderId = pickFairLeader(members, group.leaderId);

    const updatedGroups = (data.groups[classId] || []).map(g =>
      g.id === groupId ? { ...g, leaderId: newLeaderId } : g
    );

    const updatedStudents = data.students.map(s =>
      s.id === newLeaderId ? { ...s, leadershipCount: (s.leadershipCount || 0) + 1 } : s
    );

    const nextGroups = {
      ...data.groups,
      [classId]: updatedGroups
    };

    setData(prev => ({
      ...prev,
      groups: nextGroups,
      students: updatedStudents
    }));

    soundEffects.playTone(659.25, 0.2, 'sine', 0.2);
    syncToServer({ groups: nextGroups, students: updatedStudents });

    return newLeaderId;
  };

  // --- Wheel Handlers ---

  const recordStudentPick = (studentId: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s =>
        s.id === studentId ? { ...s, randomPickCount: (s.randomPickCount || 0) + 1 } : s
      )
    }));
  };

  // --- Competition Handlers ---

  const saveCompetitionResult = async (comp: Omit<Competition, 'id' | 'timestamp'>) => {
    const newComp: Competition = {
      ...comp,
      id: `comp_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    // If there is a winner group and points reward
    if (newComp.winnerGroupId && newComp.pointsReward > 0) {
      await addGroupPoints(
        newComp.winnerGroupId,
        newComp.pointsReward,
        `الفوز في مسابقة: ${newComp.title}`
      );
    }

    const updatedCompetitions = [newComp, ...data.competitions];
    setData(prev => ({
      ...prev,
      competitions: updatedCompetitions
    }));

    syncToServer({ competitions: updatedCompetitions });
  };

  // --- Settings & Reset Handlers ---

  const updateSettings = (newSettings: Partial<TeacherSettings>) => {
    setData(prev => {
      const updated = {
        ...prev,
        settings: {
          ...prev.settings,
          ...newSettings
        }
      };
      syncToServer({ settings: updated.settings });
      return updated;
    });
  };

  const resetAllData = async (): Promise<boolean> => {
    try {
      if (authState.token) {
        await fetch('/api/data/reset', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authState.token}` }
        });
      }

      const fresh: AppData = {
        classes: INITIAL_CLASSES,
        students: generateInitialStudents(),
        groups: { '9-1': [], '9-2': [], '9-3': [] },
        pointRecords: [],
        sessions: [],
        competitions: [],
        settings: DEFAULT_TEACHER_SETTINGS,
        teacherConfigured: true
      };

      setData(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch {}

      return true;
    } catch {
      setError('فشل إعادة ضبط البيانات');
      return false;
    }
  };

  return (
    <ClassroomContext.Provider
      value={{
        data,
        selectedClassId,
        activeSession,
        authState,
        isLoading,
        error,
        bigScreenMode,
        selectClass: setSelectedClassId,
        setBigScreenMode,
        loginWithGoogle,
        logoutTeacher,
        updateAuthConfig,
        startNewSession,
        endSession,
        addStudent,
        updateStudent,
        toggleStudentParticipation,
        addStudentPoints,
        addGroupPoints,
        undoLastOperation,
        generateRandomGroups,
        rerollGroupLeader,
        recordStudentPick,
        saveCompetitionResult,
        updateSettings,
        resetAllData
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const ctx = useContext(ClassroomContext);
  if (!ctx) {
    throw new Error('useClassroom must be used within ClassroomProvider');
  }
  return ctx;
};
