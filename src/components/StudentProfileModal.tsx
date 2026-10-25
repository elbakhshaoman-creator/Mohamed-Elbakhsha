import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { Student } from '../types';
import { calculateStudentLevel, evaluateStudentBadges } from '../utils/scoring';
import {
  X,
  Award,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  Crown,
  Shuffle,
  FileText,
  Save,
  CheckCircle,
  Clock,
  Sparkles,
  Edit2
} from 'lucide-react';

interface StudentProfileModalProps {
  student: Student | null;
  onClose: () => void;
  onAwardPoints: (studentId: string) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  onClose,
  onAwardPoints
}) => {
  const { data, updateStudent, authState } = useClassroom();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  React.useEffect(() => {
    if (student) {
      setEditedName(student.name);
      setNotesText(student.notes || '');
      setIsEditingName(false);
      setNotesSuccess(false);
    }
  }, [student]);

  if (!student) return null;

  const currentClass = data.classes[student.classId];
  const levelInfo = calculateStudentLevel(student.netPoints);
  const badges = evaluateStudentBadges(student);

  // Student history records
  const studentRecords = data.pointRecords.filter(r => r.studentId === student.id);
  const positiveRecords = studentRecords.filter(r => r.points > 0);
  const negativeRecords = studentRecords.filter(r => r.points < 0);

  // Group membership
  const classGroups = data.groups[student.classId] || [];
  const currentGroup = classGroups.find(g => g.memberIds.includes(student.id));
  const isLeader = currentGroup?.leaderId === student.id;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await updateStudent(student.id, { notes: notesText });
    setIsSavingNotes(false);
    setNotesSuccess(true);
    setTimeout(() => setNotesSuccess(false), 2000);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    await updateStudent(student.id, { name: editedName.trim() });
    setIsEditingName(false);
  };

  // Performance progression points array for SVG line/bars
  const chartPoints: number[] = [];
  let runningTotal = 0;
  // Calculate backwards or forward
  const sortedRecords = [...studentRecords].reverse();
  sortedRecords.forEach(r => {
    runningTotal += r.points;
    chartPoints.push(runningTotal);
  });
  if (chartPoints.length === 0) chartPoints.push(0);

  const maxVal = Math.max(10, ...chartPoints);
  const minVal = Math.min(0, ...chartPoints);
  const range = maxVal - minVal || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-right my-8 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header / Student Identity */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {student.name.charAt(0)}
              </div>
              {isLeader && (
                <div
                  className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 p-1 rounded-full shadow-xs"
                  title="قائد المجموعة الحالية"
                >
                  <Crown className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    className="px-3 py-1 text-base font-bold rounded-lg border border-indigo-400 bg-slate-50 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg text-xs"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {student.name}
                  </h2>
                  {authState.isAuthenticated && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="تعديل اسم الطالب"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{currentClass?.name || 'الصف التاسع'}</span>
                <span>·</span>
                {currentGroup ? (
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {currentGroup.name} {isLeader && '(قائد المجموعة)'}
                  </span>
                ) : (
                  <span>لم يتم توزيعه في مجموعة</span>
                )}
                <span>·</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {levelInfo.title} (المستوى {levelInfo.level})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAwardPoints(student.id)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>إضافة نقاط</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
              صافي النقاط
            </span>
            <div className="text-2xl font-black text-indigo-900 dark:text-indigo-200 font-mono tabular-nums">
              {student.netPoints}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              الحصة الحالية: {student.sessionPoints}
            </span>
          </div>

          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
              النقاط الإيجابية
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
              +{student.positivePoints}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              {positiveRecords.length} عملية تعزيز
            </span>
          </div>

          <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/50">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-1">
              النقاط السلبية
            </span>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono tabular-nums">
              -{student.negativePoints}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              {negativeRecords.length} خصم مسجل
            </span>
          </div>

          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/50">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block mb-1">
              نسبة الإتقان
            </span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono tabular-nums">
              {student.correctAnswers + student.incorrectAnswers > 0
                ? `${Math.round(
                    (student.correctAnswers /
                      (student.correctAnswers + student.incorrectAnswers)) *
                      100
                  )}%`
                : '100%'}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              {student.correctAnswers} صحيحة / {student.incorrectAnswers} خاطئة
            </span>
          </div>
        </div>

        {/* Motivational Level Progress Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>المستوى التحفيزي: {levelInfo.title}</span>
            </span>
            <span className="text-slate-500">
              <span className="font-mono tabular-nums">{student.netPoints} / {levelInfo.nextPoints}</span> نقطة
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-linear-to-r from-indigo-500 to-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Participation Metrics Strip */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs mb-6 text-center">
          <div>
            <span className="text-slate-500 block mb-0.5">إجمالي المشاركات</span>
            <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
              {student.participations}
            </span>
          </div>
          <div className="border-x border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block mb-0.5">مرات الاختيار عشوائيًا</span>
            <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
              {student.randomPickCount}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">مرات قيادة المجموعة</span>
            <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
              {student.leadershipCount}
            </span>
          </div>
        </div>

        {/* Student Performance Progression Chart */}
        <div className="mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>تطور أداء ونقاط الطالب عبر الحصص</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {studentRecords.length} سجلات تفاعلية
            </span>
          </div>

          <div className="h-28 w-full flex items-end gap-1.5 pt-4 px-2">
            {chartPoints.map((val, idx) => {
              const heightPercent = Math.max(10, Math.min(100, ((val - minVal) / range) * 100));
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className="w-full bg-indigo-500 dark:bg-indigo-600 rounded-t-sm group-hover:bg-amber-500 transition-colors"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap z-10 transition-opacity">
                    {val} نقطة
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges / Medals Grid */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>الأوسمة وبطاقات الإنجاز</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {badges.map(b => (
              <div
                key={b.id}
                className={`p-3 rounded-xl border text-right transition-colors ${
                  b.earned
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                    : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{b.icon}</span>
                  <span className={`text-xs font-bold ${b.earned ? 'text-amber-900 dark:text-amber-200' : 'text-slate-500'}`}>
                    {b.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Deductions & Positive Operations Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Rewards Log */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>سجل المكافآت والتعزيز ({positiveRecords.length})</span>
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {positiveRecords.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد سجلات تعزيز حتى الآن</p>
              ) : (
                positiveRecords.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{r.reason}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      +{r.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deductions Log */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-1.5">
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>سجل الخصومات والمخالفات ({negativeRecords.length})</span>
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {negativeRecords.length === 0 ? (
                <p className="text-xs text-slate-400">سجل الطالب ناصع بدون أي خصومات</p>
              ) : (
                negativeRecords.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{r.reason}</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                      {r.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Teacher Notes Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>ملاحظات المعلم الخاصة بالطالب</span>
            </label>
            {notesSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                تم الحفظ
              </span>
            )}
          </div>

          <textarea
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            disabled={!authState.isAuthenticated}
            placeholder={
              authState.isAuthenticated
                ? 'اكتب أي ملاحظات تربوية أو تعليمية حول مهارات الطالب الرياضية، التزامه، أو جوانب التحسن...'
                : 'تسجيل دخول المعلم مطلوب لتعديل الملاحظات'
            }
            rows={3}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {authState.isAuthenticated && (
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingNotes ? 'جارٍ الحفظ...' : 'حفظ الملاحظات'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
