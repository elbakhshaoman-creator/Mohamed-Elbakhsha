import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { Student, Group } from '../types';
import { X, Award, AlertTriangle, Plus, Minus, Check } from 'lucide-react';

interface PointModalProps {
  isOpen: boolean;
  student?: Student | null;
  group?: Group | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const PointModal: React.FC<PointModalProps> = ({
  isOpen,
  student,
  group,
  onClose,
  onOpenAuth
}) => {
  const { data, addStudentPoints, addGroupPoints, authState } = useClassroom();
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [customPoints, setCustomPoints] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [showConfirmDeduction, setShowConfirmDeduction] = useState<boolean>(false);
  const [pendingPoints, setPendingPoints] = useState<number>(0);
  const [pendingReason, setPendingReason] = useState<string>('');

  if (!isOpen || (!student && !group)) return null;

  const targetName = student ? student.name : group ? group.name : '';
  const isStudent = Boolean(student);

  const positivePresets = isStudent
    ? data.settings.positivePresets
    : data.settings.groupPositivePresets;

  const negativePresets = isStudent
    ? data.settings.negativePresets
    : data.settings.groupNegativePresets;

  const executeAddPoints = async (pts: number, rsn: string) => {
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (isStudent && student) {
      await addStudentPoints(student.id, pts, rsn);
    } else if (group) {
      await addGroupPoints(group.id, pts, rsn);
    }
    onClose();
  };

  const handleSelectPreset = (pts: number, label: string) => {
    if (pts < 0) {
      setPendingPoints(pts);
      setPendingReason(label);
      setShowConfirmDeduction(true);
    } else {
      executeAddPoints(pts, label);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customPoints, 10);
    if (isNaN(val) || val === 0) return;

    const finalPts = activeTab === 'positive' ? Math.abs(val) : -Math.abs(val);
    const finalReason = reason.trim() || (finalPts > 0 ? 'مشاركة رياضية' : 'مخالفة تعليمات');

    if (finalPts < 0) {
      setPendingPoints(finalPts);
      setPendingReason(finalReason);
      setShowConfirmDeduction(true);
    } else {
      executeAddPoints(finalPts, finalReason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-right"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>إدارة النقاط {isStudent ? 'الفردية' : 'الجماعية'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isStudent ? 'الطالب:' : 'المجموعة:'}{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{targetName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Positive / Negative Tabs */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('positive')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'positive'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>نقاط إيجابية (تعزيز)</span>
          </button>
          <button
            onClick={() => setActiveTab('negative')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'negative'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Minus className="w-4 h-4" />
            <span>نقاط سلبية (خصم)</span>
          </button>
        </div>

        {/* Confirmation Overlay for Deductions */}
        {showConfirmDeduction ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 my-4 text-right space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>تأكيد تسجيل الخصم</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              هل أنت متأكد من تسجيل خصم ({Math.abs(pendingPoints)}) نقطة لـ{' '}
              <strong className="text-slate-900 dark:text-white">{targetName}</strong>؟
              <br />
              <span className="text-rose-600 dark:text-rose-400 mt-1 block">السبب: {pendingReason}</span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmDeduction(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              >
                تراجع
              </button>
              <button
                onClick={() => executeAddPoints(pendingPoints, pendingReason)}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
              >
                تأكيد الخصم
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Presets */}
            <div className="space-y-2 mb-5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                أزرار سريعة ومباشرة:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeTab === 'positive'
                  ? positivePresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(preset.points, preset.label)}
                        className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 transition-colors text-right"
                      >
                        <span className="text-xs font-bold">{preset.label}</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                          +{preset.points}
                        </span>
                      </button>
                    ))
                  : negativePresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(preset.points, preset.label)}
                        className="flex items-center justify-between p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-900 dark:text-rose-200 transition-colors text-right"
                      >
                        <span className="text-xs font-bold">{preset.label}</span>
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                          {preset.points}
                        </span>
                      </button>
                    ))}
              </div>
            </div>

            {/* Custom Points & Reason Form */}
            <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                قيمة مخصصة مع سبب اختياري:
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customPoints}
                  onChange={e => setCustomPoints(e.target.value)}
                  className="w-20 px-3 py-2 text-center text-sm font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                  placeholder="النقاط"
                  required
                />
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                  placeholder="اكتب سببًا مختصرًا..."
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 px-4 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
                  activeTab === 'positive'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                تسجيل {activeTab === 'positive' ? 'التعزيز' : 'الخصم'} المخصص
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
