import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { ClassId, ClassSession } from '../types';
import {
  Calendar,
  Clock,
  Play,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  History,
  Download,
  GitCompare,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface SessionsViewProps {
  classId: ClassId;
  onOpenAuth: () => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({ classId, onOpenAuth }) => {
  const { data, startNewSession, endSession, authState } = useClassroom();

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [selectedSessionForCompare1, setSelectedSessionForCompare1] = useState<string>('');
  const [selectedSessionForCompare2, setSelectedSessionForCompare2] = useState<string>('');
  const [showPrintReport, setShowPrintReport] = useState(false);

  const classSessions = data.sessions.filter(s => s.classId === classId);
  const activeSession = classSessions.find(s => s.isActive);
  const currentClass = data.classes[classId];
  const classStudents = data.students.filter(s => s.classId === classId);

  const handleStart = async () => {
    if (!authState.isAuthenticated) {
      onOpenAuth();
      return;
    }
    await startNewSession(classId);
  };

  const handleEnd = async () => {
    if (!activeSession) return;
    await endSession(activeSession.id);
    setShowEndConfirm(false);
  };

  const handleExportCSV = () => {
    // Generate CSV on client or trigger download
    window.open(`/api/export/csv/${classId}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // Compare sessions data
  const session1 = classSessions.find(s => s.id === selectedSessionForCompare1);
  const session2 = classSessions.find(s => s.id === selectedSessionForCompare2);

  return (
    <div className="space-y-6">
      {/* Session Management Action Banner */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                إدارة الحصص وسجل التقدم الدائم
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                بدء حصص جديدة، أرشفة العمليات، مقارنة أداء الطلاب، وتصدير التقارير الرسمية
              </p>
            </div>
          </div>
        </div>

        {/* Buttons Cluster */}
        <div className="flex flex-wrap items-center gap-2">
          {activeSession ? (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>إنهاء الحصة الحالية وحفظها</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              <span>بدء حصة جديدة</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            title="تصدير جدول الطلاب والنقاط بصيغة CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={() => setShowPrintReport(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            title="معاينة وطباعة التقرير الشامل"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>تقرير قابل للطباعة</span>
          </button>
        </div>
      </div>

      {/* Active Session Status Card (if active) */}
      {activeSession && (
        <div className="p-6 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {activeSession.sessionNumber}
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block -mb-0.5">
                حصة نشطة الآن ومسجلة
              </span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                {activeSession.title}
              </h4>
              <span className="text-xs text-slate-500">
                بدأت في {new Date(activeSession.startTime).toLocaleTimeString('ar-EG')} · {activeSession.totalOperations} عمليات مسجلة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1.5 rounded-xl">
              تصفير نقاط الحصة مفعل مع بقاء الرصيد التراكمي
            </span>
          </div>
        </div>
      )}

      {/* Sessions Archive Timeline */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-500" />
          <span>سجل وأرشيف الحصص السابقة ({classSessions.length})</span>
        </h4>

        {classSessions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            لا توجد حصص سابقة مسجلة لهذا الفصل حتى الآن
          </p>
        ) : (
          <div className="space-y-3">
            {classSessions.map(sess => (
              <div
                key={sess.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    sess.isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {sess.sessionNumber}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">
                      {sess.title}
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      {new Date(sess.startTime).toLocaleDateString('ar-EG')} · {sess.totalOperations} عمليات تفاعلية
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  {sess.isActive ? (
                    <span className="text-emerald-600 font-bold">نشطة حاليًا</span>
                  ) : (
                    <span className="text-slate-500">مكتملة ومحفوظة</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Comparison Tool */}
      {classSessions.length >= 2 && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              مقارنة أداء الطلاب بين حصتين
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">الحصة الأولى:</label>
              <select
                value={selectedSessionForCompare1}
                onChange={e => setSelectedSessionForCompare1(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
              >
                <option value="">اختر الحصة الأولى...</option>
                {classSessions.map(s => (
                  <option key={s.id} value={s.id}>
                    الحصة {s.sessionNumber}: {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">الحصة الثانية:</label>
              <select
                value={selectedSessionForCompare2}
                onChange={e => setSelectedSessionForCompare2(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
              >
                <option value="">اختر الحصة الثانية...</option>
                {classSessions.map(s => (
                  <option key={s.id} value={s.id}>
                    الحصة {s.sessionNumber}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {session1 && session2 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs space-y-2 mt-4">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                ملخص مقارنة الحصتين:
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                الحصة {session1.sessionNumber} ({session1.totalOperations} عمليات) مقارنة بالحصة{' '}
                {session2.sessionNumber} ({session2.totalOperations} عمليات).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Printable Report Modal */}
      {showPrintReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl p-8 my-8 shadow-2xl space-y-6 text-right print:p-0 print:m-0 print:shadow-none">
            {/* Report Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-black">
                  تقرير أداء الطلاب – {currentClass?.name}
                </h2>
                <span className="text-xs text-slate-500">
                  منصة إدارة الحصة التفاعلية للصف التاسع · مادة الرياضيات · التاريخ:{' '}
                  {new Date().toLocaleDateString('ar-EG')}
                </span>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية</span>
                </button>
                <button
                  onClick={() => setShowPrintReport(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Printable Students Roster Table */}
            <table className="w-full text-right text-xs border border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b">
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">اسم الطالب الكامل</th>
                  <th className="p-2 border text-center">النقاط الإيجابية</th>
                  <th className="p-2 border text-center">النقاط السلبية</th>
                  <th className="p-2 border text-center">صافي النقاط</th>
                  <th className="p-2 border text-center">المشاركات</th>
                  <th className="p-2 border text-center">مرات القيادة</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((st, idx) => (
                  <tr key={st.id} className="border-b">
                    <td className="p-2 border text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border font-bold">{st.name}</td>
                    <td className="p-2 border text-center font-mono text-emerald-600">
                      +{st.positivePoints}
                    </td>
                    <td className="p-2 border text-center font-mono text-rose-600">
                      -{st.negativePoints}
                    </td>
                    <td className="p-2 border text-center font-mono font-bold">
                      {st.netPoints}
                    </td>
                    <td className="p-2 border text-center font-mono">{st.participations}</td>
                    <td className="p-2 border text-center font-mono">{st.leadershipCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm End Session Modal */}
      <ConfirmModal
        isOpen={showEndConfirm}
        title="إنهاء الحصة الحالية"
        message="هل أنت متأكد من إنهاء الحصة الحالية؟ سيتم حفظ كافة النقاط والعمليات والمجموعات في الأرشيف الدائم، وتصفير نقاط الحصة الجديدة دون المساس بالسجل التراكمي."
        confirmLabel="نعم، إنهاء الحصة وحفظها"
        cancelLabel="استمرار الحصة"
        onConfirm={handleEnd}
        onCancel={() => setShowEndConfirm(false)}
      />
    </div>
  );
};
