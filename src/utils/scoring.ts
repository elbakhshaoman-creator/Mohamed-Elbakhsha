import { Student, Group, PointRecord, PointType } from '../types';

export interface StudentLevelInfo {
  level: number;
  title: string;
  minPoints: number;
  nextPoints: number;
  progressPercent: number;
}

export function calculateStudentLevel(netPoints: number): StudentLevelInfo {
  const points = Math.max(0, netPoints);

  if (points < 10) {
    return {
      level: 1,
      title: 'بداية الانطلاق',
      minPoints: 0,
      nextPoints: 10,
      progressPercent: Math.min(100, (points / 10) * 100)
    };
  } else if (points < 25) {
    return {
      level: 2,
      title: 'باحث نشيط',
      minPoints: 10,
      nextPoints: 25,
      progressPercent: Math.min(100, ((points - 10) / 15) * 100)
    };
  } else if (points < 50) {
    return {
      level: 3,
      title: 'مفكر متميز',
      minPoints: 25,
      nextPoints: 50,
      progressPercent: Math.min(100, ((points - 25) / 25) * 100)
    };
  } else if (points < 100) {
    return {
      level: 4,
      title: 'عبقري الرياضيات',
      minPoints: 50,
      nextPoints: 100,
      progressPercent: Math.min(100, ((points - 50) / 50) * 100)
    };
  } else {
    return {
      level: 5,
      title: 'أسطورة الفصل',
      minPoints: 100,
      nextPoints: 100,
      progressPercent: 100
    };
  }
}

export interface StudentBadge {
  id: string;
  title: string;
  icon: string;
  description: string;
  earned: boolean;
}

export function evaluateStudentBadges(student: Student): StudentBadge[] {
  const net = student.netPoints;
  const parts = student.participations;
  const correct = student.correctAnswers;
  const leads = student.leadershipCount;

  return [
    {
      id: 'participation_star',
      title: 'نجم المشاركة',
      icon: '⭐',
      description: 'شارك 5 مرات على الأقل بحماس أثناء الحصة',
      earned: parts >= 5
    },
    {
      id: 'accuracy_master',
      title: 'دقة الإجابات',
      icon: '🎯',
      description: 'حقق 3 إجابات صحيحة على الأقل بنسبة إتقان عالية',
      earned: correct >= 3 && correct >= student.incorrectAnswers * 2
    },
    {
      id: 'team_spirit',
      title: 'روح الفريق',
      icon: '🤝',
      description: 'قاد مجموعة أو ساهم بتعاون ممتاز مع زملائه',
      earned: leads >= 1 || net >= 15
    },
    {
      id: 'math_champion',
      title: 'بطل الرياضيات',
      icon: '🏆',
      description: 'وصل إلى 30 نقطة فما فوق في الأداء العام',
      earned: net >= 30
    },
    {
      id: 'quick_thinker',
      title: 'سرعة البديهة',
      icon: '⚡',
      description: 'أجاب عن أسئلة التحدي السريع بنجاح وتفوق',
      earned: correct >= 5
    }
  ];
}

/**
 * Ranks students based on selected metric.
 */
export function rankStudents(
  students: Student[],
  sortBy: 'netPoints' | 'participations' | 'correctAnswers' | 'sessionPoints' = 'netPoints'
): Student[] {
  return [...students].sort((a, b) => {
    if (sortBy === 'netPoints') {
      if (b.netPoints !== a.netPoints) return b.netPoints - a.netPoints;
      return b.correctAnswers - a.correctAnswers;
    }
    if (sortBy === 'sessionPoints') {
      if (b.sessionPoints !== a.sessionPoints) return b.sessionPoints - a.sessionPoints;
      return b.netPoints - a.netPoints;
    }
    if (sortBy === 'participations') {
      if (b.participations !== a.participations) return b.participations - a.participations;
      return b.netPoints - a.netPoints;
    }
    if (sortBy === 'correctAnswers') {
      if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
      return b.netPoints - a.netPoints;
    }
    return 0;
  });
}

/**
 * Ranks groups by net points, then challenge wins.
 */
export function rankGroups(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => {
    if (b.netPoints !== a.netPoints) return b.netPoints - a.netPoints;
    if (b.challengeWins !== a.challengeWins) return b.challengeWins - a.challengeWins;
    return b.correctGroupAnswers - a.correctGroupAnswers;
  });
}

/**
 * Creates an undo record and computes restored point values.
 */
export function createUndoRecord(
  originalRecord: PointRecord,
  classId: PointRecord['classId'],
  sessionId: string
): PointRecord {
  return {
    id: `undo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    classId,
    studentId: originalRecord.studentId,
    studentName: originalRecord.studentName,
    groupId: originalRecord.groupId,
    groupName: originalRecord.groupName,
    type: 'undo',
    points: -originalRecord.points,
    reason: `تراجع عن: (${originalRecord.reason})`,
    timestamp: new Date().toISOString(),
    sessionId,
    isUndo: true,
    undidRecordId: originalRecord.id
  };
}
