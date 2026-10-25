import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { soundEffects } from '../utils/soundEffects';
import {
  Settings,
  Shield,
  Volume2,
  Moon,
  Sun,
  Database,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lock,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface SettingsViewProps {
  onOpenAuth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAuth }) => {
  const { data, updateSettings, resetAllData, authState } = useClassroom();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleTestSound = (type: 'correct' | 'point' | 'fanfare') => {
    if (type === 'correct') soundEffects.playCorrect();
    if (type === 'point') soundEffects.playPointAwarded();
    if (type === 'fanfare') soundEffects.playVictoryFanfare();
  };

  const handleResetData = async () => {
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }
    const success = await resetAllData();
    setShowResetConfirm(false);
    if (success) {
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Sound & Audio Settings */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              المؤثرات الصوتية والتحكم العام
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              أصوات احتفالية مولدة برمجيًا دون أي ملفات خارجية
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={data.settings.soundEnabled}
              onChange={e => updateSettings({ soundEnabled: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>تفعيل المؤثرات الصوتية في المنصة</span>
          </label>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">مستوى الصوت:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={data.settings.soundVolume}
              onChange={e => updateSettings({ soundVolume: parseFloat(e.target.value) })}
              className="w-28 accent-indigo-600"
            />
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {Math.round(data.settings.soundVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Test Sound Tones */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <span className="text-xs text-slate-400 ml-1">تجربة النغمات:</span>
          <button
            onClick={() => handleTestSound('point')}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs rounded-lg"
          >
            نغمة النقطة
          </button>
          <button
            onClick={() => handleTestSound('correct')}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs rounded-lg"
          >
            إجابة صحيحة
          </button>
          <button
            onClick={() => handleTestSound('fanfare')}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs rounded-lg"
          >
            موسيقى الفوز
          </button>
        </div>
      </div>

      {/* Group Point Synchronization Preference */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          تزامن نقاط المجموعات مع الطلاب
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          تحديد ما إذا كانت نقاط المجموعة تنعكس تلقائيًا على رصيد كل عضو في المجموعة أم تظل مستقلة
        </p>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
          <input
            type="checkbox"
            checked={data.settings.allowDirectStudentPointsFromGroup}
            onChange={e =>
              updateSettings({
                allowDirectStudentPointsFromGroup: e.target.checked
              })
            }
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
          />
          <span>إضافة نقاط المجموعة تلقائيًا إلى أرصدة الأعضاء الفردية</span>
        </label>
      </div>

      {/* Teacher Security Account Card - Google OAuth */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                حساب مالك المنصة ونظام المصادقة (Google OAuth)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل الدخول عبر حساب Google الموثق مع التحقق الصارم على مستوى الخادم
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>إدارة تسجيل الدخول</span>
          </button>
        </div>

        {/* Current Auth Status Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">حساب المالك المصرح له بالإدارة:</div>
              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {authState.ownerEmail || 'elbakhshaoman@gmail.com'}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>حساب المالك الحصري</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">حالة الجلسة الحالية:</div>
              {authState.isAuthenticated ? (
                authState.isOwner ? (
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>مسجل الدخول كمالك المنصة ({authState.userEmail || authState.teacherName})</span>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>مسجل بحساب غير مصرح له بالإدارة: ({authState.userEmail}) - وضع المشاهدة فقط</span>
                  </div>
                )
              ) : (
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Lock className="w-4 h-4" />
                  <span>غير مسجل الدخول (وضع المشاهدة للزوار والطلاب)</span>
                </div>
              )}
            </div>

            <button
              onClick={onOpenAuth}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                authState.isAuthenticated
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{authState.isAuthenticated ? 'تغيير الحساب أو فحص الصلاحيات' : 'تسجيل الدخول باستخدام Google'}</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
          <p className="font-bold text-indigo-700 dark:text-indigo-300">ميزات الحماية والأمان على الخادم:</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
            <li>يتم فحص هوية حساب Google وتطابق البريد الإلكتروني على الخادم الخلفي في كل طلب تعديل أو حذف.</li>
            <li>العمليات المحمية: إضافة وتعديل النقاط، إدارة المجموعات، حفظ سجلات الحصص، وإعادة ضبط البيانات.</li>
            <li>أي محاولة لتعديل البيانات من حساب غير حساب المالك تُرفض فوراً برمز الاستجابة 403 Forbidden.</li>
          </ul>
        </div>
      </div>

      {/* Dangerous Action: Reset Database to Original 73 Students */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-300">
              إعادة ضبط البيانات إلى الحالة الأصلية
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400">
              استعادة قائمة الطلاب الـ 73 الأصلية مع تصفير كافة النقاط والمجموعات
            </p>
          </div>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>تمت استعادة البيانات الأصلية بنجاح</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            تتطلب هذه العملية تأكيدًا صريحًا من المعلم المسؤول
          </span>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            إعادة ضبط البيانات
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="تأكيد إعادة ضبط البيانات بالكامل"
        message="هل أنت متأكد من رغبتك في إعادة ضبط المنصة بالكامل؟ ستتم استعادة قائمة الـ 73 طالبًا الأصلية وتصفير كافة السجلات والنقاط السابقة بصورة نهائية."
        confirmLabel="نعم، أعد ضبط البيانات"
        cancelLabel="إلغاء التراجع"
        isDestructive={true}
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
