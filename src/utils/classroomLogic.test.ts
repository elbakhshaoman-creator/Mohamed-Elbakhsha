import test from 'node:test';
import assert from 'node:assert/strict';
import { createBalancedGroups, pickFairLeader } from './grouping';
import { calculateStudentLevel, rankStudents, rankGroups, createUndoRecord } from './scoring';
import { generateInitialStudents } from '../data/initialStudents';
import { Student, Group } from '../types';

test('initial student roster counts and structure', () => {
  const students = generateInitialStudents();
  assert.equal(students.length, 73, 'Should generate exactly 73 students');

  const c1 = students.filter(s => s.classId === '9-1');
  const c2 = students.filter(s => s.classId === '9-2');
  const c3 = students.filter(s => s.classId === '9-3');

  assert.equal(c1.length, 25, 'تاسع أول should have 25 students');
  assert.equal(c2.length, 24, 'تاسع ثاني should have 24 students');
  assert.equal(c3.length, 24, 'تاسع ثالث should have 24 students');
});

test('grouping 25 students with target size 5 yields 5 groups of 5', () => {
  const allStudents = generateInitialStudents();
  const c1Students = allStudents.filter(s => s.classId === '9-1');

  const result = createBalancedGroups(c1Students, '9-1', 5);
  assert.equal(result.groups.length, 5, 'Should form 5 groups');

  const allAssignedIds = result.groups.flatMap(g => g.memberIds);
  assert.equal(allAssignedIds.length, 25, 'All 25 students must be assigned');
  const uniqueIds = new Set(allAssignedIds);
  assert.equal(uniqueIds.size, 25, 'No student should be duplicated across groups');

  for (const group of result.groups) {
    assert.equal(group.memberIds.length, 5, 'Each group must have 5 students');
    assert.ok(group.memberIds.includes(group.leaderId), 'Leader must be a member of the group');
  }
});

test('grouping 24 students with target size 6 yields 4 groups of 6', () => {
  const allStudents = generateInitialStudents();
  const c2Students = allStudents.filter(s => s.classId === '9-2');

  const result = createBalancedGroups(c2Students, '9-2', 6);
  assert.equal(result.groups.length, 4, 'Should form 4 groups');

  for (const group of result.groups) {
    assert.equal(group.memberIds.length, 6, 'Each group must have 6 students');
  }
});

test('fair leadership selection prefers member with lowest leadershipCount', () => {
  const mockMembers: Student[] = [
    { id: 's1', leadershipCount: 3 } as Student,
    { id: 's2', leadershipCount: 2 } as Student,
    { id: 's3', leadershipCount: 0 } as Student,
    { id: 's4', leadershipCount: 1 } as Student
  ];

  const chosenId = pickFairLeader(mockMembers);
  assert.equal(chosenId, 's3', 'Candidate with 0 past leadership roles must be prioritized');
});

test('student level calculation aligns with points scale', () => {
  assert.equal(calculateStudentLevel(0).level, 1);
  assert.equal(calculateStudentLevel(15).level, 2);
  assert.equal(calculateStudentLevel(35).level, 3);
  assert.equal(calculateStudentLevel(75).level, 4);
  assert.equal(calculateStudentLevel(120).level, 5);
});

test('student ranking sorts properly by netPoints', () => {
  const mockStudents: Student[] = [
    { id: '1', name: 'أحمد', netPoints: 10, correctAnswers: 2 } as Student,
    { id: '2', name: 'سالم', netPoints: 25, correctAnswers: 5 } as Student,
    { id: '3', name: 'علي', netPoints: 18, correctAnswers: 3 } as Student
  ];

  const ranked = rankStudents(mockStudents, 'netPoints');
  assert.equal(ranked[0].name, 'سالم');
  assert.equal(ranked[1].name, 'علي');
  assert.equal(ranked[2].name, 'أحمد');
});

test('undo record generation produces opposite points delta', () => {
  const original = {
    id: 'rec_100',
    classId: '9-1' as const,
    studentId: 's1',
    studentName: 'محمد',
    type: 'positive' as const,
    points: 3,
    reason: 'إجابة متميزة',
    timestamp: '2026-10-25T00:00:00Z',
    sessionId: 'sess_1'
  };

  const undo = createUndoRecord(original, '9-1', 'sess_1');
  assert.equal(undo.points, -3, 'Undo record points must be negative of original points');
  assert.equal(undo.isUndo, true);
  assert.equal(undo.undidRecordId, 'rec_100');
});
