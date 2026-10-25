export type ClassId = '9-1' | '9-2' | '9-3';

export interface Student {
  id: string;
  name: string;
  classId: ClassId;
  positivePoints: number;
  negativePoints: number;
  netPoints: number;
  sessionPoints: number;
  participations: number;
  correctAnswers: number;
  incorrectAnswers: number;
  randomPickCount: number;
  leadershipCount: number;
  notes: string;
  isParticipatingInActivity: boolean;
  achievements: string[];
  createdAt: string;
}

export interface ClassInfo {
  id: ClassId;
  name: string;
  gradeName: string;
  totalStudents: number;
  activeSessionId: string | null;
  totalPoints: number;
}

export interface Group {
  id: string;
  classId: ClassId;
  name: string;
  number: number;
  memberIds: string[];
  leaderId: string;
  positivePoints: number;
  negativePoints: number;
  netPoints: number;
  challengeWins: number;
  correctGroupAnswers: number;
  color: string;
}

export type PointType = 'positive' | 'negative' | 'undo';

export interface PointRecord {
  id: string;
  classId: ClassId;
  studentId?: string;
  studentName?: string;
  groupId?: string;
  groupName?: string;
  type: PointType;
  points: number;
  reason: string;
  timestamp: string;
  sessionId: string;
  isUndo?: boolean;
  undidRecordId?: string;
}

export interface ClassSession {
  id: string;
  classId: ClassId;
  sessionNumber: number;
  title: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  durationMinutes: number;
  notes: string;
  totalOperations: number;
  initialPointsSnapshot: Record<string, number>;
  finalPointsSnapshot?: Record<string, number>;
}

export type CompetitionType =
  | 'quick_question'
  | 'fastest_correct'
  | 'problem_solving'
  | 'true_false'
  | 'multiple_choice'
  | 'group_thinking'
  | 'final_round';

export interface Competition {
  id: string;
  classId: ClassId;
  title: string;
  type: CompetitionType;
  participatingGroupIds: string[];
  durationSeconds: number;
  pointsReward: number;
  penaltyPoints: number;
  winnerGroupId?: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  timestamp: string;
}

export interface TeacherSettings {
  soundEnabled: boolean;
  soundVolume: number;
  darkMode: boolean;
  defaultGroupSize: 5 | 6;
  defaultTimerSeconds: number;
  allowDirectStudentPointsFromGroup: boolean;
  positivePresets: { label: string; points: number }[];
  negativePresets: { label: string; points: number }[];
  groupPositivePresets: { label: string; points: number }[];
  groupNegativePresets: { label: string; points: number }[];
}

export interface AppData {
  classes: Record<ClassId, ClassInfo>;
  students: Student[];
  groups: Record<ClassId, Group[]>;
  pointRecords: PointRecord[];
  sessions: ClassSession[];
  competitions: Competition[];
  settings: TeacherSettings;
  teacherConfigured: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isOwner: boolean;
  teacherName: string;
  userEmail?: string;
  picture?: string;
  token?: string;
  isConfigured: boolean;
  ownerEmail: string;
  googleClientId?: string;
}
