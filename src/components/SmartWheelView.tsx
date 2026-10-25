import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { ClassId, Student, Group } from '../types';
import { triggerCelebration } from '../utils/celebration';
import { soundEffects } from '../utils/soundEffects';
import {
  Shuffle,
  Play,
  RotateCw,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Filter,
  Volume2,
  Sparkles,
  X
} from 'lucide-react';

interface SmartWheelViewProps {
  classId: ClassId;
  onOpenAuth: () => void;
}

export const SmartWheelView: React.FC<SmartWheelViewProps> = ({ classId, onOpenAuth }) => {
  const { data, recordStudentPick, addStudentPoints, authState } = useClassroom();

  const [mode, setMode] = useState<'class' | 'group'>('class');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [excludeRecentlyPicked, setExcludeRecentlyPicked] = useState(true);
  const [prioritizeLeastParticipated, setPrioritizeLeastParticipated] = useState(false);
  const [allowImmediateRepeat, setAllowImmediateRepeat] = useState(false);
  const [recentlyPickedIds, setRecentlyPickedIds] = useState<string[]>([]);
  const [lastPickedStudentId, setLastPickedStudentId] = useState<string | null>(null);

  // Wheel animation states
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerStudent, setWinnerStudent] = useState<Student | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Individual Answer Timer states
  const [timerDuration, setTimerDuration] = useState<number>(15);
  const [timerRemaining, setTimerRemaining] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRotationRef = useRef<number>(0);

  const classStudents = useMemo(() => {
    return data.students.filter(s => s.classId === classId);
  }, [data.students, classId]);

  const classGroups = data.groups[classId] || [];

  // Initialize selected group if available
  useEffect(() => {
    if (classGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(classGroups[0].id);
    }
  }, [classGroups, selectedGroupId]);

  // Candidates calculation based on mode and filters
  const candidateStudents = useMemo(() => {
    let pool = classStudents.filter(s => s.isParticipatingInActivity !== false);

    if (mode === 'group' && selectedGroupId) {
      const targetGroup = classGroups.find(g => g.id === selectedGroupId);
      if (targetGroup) {
        pool = pool.filter(s => targetGroup.memberIds.includes(s.id));
      }
    }

    if (!allowImmediateRepeat && lastPickedStudentId && pool.length > 1) {
      pool = pool.filter(s => s.id !== lastPickedStudentId);
    }

    if (excludeRecentlyPicked && pool.length > 3) {
      const filtered = pool.filter(s => !recentlyPickedIds.includes(s.id));
      if (filtered.length >= 2) {
        pool = filtered;
      }
    }

    if (prioritizeLeastParticipated && pool.length > 2) {
      const minParts = Math.min(...pool.map(s => s.participations));
      const leastActive = pool.filter(s => s.participations <= minParts + 1);
      if (leastActive.length >= 2) {
        pool = leastActive;
      }
    }

    return pool;
  }, [
    classStudents,
    mode,
    selectedGroupId,
    classGroups,
    allowImmediateRepeat,
    lastPickedStudentId,
    excludeRecentlyPicked,
    recentlyPickedIds,
    prioritizeLeastParticipated
  ]);

  // Render canvas wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2 - 10;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    const count = candidateStudents.length;
    if (count === 0) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 14px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('لا يوجد طلاب مرشحون حالياً', centerX, centerY);
      return;
    }

    const anglePerSlice = (Math.PI * 2) / count;
    const colors = [
      '#4F46E5', '#2563EB', '#059669', '#D97706', '#DC2626',
      '#7C3AED', '#0891B2', '#EA580C', '#10B981', '#6366F1'
    ];

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotationRef.current);

    for (let i = 0; i < count; i++) {
      const startAngle = i * anglePerSlice;
      const endAngle = startAngle + anglePerSlice;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Text label inside slice
      ctx.save();
      ctx.rotate(startAngle + anglePerSlice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Cairo, sans-serif';

      // Truncate name for slice
      const rawName = candidateStudents[i].name;
      const shortName = rawName.split(' ').slice(0, 2).join(' ');
      ctx.fillText(shortName, radius - 20, 4);
      ctx.restore();
    }

    ctx.restore();

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 12px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('رياضيات', centerX, centerY);
  }, [candidateStudents]);

  // Spin the Wheel Animation
  const handleSpinWheel = () => {
    if (isSpinning || candidateStudents.length === 0) return;

    setIsSpinning(true);
    setShowWinnerModal(false);

    // Pick winner with uniform randomness
    const winnerIndex = Math.floor(Math.random() * candidateStudents.length);
    const chosen = candidateStudents[winnerIndex];

    const count = candidateStudents.length;
    const sliceAngle = (Math.PI * 2) / count;
    // Align top pointer (at 3*PI/2) with selected slice center
    const targetSliceAngle = (count - winnerIndex - 0.5) * sliceAngle;
    const extraFullRotations = (5 + Math.floor(Math.random() * 3)) * (Math.PI * 2);
    const finalRotation = extraFullRotations + targetSliceAngle;

    const startRot = currentRotationRef.current % (Math.PI * 2);
    const totalChange = finalRotation - startRot;
    const duration = 3800;
    const startTime = Date.now();

    let lastTickTime = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      currentRotationRef.current = startRot + totalChange * ease;

      // Tick sound
      if (now - lastTickTime > 120 + progress * 200) {
        soundEffects.playTick();
        lastTickTime = now;
      }

      // Re-render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const radius = width / 2 - 10;
          const centerX = width / 2;
          const centerY = height / 2;

          ctx.clearRect(0, 0, width, height);

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(currentRotationRef.current);

          const anglePerSlice = (Math.PI * 2) / count;
          const colors = [
            '#4F46E5', '#2563EB', '#059669', '#D97706', '#DC2626',
            '#7C3AED', '#0891B2', '#EA580C', '#10B981', '#6366F1'
          ];

          for (let i = 0; i < count; i++) {
            const startAngle = i * anglePerSlice;
            const endAngle = startAngle + anglePerSlice;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();

            ctx.save();
            ctx.rotate(startAngle + anglePerSlice / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Cairo, sans-serif';
            const shortName = candidateStudents[i].name.split(' ').slice(0, 2).join(' ');
            ctx.fillText(shortName, radius - 20, 4);
            ctx.restore();
          }

          ctx.restore();

          // Center Hub
          ctx.beginPath();
          ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
          ctx.fillStyle = '#0F172A';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();
          ctx.fillStyle = '#F8FAFC';
          ctx.font = 'bold 12px Cairo, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('رياضيات', centerX, centerY);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWinnerStudent(chosen);
        setShowWinnerModal(true);
        setLastPickedStudentId(chosen.id);
        setRecentlyPickedIds(prev => [chosen.id, ...prev.slice(0, 4)]);
        recordStudentPick(chosen.id);

        // Sound & Confetti celebration
        soundEffects.playVictoryFanfare();
        triggerCelebration();

        // Reset timer
        setTimerRemaining(timerDuration);
        setIsTimerRunning(false);
      }
    };

    requestAnimationFrame(animate);
  };

  // Timer Tick Hook
  useEffect(() => {
    if (isTimerRunning && timerRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            soundEffects.playTimerEnded();
            return 0;
          }
          if (prev <= 4) {
            soundEffects.playWarningTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerRemaining]);

  const handleStartTimer = (secs: number) => {
    setTimerDuration(secs);
    setTimerRemaining(secs);
    setIsTimerRunning(true);
  };

  const handleToggleTimer = () => {
    if (timerRemaining === 0) {
      setTimerRemaining(timerDuration);
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(!isTimerRunning);
    }
  };

  const handleAwardAnswer = async (points: number, reason: string) => {
    if (!winnerStudent) return;
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }
    await addStudentPoints(winnerStudent.id, points, reason);
    setShowWinnerModal(false);
  };

  const targetGroupObj = classGroups.find(g => g.id === selectedGroupId);

  return (
    <div className="space-y-6">
      {/* Top Config Deck */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                العجلة الذكية للاختيار العشوائي
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اختيار عادل ومحفز للطلاب مع مؤقت إجابة فوري وتعزيز مباشر
              </p>
            </div>
          </div>

          {/* Mode Switcher: Whole Class vs Group */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMode('class')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'class'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              اختيار من الفصل كاملًا
            </button>
            <button
              onClick={() => setMode('group')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'group'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              اختيار من داخل مجموعة
            </button>
          </div>
        </div>

        {/* Group Selector if mode is 'group' */}
        {mode === 'group' && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              اختر المجموعة المستهدفة:
            </span>
            <div className="flex flex-wrap gap-2">
              {classGroups.map(grp => (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroupId(grp.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${
                    selectedGroupId === grp.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {grp.name} ({grp.memberIds.length} طلاب)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fairness Filters Checklist */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excludeRecentlyPicked}
              onChange={e => setExcludeRecentlyPicked(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>استبعاد من تم اختيارهم مؤخرًا ({recentlyPickedIds.length})</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={prioritizeLeastParticipated}
              onChange={e => setPrioritizeLeastParticipated(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>أولوية للأقل مشاركة (مع بقاء الاختيار عشوائيًا)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allowImmediateRepeat}
              onChange={e => setAllowImmediateRepeat(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>السماح بتكرار الطالب نفسه مرتين متتاليتين</span>
          </label>
        </div>
      </div>

      {/* Main Wheel Stage */}
      <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
        {/* Pointer Triangle at Top */}
        <div className="z-10 -mb-3 drop-shadow-md">
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-amber-500" />
        </div>

        {/* Wheel Canvas */}
        <div className="relative p-2 rounded-full bg-slate-100 dark:bg-slate-800 shadow-inner">
          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            className="w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] transition-transform rounded-full shadow-lg"
          />
        </div>

        {/* Big Action Button */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleSpinWheel}
            disabled={isSpinning || candidateStudents.length === 0}
            className="px-8 py-3.5 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-base font-black rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2.5"
          >
            <Shuffle className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>
              {isSpinning
                ? 'جارٍ تدوير العجلة والاختيار...'
                : mode === 'class'
                ? 'اختر طالبًا عشوائيًا من الفصل'
                : `اختر طالبًا من (${targetGroupObj?.name || 'المجموعة'})`}
            </span>
          </button>

          <span className="text-xs text-slate-400">
            عدد المرشحين المؤهلين للاختيار الآن:{' '}
            <strong className="text-slate-700 dark:text-slate-200 font-mono tabular-nums">
              {candidateStudents.length}
            </strong>{' '}
            طالبًا
          </span>
        </div>
      </div>

      {/* Winner Reveal & Answer Timer Modal */}
      {showWinnerModal && winnerStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center relative overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setShowWinnerModal(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Celebratory Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الطالب المختار للإجابة!</span>
            </div>

            {/* Student Name */}
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-1">
              {winnerStudent.name}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {data.classes[winnerStudent.classId]?.name} · {winnerStudent.netPoints} نقطة · {winnerStudent.participations} مشاركة سابقة
            </p>

            {/* Built-in Answer Countdown Timer */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl mb-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>مؤقت الإجابة</span>
                </span>

                {/* Preset Durations */}
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  {[10, 15, 20, 30, 60].map(s => (
                    <button
                      key={s}
                      onClick={() => handleStartTimer(s)}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        timerDuration === s
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-mono">{s}</span>
                      <span className="font-sans">ث</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Large Digital Timer Display */}
              <div
                className={`text-5xl font-black my-2 transition-colors ${
                  timerRemaining <= 3 && timerRemaining > 0
                    ? 'text-rose-600 animate-pulse'
                    : timerRemaining === 0
                    ? 'text-rose-600'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <span className="font-mono tabular-nums">{timerRemaining}</span>
                <span className="text-lg font-normal text-slate-400 mr-1 font-sans"> ثانية</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timerRemaining <= 3 ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${(timerRemaining / timerDuration) * 100}%` }}
                />
              </div>

              {/* Play / Pause Toggle */}
              <button
                onClick={handleToggleTimer}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-xl shadow-2xs hover:bg-slate-100"
              >
                {isTimerRunning ? 'إيقاف مؤقت' : timerRemaining === 0 ? 'إعادة المؤقت' : 'بدء العد التنازلي'}
              </button>
            </div>

            {/* Quick Answer Outcome Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block">تسجيل نتيجة السؤال:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleAwardAnswer(2, 'إجابة صحيحة')}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>صحيحة (+2)</span>
                </button>
                <button
                  onClick={() => handleAwardAnswer(3, 'إجابة متميزة')}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>متميزة (+3)</span>
                </button>
                <button
                  onClick={() => handleAwardAnswer(0, 'إجابة خاطئة')}
                  className="p-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>خاطئة</span>
                </button>
                <button
                  onClick={() => handleAwardAnswer(0, 'انتهى الوقت المسموح')}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>انتهى الوقت</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
