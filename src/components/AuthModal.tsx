import React, { useState, useEffect } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  LogOut,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  UserCheck,
  UserX,
  HelpCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { authState, loginWithGoogle, logoutTeacher, updateAuthConfig } = useClassroom();
  const [activeTab, setActiveTab] = useState<'login' | 'testing' | 'setup_guide'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Testing form states
  const [customTestEmail, setCustomTestEmail] = useState('student.guest@gmail.com');
  const [customTestName, setCustomTestName] = useState('طالب زائر');

  // Google Client ID custom input
  const [clientIdInput, setClientIdInput] = useState(authState.googleClientId || '');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (authState.googleClientId) {
      setClientIdInput(authState.googleClientId);
    }
  }, [authState.googleClientId]);

  // Load Google Identity Services SDK dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('google-gsi-client')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!isOpen) return null;

  // Trigger Google OAuth Sign-In Popup via Google Identity Services
  const handleGoogleOAuthSignIn = async () => {
    setIsLoading(true);
    setFeedbackMsg(null);

    const clientId = authState.googleClientId || (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID;

    // Check if Google Client ID is configured
    if (!clientId) {
      setIsLoading(false);
      setFeedbackMsg({
        type: 'warning',
        text: 'لم يتم ربط Google OAuth Client ID بعد في متغيرات البيئة. يمكنك استخدام وضع التحقق السريع من حساب المالك أو مراجعة دليل الإعداد بالأسفل.'
      });
      setActiveTab('testing');
      return;
    }

    try {
      const gWindow = window as unknown as { google?: { accounts?: { oauth2?: { initTokenClient: (config: unknown) => { requestAccessToken: () => void } } } } };
      if (!gWindow.google?.accounts?.oauth2) {
        setIsLoading(false);
        setFeedbackMsg({
          type: 'error',
          text: 'جاري تحميل مكتبة Google Identity Services... يرجى إعادة المحاولة خلال ثوانٍ'
        });
        return;
      }

      const client = gWindow.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (response: { access_token?: string; error?: string }) => {
          if (response.error || !response.access_token) {
            setIsLoading(false);
            setFeedbackMsg({
              type: 'error',
              text: 'تم إلغاء تسجيل الدخول بحساب Google أو حدث خطأ أثناء التفويض'
            });
            return;
          }

          // Verify token on the backend server
          const result = await loginWithGoogle({ accessToken: response.access_token });
          setIsLoading(false);

          if (result.success) {
            if (result.isOwner) {
              setFeedbackMsg({
                type: 'success',
                text: 'تم التحقق من حساب المالك بنجاح! كافة صلاحيات إدارة الحصة مفعلة.'
              });
              setTimeout(onClose, 1200);
            } else {
              setFeedbackMsg({
                type: 'warning',
                text: result.message || 'تم الدخول كحساب زائر/طالب. لا تملك صلاحيات إدارة الحصة.'
              });
            }
          } else {
            setFeedbackMsg({
              type: 'error',
              text: result.message || 'فشل التحقق من الحساب'
            });
          }
        }
      });

      client.requestAccessToken();
    } catch (err) {
      setIsLoading(false);
      setFeedbackMsg({
        type: 'error',
        text: 'تعذر فتح نافذة تسجيل دخول Google. يرجى التأكد من السماح بالنوافذ المنبثقة'
      });
    }
  };

  // Handle direct account simulation (Requirement 6: test owner vs non-owner account)
  const handleTestLogin = async (email: string, name: string) => {
    setIsLoading(true);
    setFeedbackMsg(null);

    const result = await loginWithGoogle({
      testMode: true,
      email,
      name
    });

    setIsLoading(false);
    if (result.success) {
      if (result.isOwner) {
        setFeedbackMsg({
          type: 'success',
          text: `تم تسجيل الدخول بنجاح بحساب مالك المنصة (${email}). الصلاحيات كاملة.`
        });
        setTimeout(onClose, 1000);
      } else {
        setFeedbackMsg({
          type: 'warning',
          text: `تم تسجيل الدخول بحساب زائر (${email}). ليس لديك صلاحيات إدارة الحصة (الصلاحيات محصورة حصريًا للمالك: ${authState.ownerEmail}).`
        });
      }
    } else {
      setFeedbackMsg({
        type: 'error',
        text: result.message || 'فشل تسجيل الدخول'
      });
    }
  };

  const handleSaveGoogleClientId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    await updateAuthConfig({ googleClientId: clientIdInput.trim() });
    setIsSavingConfig(false);
    setFeedbackMsg({
      type: 'success',
      text: 'تم حفظ Google OAuth Client ID بنجاح'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-right my-6 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                نظام المصادقة وحماية المنصة
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تسجيل الدخول الآمن بحساب Google المعتمد لمالك المنصة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Auth Status Banner */}
        <div className="p-4 rounded-2xl mb-6 border transition-all text-xs flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            {authState.isOwner ? (
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>الحالة الحالية:</span>
                {authState.isOwner ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    مسجل الدخول كمالك المنصة (صلاحيات كاملة)
                  </span>
                ) : authState.userEmail ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    مسجل كحساب زائر ({authState.userEmail}) - للقراءة فقط
                  </span>
                ) : (
                  <span className="text-slate-500">غير مسجل الدخول (وضع المشاهدة)</span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                الحساب المصرح له بالإدارة الوحيد:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
                  {authState.ownerEmail}
                </strong>
              </span>
            </div>
          </div>

          {(authState.isOwner || authState.userEmail) && (
            <button
              onClick={() => logoutTeacher()}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          )}
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-3.5 rounded-2xl mb-6 text-xs flex items-start gap-2.5 border ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : feedbackMsg.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            )}
            <div className="leading-relaxed">{feedbackMsg.text}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            دخول Google
          </button>
          <button
            onClick={() => setActiveTab('testing')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'testing'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            اختبار الحسابات والصلاحيات
          </button>
          <button
            onClick={() => setActiveTab('setup_guide')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'setup_guide'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            دليل إعداد OAuth
          </button>
        </div>

        {/* Tab 1: Google Sign-In Main Button */}
        {activeTab === 'login' && (
          <div className="space-y-6 text-center py-2">
            <div className="max-w-md mx-auto space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                انقر على الزر أدناه لتسجيل الدخول باستخدام حساب Google الخاص بك. يتحقق الخادم مباشرة من البريد الإلكتروني مع Google ويسمح فقط للمالك المصرح له بالإدارة.
              </p>

              {/* Official Google Button Style */}
              <button
                type="button"
                onClick={handleGoogleOAuthSignIn}
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all font-bold text-sm flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {/* Google G Logo SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? 'جاري الاتصال بـ Google...' : 'تسجيل الدخول باستخدام Google'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 text-right leading-relaxed border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                🔒 ضمان الأمان الكامل:
              </span>
              - لا يتم حفظ أي كلمات مرور أو طلبها من المستخدم داخل المنصة.<br />
              - حساب Google المالك المحدد في المنصة هو الوحيد المصرح له (<span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{authState.ownerEmail}</span>).<br />
              - جميع طلبات إضافة النقاط أو الطلاب يتم فحصها على الخادم وقاعدة البيانات مباشرة.
            </div>
          </div>
        )}

        {/* Tab 2: Test Owner vs Non-Owner Account (Requirement 6) */}
        {activeTab === 'testing' && (
          <div className="space-y-5 text-right">
            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
              <strong>فحص الصلاحيات المحمية على الخادم:</strong>
              <p className="mt-1">
                لاختبار وتأكيد أن النظام يمنح الإدارة فقط لحساب المالك ويمنع أي حساب آخر، يمكنك التبديل الفوري بين حساب المالك المعتمد وحساب زائر تجريبي لمشاهدة استجابة الخادم فورًا:
              </p>
            </div>

            {/* Test Button 1: Owner Account */}
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>١. حساب المالك المصرح له (Admin)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block mt-0.5">
                  {authState.ownerEmail}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTestLogin(authState.ownerEmail, 'مالك المنصة')}
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                دخول كمالك
              </button>
            </div>

            {/* Test Button 2: Non-Owner / Guest Account */}
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-amber-600" />
                  <span>٢. حساب Google آخر غير مصرح (Guest)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block mt-0.5">
                  student.guest@gmail.com
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTestLogin('student.guest@gmail.com', 'طالب زائر')}
                disabled={isLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                دخول كزائر
              </button>
            </div>

            {/* Custom Email Tester */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                اختبار بريد Google مخصص للتحقق من رفض الخادم له:
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customTestEmail}
                  onChange={e => setCustomTestEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => handleTestLogin(customTestEmail, customTestName)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
                >
                  فحص البريد
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Google Cloud OAuth Setup Guide */}
        {activeTab === 'setup_guide' && (
          <div className="space-y-4 text-right text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                خطوات تفعيل زر Google Sign-In المباشر في Google Cloud Console:
              </span>
              <ol className="list-decimal list-inside space-y-2 text-[11px]">
                <li>
                  ادخل إلى <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-600 underline">APIs & Services &gt; Credentials</a>).
                </li>
                <li>
                  أنشئ <strong>OAuth Client ID</strong> بنوع <strong>Web Application</strong>.
                </li>
                <li>
                  في خانة <strong>Authorized JavaScript origins</strong>، أضف الرابطين التاليين:
                  <div className="p-2 my-1 bg-slate-200 dark:bg-slate-900 rounded font-mono text-[10px] select-all break-all text-left">
                    https://ais-dev-ptxrag3jc7rdoiovsuo6jj-184019950872.europe-west3.run.app<br />
                    http://localhost:3000
                  </div>
                </li>
                <li>
                  انسخ <strong>Client ID</strong> وضعه في الحقل أدناه أو في متغير البيئة <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code>.
                </li>
              </ol>
            </div>

            {/* Input to save Google Client ID */}
            {authState.isOwner && (
              <form onSubmit={handleSaveGoogleClientId} className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  حفظ Google Client ID في المنصة:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={e => setClientIdInput(e.target.value)}
                    placeholder="xxxx-xxxx.apps.googleusercontent.com"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                  >
                    حفظ
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
