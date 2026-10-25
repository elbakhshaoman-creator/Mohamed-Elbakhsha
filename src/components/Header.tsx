import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import {
  Volume2,
  VolumeX,
  Tv,
  Lock,
  Unlock,
  Home,
  Moon,
  Sun,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const {
    data,
    selectedClassId,
    selectClass,
    authState,
    logoutTeacher,
    bigScreenMode,
    setBigScreenMode,
    updateSettings
  } = useClassroom();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const currentClass = selectedClassId ? data.classes[selectedClassId] : null;

  const toggleSound = () => {
    updateSettings({ soundEnabled: !data.settings.soundEnabled });
  };

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !data.settings.darkMode });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Title (Single text element wordmark) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => selectClass(null)}
            className="flex items-center gap-2.5 text-right group focus:outline-none"
            aria-label="الرئيسية"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
              ٩
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                منصة إدارة الحصة التفاعلية
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold -mt-0.5 whitespace-nowrap">
                الصف التاسع · رياضيات
              </span>
            </div>
          </button>

          {currentClass && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-3 mr-1">
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {currentClass.name}
              </span>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links (Clean single-line prose links) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => selectClass(null)}
            className={`flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap ${
              !selectedClassId ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
            }`}
          >
            <Home className="w-4 h-4" />
            <span>الفصول الرئيسية</span>
          </button>

          {(['9-1', '9-2', '9-3'] as const).map(cid => (
            <button
              key={cid}
              onClick={() => selectClass(cid)}
              className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap ${
                selectedClassId === cid ? 'text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-600 pb-0.5' : ''
              }`}
            >
              {data.classes[cid].name}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action + Quick Controls Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Big Screen Projector Mode Button */}
          {selectedClassId && (
            <button
              onClick={() => setBigScreenMode(!bigScreenMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                bigScreenMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="شاشة العرض الكبيرة للفصل"
              aria-label="وضع الشاشة الكبيرة"
            >
              <Tv className="w-4 h-4" />
              <span className="hidden sm:inline">شاشة العرض</span>
            </button>
          )}

          {/* Sound Controls with Volume Popover */}
          <div className="relative">
            <button
              onClick={toggleSound}
              onContextMenu={e => {
                e.preventDefault();
                setShowVolumeSlider(!showVolumeSlider);
              }}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
              title={data.settings.soundEnabled ? 'كتم المؤثرات الصوتية (انقر يمين للتحكم بالمستوى)' : 'تشغيل الصوت'}
              aria-label="التحكم بالصوت"
            >
              {data.settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
            title={data.settings.darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            aria-label="تبديل المظهر"
          >
            {data.settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Teacher Auth Badge / Google Sign-In Action */}
          {authState.isOwner ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-2.5 py-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hidden md:inline leading-none font-sans">
                  {authState.teacherName && authState.teacherName !== 'مالك المنصة' ? authState.teacherName : 'أستاذ الرياضيات'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 hidden lg:inline font-sans font-semibold">
                  مالك المنصة (المسؤول)
                </span>
              </div>
              <button
                onClick={logoutTeacher}
                className="text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 mr-1 pr-1.5 border-r border-emerald-200 dark:border-emerald-800"
                title="تسجيل خروج المعلم"
              >
                خروج
              </button>
            </div>
          ) : authState.userEmail ? (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-2.5 py-1.5">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 hidden md:inline">
                زائر ({authState.userEmail.split('@')[0]})
              </span>
              <button
                onClick={onOpenAuth}
                className="text-[11px] text-indigo-600 hover:underline mr-1"
              >
                تبديل
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs transition-all whitespace-nowrap shrink-0"
              aria-label="تسجيل الدخول باستخدام Google"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>تسجيل الدخول باستخدام Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
