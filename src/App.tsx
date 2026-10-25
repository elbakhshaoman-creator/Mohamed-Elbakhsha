import React, { useState, useEffect } from 'react';
import { ClassroomProvider, useClassroom } from './context/ClassroomContext';
import { Header } from './components/Header';
import { HomeClassesView } from './components/HomeClassesView';
import { ClassDashboard } from './components/ClassDashboard';
import { AuthModal } from './components/AuthModal';
import { AlertCircle, X } from 'lucide-react';
import { ClassId } from './types';

function MainApp() {
  const { selectedClassId, selectClass, error, clearError, authState } = useClassroom();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Auto-open auth modal if teacher is not yet configured on first launch
  useEffect(() => {
    // If not configured, prompt teacher setup
    if (!authState.isConfigured && !authState.isAuthenticated) {
      // Keep it optional so viewer can browse, but if url has ?setup=1 or prompt
    }

    // Support ?autostart=1 for ultra-mode test runner
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autostart') === '1' && !selectedClassId) {
        selectClass('9-1');
      }
    }
  }, [authState.isConfigured, authState.isAuthenticated, selectedClassId, selectClass]);

  const handleOpenSessionHistory = (classId: ClassId) => {
    selectClass(classId);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Global Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="p-1 text-rose-400 hover:text-rose-600 rounded-lg"
              aria-label="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1">
        {selectedClassId ? (
          <ClassDashboard
            classId={selectedClassId}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        ) : (
          <HomeClassesView
            onOpenSessionHistory={handleOpenSessionHistory}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>منصة إدارة الحصة التفاعلية – الصف التاسع · مادة الرياضيات</span>
          <span>حفظ آمن ومزامنة دائمة للسجلات والنقاط</span>
        </div>
      </footer>

      {/* Teacher Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ClassroomProvider>
      <MainApp />
    </ClassroomProvider>
  );
}
