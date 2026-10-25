import React from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { ClassId } from '../types';
import {
  Users,
  Award,
  Layers,
  Play,
  History,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface HomeClassesViewProps {
  onOpenSessionHistory: (classId: ClassId) => void;
  onOpenAuth: () => void;
}

export const HomeClassesView: React.FC<HomeClassesViewProps> = ({
  onOpenSessionHistory,
  onOpenAuth
}) => {
  const { data, selectClass, startNewSession, authState } = useClassroom();

  const classConfigs: {
    id: ClassId;
    color: string;
    border: string;
    gradient: string;
    badgeColor: string;
    description: string;
  }[] = [
    {
      id: '9-1',
      color: 'text-indigo-600 dark:text-indigo-400',
      border: 'hover:border-indigo-500/50',
      gradient: 'from-indigo-600 to-blue-700',
      badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
      description: 'فصل المبدعين والرواد في الرياضيات'
    },
    {
      id: '9-2',
      color: 'text-emerald-600 dark:text-emerald-400',
      border: 'hover:border-emerald-500/50',
      gradient: 'from-emerald-600 to-teal-700',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      description: 'فصل التفكير الرياضي والحلول الابتكارية'
    },
    {
      id: '9-3',
      color: 'text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-500/50',
      gradient: 'from-amber-600 to-orange-700',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      description: 'فصل التعاون والشغف بالهندسة والجبر'
    }
  ];

  const handleStartSession = async (e: React.MouseEvent, classId: ClassId) => {
    e.stopPropagation();
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }
    await startNewSession(classId);
    selectClass(classId);
  };

  const handleResumeSession = (e: React.MouseEvent, classId: ClassId) => {
    e.stopPropagation();
    selectClass(classId);
  };

  const handleHistory = (e: React.MouseEvent, classId: ClassId) => {
    e.stopPropagation();
    onOpenSessionHistory(classId);
  };

  return (
    <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold backdrop-blur-xs border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>منصة المعلم الذكية لإدارة الرياضيات</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            منصة إدارة الحصة التفاعلية – الصف التاسع
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            مرحبًا بك في لوحة تحكم الحصة التفاعلية. اختر أحد فصول الصف التاسع لبدء تجربة تعليمية شيقة، وتشكيل المجموعات، وإشعال روح التحدي والمنافسة الإيجابية بين الطلاب.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>إجمالي ٧٣ طالبًا مسجلًا</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>٣ فصول دراسية مستقلة</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>مزامنة وحفظ فوري للتقدم</span>
            </div>
          </div>
        </div>

        {/* Subtle decorative background glow */}
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 -top-20 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3 Main Classes Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              فصول الصف التاسع
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              بيانات ومجموعات ونقاط كل فصل مستقلة تمامًا ولا تختلط مع غيرها
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {classConfigs.map(cfg => {
            const classInfo = data.classes[cfg.id];
            const classStudents = data.students.filter(s => s.classId === cfg.id);
            const activeGroups = data.groups[cfg.id] || [];
            const activeSession = data.sessions.find(s => s.classId === cfg.id && s.isActive);
            const classTotalPoints = classStudents.reduce((sum, s) => sum + s.netPoints, 0);

            return (
              <div
                key={cfg.id}
                onClick={() => selectClass(cfg.id)}
                className={`group relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between ${cfg.border}`}
              >
                {/* Header of Card */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${cfg.gradient} text-white flex items-center justify-center font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform`}>
                      {cfg.id.replace('9-', '')}
                    </div>

                    {activeSession ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        حصة نشطة الآن
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        في انتظار بدء الحصة
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {classInfo.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
                    {cfg.description}
                  </p>

                  {/* 3 Key Metrics Strip */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold">الطلاب</span>
                      </div>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
                        {classStudents.length}
                      </span>
                    </div>

                    <div className="text-center border-x border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold">المجموعات</span>
                      </div>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
                        {activeGroups.length}
                      </span>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <Award className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold">النقاط</span>
                      </div>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                        {classTotalPoints}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="space-y-2 pt-2">
                  {activeSession ? (
                    <button
                      onClick={e => handleResumeSession(e, cfg.id)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>استكمال الحصة النشطة ({activeSession.title})</span>
                    </button>
                  ) : (
                    <button
                      onClick={e => handleStartSession(e, cfg.id)}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>بدء حصة جديدة</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => handleHistory(e, cfg.id)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>سجل الحصص السابقة</span>
                    </button>

                    <button
                      onClick={() => selectClass(cfg.id)}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1"
                      title="فتح لوحة الفصل"
                    >
                      <span>دخول</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
