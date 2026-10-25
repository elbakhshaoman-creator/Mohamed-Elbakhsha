import { Student, Group, ClassId } from '../types';
import { GROUP_THEME_COLORS, GROUP_NAME_PRESETS } from '../data/initialStudents';

export interface GroupingResult {
  groups: Group[];
  warning?: string;
  totalStudentsPlaced: number;
}

/**
 * Creates balanced random groups of target size 5 or 6,
 * selecting a fair leader for each group based on least past leadership roles.
 */
export function createBalancedGroups(
  students: Student[],
  classId: ClassId,
  targetSize: 5 | 6 = 5,
  customNames?: string[]
): GroupingResult {
  // Only place participating students
  const activeStudents = students.filter(s => s.isParticipatingInActivity !== false);
  const total = activeStudents.length;

  if (total === 0) {
    return { groups: [], warning: 'لا يوجد طلاب نشطون لتكوين المجموعات', totalStudentsPlaced: 0 };
  }

  // Shuffle active students with cryptographic/math randomness
  const shuffled = [...activeStudents].sort(() => Math.random() - 0.5);

  // Determine optimal number of groups
  let numGroups = Math.round(total / targetSize);
  if (numGroups < 1) numGroups = 1;

  // Ensure no group has fewer than 3 students if possible
  while (numGroups > 1 && Math.floor(total / numGroups) < 3) {
    numGroups--;
  }

  const baseSize = Math.floor(total / numGroups);
  const remainder = total % numGroups;

  const groups: Group[] = [];
  let currentIndex = 0;

  for (let i = 0; i < numGroups; i++) {
    // Distribute remainder students across the first few groups
    const currentGroupSize = baseSize + (i < remainder ? 1 : 0);
    const memberSlice = shuffled.slice(currentIndex, currentIndex + currentGroupSize);
    currentIndex += currentGroupSize;

    const memberIds = memberSlice.map(m => m.id);

    // Pick a fair leader: candidate with minimum leadershipCount
    const leaderId = pickFairLeader(memberSlice);

    const groupNumber = i + 1;
    const defaultName = (customNames && customNames[i]) || GROUP_NAME_PRESETS[i % GROUP_NAME_PRESETS.length] || `المجموعة ${groupNumber}`;
    const color = GROUP_THEME_COLORS[i % GROUP_THEME_COLORS.length];

    groups.push({
      id: `grp_${classId}_${Date.now()}_${groupNumber}`,
      classId,
      name: defaultName,
      number: groupNumber,
      memberIds,
      leaderId,
      positivePoints: 0,
      negativePoints: 0,
      netPoints: 0,
      challengeWins: 0,
      correctGroupAnswers: 0,
      color
    });
  }

  let warning: string | undefined;
  const sizes = groups.map(g => g.memberIds.length);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  if (maxSize - minSize > 1) {
    warning = `تم التوزيع بأفضل توازن ممكن مع اختلاف ${maxSize - minSize} طلاب بين المجموعات.`;
  }

  return {
    groups,
    warning,
    totalStudentsPlaced: total
  };
}

/**
 * Fair leader selection: chooses member with the minimum previous leadership count.
 * Breaks ties with uniform randomness.
 */
export function pickFairLeader(members: Student[], currentLeaderId?: string): string {
  if (members.length === 0) return '';
  if (members.length === 1) return members[0].id;

  // Candidates other than the current leader if multiple exist
  const candidates = currentLeaderId
    ? members.filter(m => m.id !== currentLeaderId)
    : members;

  const pool = candidates.length > 0 ? candidates : members;

  // Find minimum leadership count
  const minCount = Math.min(...pool.map(m => m.leadershipCount || 0));
  const bestCandidates = pool.filter(m => (m.leadershipCount || 0) === minCount);

  // Pick randomly among best candidates
  const chosen = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
  return chosen.id;
}
