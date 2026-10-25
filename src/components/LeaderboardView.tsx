import React, { useState, useMemo } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { ClassId, Student, Group } from '../types';
import { rankStudents, rankGroups } from '../utils/scoring';
import {
  Trophy,
  Medal,
  Award,
  Users,
  Flame,
  HeartHandshake,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';

interface LeaderboardViewProps {
  classId: ClassId;
  onSelectStudent: (student: Student) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ classId, onSelectStudent }) => {
  const { data } = useClassroom();

  const [timeScope, setTimeScope] = useState<'session' | 'weekly' | 'cumulative'>('session');
  const [studentSortMetric, setStudentSortMetric] = useState<
    'netPoints' | 'participations' | 'correctAnswers'
  >('netPoints');

  const classStudents = useMemo(() => {
    return data.students.filter(s => s.classId === classId);
  }, [data.students, classId]);

  const classGroups = data.groups[classId] || [];

  // Sort students according to selected timeScope and metric
  const rankedStudents = useMemo(() => {
    if (timeScope === 'session') {
      return rankStudents(classStudents, 'sessionPoints');
    }
    return rankStudents(classStudents, studentSortMetric);
  }, [classStudents, timeScope, studentSortMetric]);

  const rankedGroups = useMemo(() => {
    return rankGroups(classGroups);
  }, [classGroups]);

  // Most Improved Student (highest positive points ratio or net growth)
  const mostImprovedStudent = useMemo(() => {
    if (classStudents.length === 0) return null;
    return [...classStudents].sort((a, b) => b.positivePoints - a.positivePoints)[0];
  }, [classStudents]);

  // Most Collaborative Student (highest leadership or participations)
  const mostCollaborativeStudent = useMemo(() => {
    if (classStudents.length === 0) return null;
    return [...classStudents].sort(
      (a, b) => b.leadershipCount * 2 + b.participations - (a.leadershipCount * 2 + a.participations)
    )[0];
  }, [classStudents]);

  const renderMedal = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-black text-sm">
          🥇
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-black text-sm">
          🥈
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 font-black text-sm">
          🥉
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 font-mono text-xs font-bold">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Time Scope & Metric Filters */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              لوحة المتصدرين والترتيب التنافسي
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تكريم المتميزين في النقاط والمشاركات والإجابات الصحيحة وروح التعاون
            </p>
          </div>
        </div>

        {/* Time Scope Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTimeScope('session')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeScope === 'session'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            الحصة الحالية
          </button>
          <button
            onClick={() => setTimeScope('weekly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeScope === 'weekly'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            هذا الأسبوع
          </button>
          <button
            onClick={() => setTimeScope('cumulative')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeScope === 'cumulative'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            الترتيب التراكمي العام
          </button>
        </div>
      </div>

      {/* Special Badges: Most Improved & Most Collaborative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mostImprovedStudent && (
          <div
            onClick={() => onSelectStudent(mostImprovedStudent)}
            className="p-5 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-xs">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block -mb-0.5">
                  أعلى طالب تحسنًا وأداءً
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {mostImprovedStudent.name}
                </h4>
                <span className="text-xs text-slate-500">
                  +{mostImprovedStudent.positivePoints} نقطة تعزيز إيجابية
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              المستوى {mostImprovedStudent.netPoints >= 50 ? '٤' : '٣'}
            </span>
          </div>
        )}

        {mostCollaborativeStudent && (
          <div
            onClick={() => onSelectStudent(mostCollaborativeStudent)}
            className="p-5 bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-900/60 rounded-3xl flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xs">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 block -mb-0.5">
                  أكثر الطلاب تعاونًا وروح فريق
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {mostCollaborativeStudent.name}
                </h4>
                <span className="text-xs text-slate-500">
                  قاد المجموعة {mostCollaborativeStudent.leadershipCount} مرات وشارك {mostCollaborativeStudent.participations} مرات
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <span className="font-mono tabular-nums">{mostCollaborativeStudent.netPoints}</span> ن
            </span>
          </div>
        )}
      </div>

      {/* Side-by-Side: Groups Standings & Students Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups Standings (1 Col) */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>ترتيب المجموعات</span>
            </h4>
            <span className="text-[11px] text-slate-400">{rankedGroups.length} مجموعات</span>
          </div>

          {rankedGroups.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              لم يتم تكوين مجموعات في هذا الفصل بعد
            </p>
          ) : (
            <div className="space-y-2.5">
              {rankedGroups.map((grp, idx) => (
                <div
                  key={grp.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    {renderMedal(idx)}
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {grp.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {grp.challengeWins} فوز بالتحديات
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                    {grp.netPoints > 0 ? `+${grp.netPoints}` : grp.netPoints}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Students Table (2 Cols) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>ترتيب الطلاب المتصدرين</span>
            </h4>

            {/* Metric Sort Tabs */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 ml-1">ترتيب حسب:</span>
              <button
                onClick={() => setStudentSortMetric('netPoints')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  studentSortMetric === 'netPoints'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                صافي النقاط
              </button>
              <button
                onClick={() => setStudentSortMetric('participations')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  studentSortMetric === 'participations'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                المشاركات
              </button>
              <button
                onClick={() => setStudentSortMetric('correctAnswers')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  studentSortMetric === 'correctAnswers'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                الإجابات الصحيحة
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 pr-2 font-semibold">#</th>
                  <th className="pb-3 font-semibold">اسم الطالب</th>
                  <th className="pb-3 text-center font-semibold">المشاركات</th>
                  <th className="pb-3 text-center font-semibold">صحيحة</th>
                  <th className="pb-3 text-left pl-2 font-semibold">النقاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {rankedStudents.map((st, idx) => (
                  <tr
                    key={st.id}
                    onClick={() => onSelectStudent(st)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pr-2">{renderMedal(idx)}</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                      {st.name}
                    </td>
                    <td className="py-2.5 text-center font-mono tabular-nums text-slate-500">
                      {st.participations}
                    </td>
                    <td className="py-2.5 text-center font-mono tabular-nums text-emerald-600">
                      {st.correctAnswers}
                    </td>
                    <td className="py-2.5 text-left pl-2 font-mono font-black tabular-nums">
                      <span
                        className={`${
                          timeScope === 'session'
                            ? st.sessionPoints > 0
                              ? 'text-emerald-600'
                              : 'text-slate-500'
                            : st.netPoints > 0
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {timeScope === 'session'
                          ? st.sessionPoints > 0
                            ? `+${st.sessionPoints}`
                            : st.sessionPoints
                          : st.netPoints > 0
                          ? `+${st.netPoints}`
                          : st.netPoints}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
