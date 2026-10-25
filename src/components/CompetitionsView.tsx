import React, { useState, useEffect, useRef } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { ClassId, CompetitionType, Group } from '../types';
import { soundEffects } from '../utils/soundEffects';
import { triggerCelebration } from '../utils/celebration';
import {
  Trophy,
  Swords,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Sparkles,
  Award,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Users
} from 'lucide-react';

interface CompetitionsViewProps {
  classId: ClassId;
  onOpenAuth: () => void;
}

const COMPETITION_TYPES: { id: CompetitionType; title: string; icon: string; desc: string; defaultDuration: number; defaultPoints: number }[] = [
  { id: 'quick_question', title: 'سؤال سريع', icon: '⚡', desc: 'سؤال مباشر يتطلب بديهة رياضية فورية', defaultDuration: 15, defaultPoints: 2 },
  { id: 'fastest_correct', title: 'أسرع إجابة صحيحة', icon: '⏱️', desc: 'المجموعة الأولى التي تقدم الحل الدقيق الصحيح', defaultDuration: 20, defaultPoints: 3 },
  { id: 'problem_solving', title: 'تحدي حل مسألة', icon: '📐', desc: 'مسألة رياضية متعددة الخطوات تتطلب برهانًا أو خطوات تفصيلية', defaultDuration: 60, defaultPoints: 5 },
  { id: 'true_false', title: 'تحدي صح أم خطأ', icon: '⚖️', desc: 'التحقق من صحة فرضية أو قانون رياضي مع التعليل', defaultDuration: 15, defaultPoints: 2 },
  { id: 'multiple_choice', title: 'تحدي الاختيار من متعدد', icon: '🔢', desc: 'سؤال ذو أربعة خيارات لاختبار الفهم النظري والحسابي', defaultDuration: 25, defaultPoints: 3 },
  { id: 'group_thinking', title: 'تحدي التفكير الجماعي', icon: '💡', desc: 'مسألة عميقة تستلزم تضافر جهود جميع أعضاء المجموعة', defaultDuration: 90, defaultPoints: 5 },
  { id: 'final_round', title: 'الجولة النهائية بين المتصدرين', icon: '🏆', desc: 'تحدٍ حاسم ومثير بين أعلى مجموعتين في النقاط', defaultDuration: 45, defaultPoints: 6 }
];

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({ classId, onOpenAuth }) => {
  const { data, saveCompetitionResult, authState } = useClassroom();

  const groups = data.groups[classId] || [];

  const [selectedType, setSelectedType] = useState<CompetitionType>('problem_solving');
  const [questionTitle, setQuestionTitle] = useState('أوجد ناتج المعادلة: س² + ٥س + ٦ = ٠ مع ذكر الخطوات');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [pointsReward, setPointsReward] = useState(5);
  const [penaltyPoints, setPenaltyPoints] = useState(0);

  // Participating groups (defaults to all groups in class)
  const [participatingGroupIds, setParticipatingGroupIds] = useState<string[]>([]);

  // Timer states
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Winner modal & idempotent award tracking
  const [winnerGroupId, setWinnerGroupId] = useState<string | null>(null);
  const [isAwarded, setIsAwarded] = useState<boolean>(false);
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);

  // Sync participating groups when groups load or change
  useEffect(() => {
    if (groups.length > 0 && participatingGroupIds.length === 0) {
      setParticipatingGroupIds(groups.map(g => g.id));
    }
  }, [groups, participatingGroupIds.length]);

  // When competition type changes, preset sensible defaults
  const handleTypeSelect = (typeId: CompetitionType) => {
    setSelectedType(typeId);
    const cfg = COMPETITION_TYPES.find(c => c.id === typeId);
    if (cfg) {
      setDurationSeconds(cfg.defaultDuration);
      setTimeRemaining(cfg.defaultDuration);
      setPointsReward(cfg.defaultPoints);
      setTimerStatus('idle');
      setIsAwarded(false);

      if (typeId === 'final_round' && groups.length >= 2) {
        // Pick top 2 groups
        const sorted = [...groups].sort((a, b) => b.netPoints - a.netPoints);
        setParticipatingGroupIds([sorted[0].id, sorted[1].id]);
      } else {
        setParticipatingGroupIds(groups.map(g => g.id));
      }
    }
  };

  // Timer ticker
  useEffect(() => {
    if (timerStatus === 'running' && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerStatus('finished');
            soundEffects.playTimerEnded();
            return 0;
          }
          if (prev <= 5) {
            soundEffects.playWarningTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerStatus, timeRemaining]);

  const handleStartPause = () => {
    if (timerStatus === 'idle') {
      soundEffects.playTone(523.25, 0.2, 'triangle', 0.2);
      setTimerStatus('running');
    } else if (timerStatus === 'running') {
      setTimerStatus('paused');
    } else if (timerStatus === 'paused') {
      setTimerStatus('running');
    } else if (timerStatus === 'finished') {
      setTimeRemaining(durationSeconds);
      setTimerStatus('running');
    }
  };

  const handleResetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerStatus('idle');
    setTimeRemaining(durationSeconds);
  };

  const toggleGroupParticipation = (groupId: string) => {
    if (participatingGroupIds.includes(groupId)) {
      if (participatingGroupIds.length > 2) {
        setParticipatingGroupIds(participatingGroupIds.filter(id => id !== groupId));
      }
    } else {
      setParticipatingGroupIds([...participatingGroupIds, groupId]);
    }
  };

  // Winner declaration with idempotent safeguard
  const handleDeclareWinner = async (grpId: string) => {
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }
    if (isAwarded) return; // Prevent double reward

    setWinnerGroupId(grpId);
    setIsAwarded(true);
    setTimerStatus('finished');
    setShowWinnerModal(true);

    soundEffects.playVictoryFanfare();
    triggerCelebration();

    const selectedConfig = COMPETITION_TYPES.find(c => c.id === selectedType);

    await saveCompetitionResult({
      classId,
      title: questionTitle || selectedConfig?.title || 'تحدي مجموعات',
      type: selectedType,
      participatingGroupIds,
      durationSeconds,
      pointsReward,
      penaltyPoints,
      winnerGroupId: grpId,
      status: 'completed'
    });
  };

  const winningGroup = groups.find(g => g.id === winnerGroupId);

  return (
    <div className="space-y-6">
      {/* Competitions Types Strip */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ساحة التحدي والمنافسات الرياضية
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختر نوع التحدي، وحدد المجموعات المتنافسة والوقت والنقاط الممنوحة للفائز
              </p>
            </div>
          </div>
        </div>

        {/* Types Horizontal Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {COMPETITION_TYPES.map(comp => (
            <button
              key={comp.id}
              onClick={() => handleTypeSelect(comp.id)}
              className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                selectedType === comp.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="text-xl mb-1">{comp.icon}</div>
              <div>
                <span className="text-xs font-bold block leading-snug">{comp.title}</span>
                <span className={`text-[10px] mt-0.5 block ${selectedType === comp.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {comp.defaultDuration} ثانية · +{comp.defaultPoints} ن
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Arena Stage Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Question, Visual Progress Timer, Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question / Title Input */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              عنوان التحدي أو نص السؤال الرياضي المعروض:
            </label>
            <input
              type="text"
              value={questionTitle}
              onChange={e => setQuestionTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm font-bold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="اكتب السؤال الرياضي هنا..."
            />

            {/* Stakes Configuration Strip */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">المدة (بالثواني)</label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={durationSeconds}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10) || 10;
                    setDurationSeconds(val);
                    if (timerStatus === 'idle') setTimeRemaining(val);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">نقاط الفوز (+)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={pointsReward}
                  onChange={e => setPointsReward(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">عقوبة الخطأ (اختياري)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={penaltyPoints}
                  onChange={e => setPenaltyPoints(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold text-rose-600"
                />
              </div>
            </div>
          </div>

          {/* Big Arena Visual Timer Deck */}
          <div className="p-8 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl text-center space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold flex items-center gap-1.5 text-indigo-400">
                <Clock className="w-4 h-4" />
                <span>مؤقت التحدي المباشر</span>
              </span>
              <span className="font-mono tabular-nums">
                متبقي: {timeRemaining} ثانية من أصل {durationSeconds}
              </span>
            </div>

            {/* Huge Digital Countdown Display */}
            <div
              className={`text-6xl sm:text-7xl font-black my-2 transition-colors ${
                timeRemaining <= 5 && timeRemaining > 0
                  ? 'text-rose-500 animate-pulse'
                  : timeRemaining === 0
                  ? 'text-rose-500'
                  : 'text-white'
              }`}
            >
              <span className="font-mono tabular-nums">{timeRemaining}</span>
              <span className="text-xl font-normal text-slate-500 mr-2 font-sans"> ثانية</span>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeRemaining <= 5 ? 'bg-rose-500' : 'bg-linear-to-r from-indigo-500 to-emerald-400'
                }`}
                style={{ width: `${(timeRemaining / durationSeconds) * 100}%` }}
              />
            </div>

            {/* Timer Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleStartPause}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {timerStatus === 'running' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>
                      {timerStatus === 'finished' ? 'إعادة تشغيل المؤقت' : 'بدء التحدي'}
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetTimer}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Participating Groups & Instant Winner Declaration */}
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>المجموعات المشاركة في التحدي</span>
              </h4>
              <span className="text-[11px] text-slate-400">انقر لتتويج الفائز</span>
            </div>

            {groups.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                يرجى تكوين المجموعات أولاً من قسم «المجموعات والقادة»
              </p>
            ) : (
              <div className="space-y-2.5">
                {groups.map(grp => {
                  const isParticipating = participatingGroupIds.includes(grp.id);
                  return (
                    <div
                      key={grp.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isParticipating
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isParticipating}
                          onChange={() => toggleGroupParticipation(grp.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          title="تضمين في التحدي"
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: grp.color || '#2563EB' }}
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {grp.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {grp.netPoints} ن · {grp.challengeWins} فوز
                          </span>
                        </div>
                      </div>

                      {/* Declare Winner Button */}
                      {isParticipating && (
                        <button
                          onClick={() => handleDeclareWinner(grp.id)}
                          disabled={isAwarded}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[11px] font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>إعلان الفائز (+{pointsReward})</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Winner Fanfare Modal */}
      {showWinnerModal && winningGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-4xl mb-4 shadow-inner">
              🏆
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>فوز مستحق في التحدي!</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              {winningGroup.name}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              تمت إضافة <strong className="text-emerald-600">+{pointsReward} نقاط</strong> إلى رصيد المجموعة، وارتفع عدد انتصاراتها إلى{' '}
              <strong className="text-indigo-600">{winningGroup.challengeWins} انتصارات</strong>.
            </p>

            <button
              onClick={() => setShowWinnerModal(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              متابعة الحصة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
