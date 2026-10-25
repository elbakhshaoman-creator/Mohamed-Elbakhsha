import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { Group, ClassId, Student } from '../types';
import {
  Users,
  Shuffle,
  Crown,
  Award,
  Plus,
  Minus,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface GroupsViewProps {
  classId: ClassId;
  onOpenPointModal: (group: Group) => void;
  onSelectStudent: (student: Student) => void;
  onOpenAuth: () => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  classId,
  onOpenPointModal,
  onSelectStudent,
  onOpenAuth
}) => {
  const {
    data,
    generateRandomGroups,
    rerollGroupLeader,
    addGroupPoints,
    authState
  } = useClassroom();

  const [targetSize, setTargetSize] = useState<5 | 6>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rerollingGroupId, setRerollingGroupId] = useState<string | null>(null);

  const groups = data.groups[classId] || [];
  const classStudents = data.students.filter(s => s.classId === classId);
  const activeStudents = classStudents.filter(s => s.isParticipatingInActivity !== false);
  const excludedStudents = classStudents.filter(s => s.isParticipatingInActivity === false);

  const handleCreateGroups = async () => {
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }
    setIsGenerating(true);
    await generateRandomGroups(classId, targetSize);
    setIsGenerating(false);
  };

  const handleRerollLeader = async (groupId: string) => {
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }
    setRerollingGroupId(groupId);
    await rerollGroupLeader(classId, groupId);
    setTimeout(() => setRerollingGroupId(null), 400);
  };

  const handleQuickGroupPoint = async (group: Group, pts: number, reason: string) => {
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }
    await addGroupPoints(group.id, pts, reason);
  };

  return (
    <div className="space-y-6">
      {/* Top Generator Control Deck */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              نظام التكوين العشوائي للمجموعات
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            توزيع عادل ومتوازن لجميع الطلاب النشطين ({activeStudents.length} طالبًا متاحًا) مع اختيار تلقائي عادل للقادة
          </p>
        </div>

        {/* Generator Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Group Size Selector: 5 or 6 */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold px-2 text-slate-600 dark:text-slate-300">
              حجم المجموعة:
            </span>
            <button
              onClick={() => setTargetSize(5)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                targetSize === 5
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ٥ طلاب
            </button>
            <button
              onClick={() => setTargetSize(6)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                targetSize === 6
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ٦ طلاب
            </button>
          </div>

          <button
            onClick={handleCreateGroups}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Shuffle className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>
              {groups.length > 0 ? 'إعادة التوزيع العشوائي' : 'تكوين مجموعات عشوائية'}
            </span>
          </button>
        </div>
      </div>

      {/* Excluded Students Notice (if any) */}
      {excludedStudents.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              تم استبعاد <strong>{excludedStudents.length}</strong> طلاب من التوزيع لأن المعلم حدد عدم مشاركتهم في النشاط: (
              {excludedStudents.map(s => s.name).join('، ')})
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {groups.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-2xl">
            👥
          </div>
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            لم يتم تكوين مجموعات في هذا الفصل بعد
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            اضغط على زر «تكوين مجموعات عشوائية» أعلاه لتوزيع الطلاب الـ {activeStudents.length} بالتساوي وتعيين القادة بصورة عادلة وذكية.
          </p>
          <button
            onClick={handleCreateGroups}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
            <span>ابدأ التوزيع الآن</span>
          </button>
        </div>
      ) : (
        /* Groups Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, gIdx) => {
            const members = classStudents.filter(s => group.memberIds.includes(s.id));
            const leader = classStudents.find(s => s.id === group.leaderId);

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Group Card Header */}
                <div
                  className="p-5 text-white flex items-center justify-between"
                  style={{ backgroundColor: group.color || '#2563EB' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-sm">
                      {group.number}
                    </div>
                    <div>
                      <h4 className="text-base font-bold leading-tight">{group.name}</h4>
                      <span className="text-[11px] opacity-85">
                        {members.length} طلاب · {group.challengeWins} انتصارات
                      </span>
                    </div>
                  </div>

                  {/* Net Points Pill */}
                  <div className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-xl font-black text-sm">
                    <span className="font-mono tabular-nums">{group.netPoints > 0 ? `+${group.netPoints}` : group.netPoints}</span> نقطة
                  </div>
                </div>

                {/* Body: Leader Highlight & Members List */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Leader Banner */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-400 text-amber-950 rounded-xl">
                        <Crown className="w-4 h-4 fill-current" />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block -mb-0.5">
                          قائد المجموعة:
                        </span>
                        <span
                          onClick={() => leader && onSelectStudent(leader)}
                          className="text-xs font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                        >
                          {leader ? leader.name : 'لم يتم تحديده'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRerollLeader(group.id)}
                      disabled={rerollingGroupId === group.id}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1 shadow-2xs"
                      title="اختيار قائد آخر عشوائيًا وبشكل عادل"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${rerollingGroupId === group.id ? 'animate-spin' : ''}`}
                      />
                      <span>تبديل القائد</span>
                    </button>
                  </div>

                  {/* Members Grid */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-2">
                      أعضاء المجموعة:
                    </span>
                    <ul className="space-y-1.5">
                      {members.map(member => {
                        const isMemLeader = member.id === group.leaderId;
                        return (
                          <li
                            key={member.id}
                            onClick={() => onSelectStudent(member)}
                            className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-mono">
                                {member.name.charAt(0)}
                              </span>
                              <span className={`group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ${isMemLeader ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                {member.name}
                              </span>
                            </div>

                            <span className="text-[11px] text-slate-500 font-bold">
                              <span className="font-mono tabular-nums">{member.netPoints}</span> ن
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Footer: Quick Collective Group Points */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickGroupPoint(group, 2, 'تعاون ممتاز بروح الفريق')}
                      className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-lg hover:bg-emerald-200 transition-colors"
                      title="+2 تعاون ممتاز"
                    >
                      +2 تعاون
                    </button>
                    <button
                      onClick={() => handleQuickGroupPoint(group, 3, 'إجابة جماعية صحيحة')}
                      className="px-2 py-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[11px] font-bold rounded-lg hover:bg-indigo-200 transition-colors"
                      title="+3 إجابة جماعية صحيحة"
                    >
                      +3 إجابة
                    </button>
                    <button
                      onClick={() => handleQuickGroupPoint(group, 5, 'الفوز في التحدي الرياضي')}
                      className="px-2 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold rounded-lg hover:bg-amber-200 transition-colors"
                      title="+5 فوز بالتحدي"
                    >
                      +5 تحدٍ
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenPointModal(group)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="نقاط أو خصم مخصص للمجموعة"
                  >
                    <Award className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
