import React, { useState, useMemo } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { Student, ClassId } from '../types';
import {
  Search,
  ArrowUpDown,
  Plus,
  UserPlus,
  Crown,
  Sparkles,
  RotateCcw,
  UserCheck,
  UserX,
  Award
} from 'lucide-react';

interface StudentsViewProps {
  classId: ClassId;
  onSelectStudent: (student: Student) => void;
  onOpenPointModal: (student: Student) => void;
  onOpenAuth: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  classId,
  onSelectStudent,
  onOpenPointModal,
  onOpenAuth
}) => {
  const {
    data,
    addStudent,
    addStudentPoints,
    undoLastOperation,
    toggleStudentParticipation,
    authState
  } = useClassroom();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortAlphabetical, setSortAlphabetical] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const classStudents = useMemo(() => {
    return data.students.filter(s => s.classId === classId);
  }, [data.students, classId]);

  const classGroups = data.groups[classId] || [];

  const filteredStudents = useMemo(() => {
    let list = classStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesActive = filterActiveOnly ? s.isParticipatingInActivity !== false : true;
      return matchesSearch && matchesActive;
    });

    if (sortAlphabetical) {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }

    return list;
  }, [classStudents, searchQuery, filterActiveOnly, sortAlphabetical]);

  const handleQuickPoint = async (
    e: React.MouseEvent,
    student: Student,
    points: number,
    label: string
  ) => {
    e.stopPropagation();
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }
    await addStudentPoints(student.id, points, label);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newStudentName.trim()) return;

    const success = await addStudent(classId, newStudentName.trim(), newStudentNotes.trim());
    if (success) {
      setNewStudentName('');
      setNewStudentNotes('');
      setShowAddStudentModal(false);
    } else {
      setAddError('يوجد طالب مسجل بهذا الاسم بالفعل في هذا الفصل');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم الكامل أو جزء منه..."
            className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSortAlphabetical(!sortAlphabetical)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
              sortAlphabetical
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>أبجدي</span>
          </button>

          <button
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
              filterActiveOnly
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>النشطون فقط</span>
          </button>

          <button
            onClick={() => undoLastOperation(classId)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
            title="تراجع عن آخر عملية نقاط مسجلة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تراجع</span>
          </button>

          <button
            onClick={() => setShowAddStudentModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب</span>
          </button>
        </div>
      </div>

      {/* Roster Summary Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          عرض <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">{filteredStudents.length}</strong> من إجمالي{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">{classStudents.length}</strong> طالبًا
        </span>
        <span>اضغط على اسم أي طالب لفتح ملفه الشخصي ومخطط الأداء</span>
      </div>

      {/* Students Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map(student => {
          const group = classGroups.find(g => g.memberIds.includes(student.id));
          const isLeader = group?.leaderId === student.id;

          return (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              {/* Card Top: Avatar & Name */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm">
                        {student.name.charAt(0)}
                      </div>
                      {isLeader && (
                        <div
                          className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 p-0.5 rounded-full shadow-xs"
                          title="قائد المجموعة"
                        >
                          <Crown className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-1">
                        {student.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        {group ? (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {group.name}
                          </span>
                        ) : (
                          <span>بلا مجموعة</span>
                        )}
                        <span>·</span>
                        <span>{student.participations} مشاركة</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Points Badge */}
                  <div className="text-left shrink-0">
                    <span
                      className={`inline-block font-mono font-black text-sm px-2.5 py-0.5 rounded-lg tabular-nums ${
                        student.netPoints > 0
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : student.netPoints < 0
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {student.netPoints > 0 ? `+${student.netPoints}` : student.netPoints}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Bottom: Quick 1-Click Point Buttons */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => handleQuickPoint(e, student, 1, 'مشاركة إيجابية')}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-lg transition-colors font-mono"
                    title="+1 مشاركة إيجابية"
                  >
                    +1
                  </button>
                  <button
                    onClick={e => handleQuickPoint(e, student, 2, 'إجابة صحيحة')}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-lg transition-colors font-mono"
                    title="+2 إجابة صحيحة"
                  >
                    +2
                  </button>
                  <button
                    onClick={e => handleQuickPoint(e, student, 3, 'إجابة متميزة')}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-lg transition-colors font-mono"
                    title="+3 إجابة متميزة"
                  >
                    +3
                  </button>
                  <button
                    onClick={e => handleQuickPoint(e, student, -1, 'مخالفة بسيطة')}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold rounded-lg transition-colors font-mono"
                    title="-1 مخالفة بسيطة"
                  >
                    -1
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleStudentParticipation(student.id);
                    }}
                    className={`p-1 rounded-lg text-xs ${
                      student.isParticipatingInActivity !== false
                        ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={
                      student.isParticipatingInActivity !== false
                        ? 'الطالب نشط في الأنشطة'
                        : 'الطالب مستبعد مؤقتًا من الأنشطة'
                    }
                  >
                    {student.isParticipatingInActivity !== false ? (
                      <UserCheck className="w-3.5 h-3.5" />
                    ) : (
                      <UserX className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onOpenPointModal(student);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="خيارات نقاط متقدمة"
                  >
                    <Award className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-right">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              إضافة طالب جديد للفصل
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              أدخل الاسم الكامل للطالب. يتم التحقق من عدم التكرار تلقائيًا.
            </p>

            {addError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl mb-3">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم الكامل للطالب *
                </label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  placeholder="مثال: يوسف بن أحمد بن سعيد الكندي"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات اختيارية
                </label>
                <input
                  type="text"
                  value={newStudentNotes}
                  onChange={e => setNewStudentNotes(e.target.value)}
                  placeholder="أي ملاحظات خاصة بالمعلم..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  إضافة وحفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
