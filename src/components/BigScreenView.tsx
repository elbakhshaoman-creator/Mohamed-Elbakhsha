import React, { useState, useEffect } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { ClassId, Student, Group } from '../types';
import {
  Tv,
  X,
  Maximize2,
  Clock,
  Crown,
  Trophy,
  Users,
  Award,
  Sparkles
} from 'lucide-react';

interface BigScreenViewProps {
  classId: ClassId;
  onClose: () => void;
}

export const BigScreenView: React.FC<BigScreenViewProps> = ({ classId, onClose }) => {
  const { data, activeSession } = useClassroom();

  const currentClass = data.classes[classId];
  const groups = data.groups[classId] || [];
  const classStudents = data.students.filter(s => s.classId === classId);

  // Fullscreen toggle helper
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Live sorted groups for big screen
  const sortedGroups = [...groups].sort((a, b) => b.netPoints - a.netPoints);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 sm:p-10 overflow-y-auto selection:bg-indigo-600">
      {/* Big Screen Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg">
            {classId.replace('9-', '')}
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {currentClass?.name || 'الصف التاسع'} – عرض الحصة التفاعلية
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {activeSession ? activeSession.title : 'حصة الرياضيات التفاعلية'} · إجمالي الطلاب:{' '}
              <span className="font-bold text-white font-mono tabular-nums">{classStudents.length}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleFullscreen}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 transition-colors"
            title="ملء الشاشة"
            aria-label="ملء الشاشة"
          >
            <Maximize2 className="w-6 h-6" />
          </button>
          <button
            onClick={onClose}
            className="p-3 bg-rose-600/80 hover:bg-rose-600 rounded-2xl text-white transition-colors"
            title="إغلاق وضع الشاشة الكبيرة"
            aria-label="إغلاق وضع الشاشة الكبيرة"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Big Screen Grid */}
      <div className="flex-1 space-y-8">
        {/* Groups Standings Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-indigo-400">
              <Trophy className="w-6 h-6" />
              <span>لوحة ترتيب المجموعات المباشرة</span>
            </h2>
            <span className="text-sm text-slate-400">
              تحديث فوري مع كل عملية
            </span>
          </div>

          {sortedGroups.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
              <p className="text-lg text-slate-400">لم يتم تكوين مجموعات في هذا الفصل بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedGroups.map((grp, idx) => {
                const members = classStudents.filter(s => grp.memberIds.includes(s.id));
                const leader = classStudents.find(s => s.id === grp.leaderId);

                return (
                  <div
                    key={grp.id}
                    className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div
                      className="p-5 flex items-center justify-between"
                      style={{ backgroundColor: grp.color || '#2563EB' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-lg">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : grp.number}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold">{grp.name}</h3>
                          <span className="text-xs opacity-85">
                            {grp.challengeWins} انتصارات
                          </span>
                        </div>
                      </div>

                      <div className="bg-black/30 backdrop-blur-xs px-3.5 py-1.5 rounded-xl font-mono font-black text-xl tabular-nums">
                        {grp.netPoints > 0 ? `+${grp.netPoints}` : grp.netPoints}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3 flex-1">
                      {/* Leader banner */}
                      <div className="p-2.5 bg-slate-800/80 rounded-xl flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400 fill-current shrink-0" />
                        <span className="text-xs text-slate-400">القائد:</span>
                        <span className="text-xs font-bold text-amber-300 truncate">
                          {leader ? leader.name : 'لم يحدد'}
                        </span>
                      </div>

                      {/* Members */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] text-slate-500 font-semibold block">
                          أعضاء المجموعة:
                        </span>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {members.map(m => (
                            <li
                              key={m.id}
                              className="flex items-center justify-between py-1 border-b border-slate-800/40"
                            >
                              <span className="truncate">{m.name}</span>
                              <span className="text-slate-500 font-bold">
                                <span className="font-mono tabular-nums">{m.netPoints}</span> ن
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
