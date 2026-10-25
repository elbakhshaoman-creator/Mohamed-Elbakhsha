import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { ClassId, Student, Group } from '../types';
import { StudentsView } from './StudentsView';
import { GroupsView } from './GroupsView';
import { SmartWheelView } from './SmartWheelView';
import { CompetitionsView } from './CompetitionsView';
import { LeaderboardView } from './LeaderboardView';
import { SessionsView } from './SessionsView';
import { SettingsView } from './SettingsView';
import { StudentProfileModal } from './StudentProfileModal';
import { PointModal } from './PointModal';
import { BigScreenView } from './BigScreenView';
import {
  Users,
  Layers,
  Shuffle,
  Swords,
  Trophy,
  History,
  Settings,
  Play,
  Pause,
  Clock,
  ArrowRight,
  Tv,
  Award,
  Sparkles,
  CheckCircle,
  RotateCcw
} from 'lucide-react';

interface ClassDashboardProps {
  classId: ClassId;
  onOpenAuth: () => void;
}

export type TabType =
  | 'overview'
  | 'students'
  | 'groups'
  | 'wheel'
  | 'competitions'
  | 'leaderboard'
  | 'sessions'
  | 'settings';

export const ClassDashboard: React.FC<ClassDashboardProps> = ({ classId, onOpenAuth }) => {
  const {
    data,
    selectClass,
    activeSession,
    startNewSession,
    endSession,
    undoLastOperation,
    bigScreenMode,
    setBigScreenMode,
    authState
  } = useClassroom();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Selected student for profile modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Point modal targets
  const [pointModalStudent, setPointModalStudent] = useState<Student | null>(null);
  const [pointModalGroup, setPointModalGroup] = useState<Group | null>(null);
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);

  // Master Session Timer (45 minutes default)
  const [sessionSecondsElapsed, setSessionSecondsElapsed] = useState(0);
  const [isSessionTimerRunning, setIsSessionTimerRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeSession && isSessionTimerRunning) {
      interval = setInterval(() => {
        setSessionSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession, isSessionTimerRunning]);

  const currentClass = data.classes[classId];
  const classStudents = data.students.filter(s => s.classId === classId);
  const classGroups = data.groups[classId] || [];
  const classTotalPoints = classStudents.reduce((sum, s) => sum + s.netPoints, 0);

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenStudentPointModal = (student: Student) => {
    setPointModalStudent(student);
    setPointModalGroup(null);
    setIsPointModalOpen(true);
  };

  const handleOpenGroupPointModal = (group: Group) => {
    setPointModalGroup(group);
    setPointModalStudent(null);
    setIsPointModalOpen(true);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'لوحة الحصة', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'students', label: 'إدارة الطلاب', icon: <Users className="w-4 h-4" /> },
    { id: 'groups', label: 'المجموعات والقادة', icon: <Layers className="w-4 h-4" /> },
    { id: 'wheel', label: 'العجلة الذكية', icon: <Shuffle className="w-4 h-4" /> },
    { id: 'competitions', label: 'ساحة التحدي', icon: <Swords className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'لوحة المتصدرين', icon: <Trophy className="w-4 h-4" /> },
    { id: 'sessions', label: 'سجل الحصص والتقارير', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Class Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => selectClass(null)}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="العودة إلى اختيار الفصول"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md">
                الصف التاسع
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs text-slate-500">رياضيات</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {currentClass?.name || 'الفصل'}
            </h1>
          </div>
        </div>

        {/* Master Class Session Timer Strip */}
        <div className="flex flex-wrap items-center gap-3">
          {activeSession ? (
            <div className="flex items-center gap-3 p-2.5 px-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden sm:inline">
                  مؤقت الحصة:
                </span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white tabular-nums">
                  {formatSessionTime(sessionSecondsElapsed)}
                </span>
              </div>

              <button
                onClick={() => setIsSessionTimerRunning(!isSessionTimerRunning)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={isSessionTimerRunning ? 'إيقاف مؤقت' : 'استئناف'}
              >
                {isSessionTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (!authState.isAuthenticated) {
                  onOpenAuth();
                  return;
                }
                startNewSession(classId);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              <span>بدء الحصة وتفعيل المؤقت</span>
            </button>
          )}

          {/* Quick Undo Button */}
          <button
            onClick={() => undoLastOperation(classId)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            title="تراجع عن آخر عملية نقاط"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تراجع</span>
          </button>

          {/* Big Screen View Toggle */}
          <button
            onClick={() => setBigScreenMode(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            title="فتح وضع العرض للشاشة الكبيرة والبروجكتر"
          >
            <Tv className="w-4 h-4" />
            <span>شاشة العرض</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Pills Summary */}
      <div className="grid grid-cols-3 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block -mb-0.5">إجمالي الطلاب</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {classStudents.length}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block -mb-0.5">المجموعات النشطة</span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {classGroups.length}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block -mb-0.5">مجموع نقاط الفصل</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
              {classTotalPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto border border-slate-200/80 dark:border-slate-700/60">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Launchpad for Live In-Class Teaching */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('wheel')}
              className="p-6 bg-linear-to-br from-indigo-600 to-blue-700 text-white rounded-3xl shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl mb-3">
                  🎯
                </div>
                <h3 className="text-xl font-black">العجلة الذكية للاختيار</h3>
                <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                  اختيار عشوائي عادل لطالب من الفصل أو من مجموعة للإجابة عن السؤال الحالي
                </p>
              </div>
              <span className="text-xs font-bold inline-flex items-center gap-1 text-indigo-100">
                <span>افتح العجلة الآن</span>
                <span>←</span>
              </span>
            </div>

            <div
              onClick={() => setActiveTab('competitions')}
              className="p-6 bg-linear-to-br from-amber-600 to-orange-700 text-white rounded-3xl shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl mb-3">
                  ⚔️
                </div>
                <h3 className="text-xl font-black">ساحة التحديات والمنافسات</h3>
                <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                  بدء منافسة تفاعلية بين المجموعات مع مؤقت مرئي كبير وتتويج الفائز
                </p>
              </div>
              <span className="text-xs font-bold inline-flex items-center gap-1 text-amber-100">
                <span>ابدأ التحدي</span>
                <span>←</span>
              </span>
            </div>

            <div
              onClick={() => setActiveTab('groups')}
              className="p-6 bg-linear-to-br from-emerald-600 to-teal-700 text-white rounded-3xl shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl mb-3">
                  👥
                </div>
                <h3 className="text-xl font-black">إدارة المجموعات والقادة</h3>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                  توزيع عشوائي متوازن من ٥ أو ٦ طلاب وتعيين عادل للقادة
                </p>
              </div>
              <span className="text-xs font-bold inline-flex items-center gap-1 text-emerald-100">
                <span>استعراض المجموعات</span>
                <span>←</span>
              </span>
            </div>
          </div>

          {/* Quick Students Roster Preview */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                طلاب الفصل ({classStudents.length} طالبًا)
              </h3>
              <button
                onClick={() => setActiveTab('students')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                عرض كافة الطلاب مع البحث ←
              </button>
            </div>

            <StudentsView
              classId={classId}
              onSelectStudent={setSelectedStudent}
              onOpenPointModal={handleOpenStudentPointModal}
              onOpenAuth={onOpenAuth}
            />
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <StudentsView
          classId={classId}
          onSelectStudent={setSelectedStudent}
          onOpenPointModal={handleOpenStudentPointModal}
          onOpenAuth={onOpenAuth}
        />
      )}

      {activeTab === 'groups' && (
        <GroupsView
          classId={classId}
          onOpenPointModal={handleOpenGroupPointModal}
          onSelectStudent={setSelectedStudent}
          onOpenAuth={onOpenAuth}
        />
      )}

      {activeTab === 'wheel' && (
        <SmartWheelView classId={classId} onOpenAuth={onOpenAuth} />
      )}

      {activeTab === 'competitions' && (
        <CompetitionsView classId={classId} onOpenAuth={onOpenAuth} />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardView classId={classId} onSelectStudent={setSelectedStudent} />
      )}

      {activeTab === 'sessions' && (
        <SessionsView classId={classId} onOpenAuth={onOpenAuth} />
      )}

      {activeTab === 'settings' && (
        <SettingsView onOpenAuth={onOpenAuth} />
      )}

      {/* Modals */}
      <StudentProfileModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onAwardPoints={stId => {
          const st = classStudents.find(s => s.id === stId);
          if (st) handleOpenStudentPointModal(st);
        }}
      />

      <PointModal
        isOpen={isPointModalOpen}
        student={pointModalStudent}
        group={pointModalGroup}
        onClose={() => setIsPointModalOpen(false)}
        onOpenAuth={onOpenAuth}
      />

      {bigScreenMode && (
        <BigScreenView
          classId={classId}
          onClose={() => setBigScreenMode(false)}
        />
      )}
    </div>
  );
};
