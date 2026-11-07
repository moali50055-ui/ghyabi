import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../services/storage';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  School,
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Award,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { exportAttendanceReportToExcel } from '../../services/excelService';

export const ReportsView: React.FC = () => {
  const { classes, students, records, batches, settings } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<
    'daily' | 'period' | 'class' | 'weekly' | 'monthly' | 'student' | 'top_absent' | 'compare'
  >('daily');

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);
  const activeStudents = useMemo(() => students.filter((s) => !s.isArchived), [students]);

  // 1. Daily Report Data
  const dailyReportData = useMemo(() => {
    const dayRecords = records.filter((r) => r.date === selectedDate);
    const dayBatches = batches.filter((b) => b.date === selectedDate && b.isCompleted);

    // Absent students list
    const absentRecords = dayRecords.filter((r) => r.status === 'absent');
    const absentStudentMap = new Map<string, { student: any; periods: number[]; reasons: string[] }>();

    absentRecords.forEach((r) => {
      const st = students.find((s) => s.id === r.studentId);
      if (!st) return;
      if (!absentStudentMap.has(st.id)) {
        absentStudentMap.set(st.id, { student: st, periods: [], reasons: [] });
      }
      const entry = absentStudentMap.get(st.id)!;
      entry.periods.push(r.period);
      if (r.excuseReason) entry.reasons.push(r.excuseReason);
    });

    return {
      absentList: Array.from(absentStudentMap.values()),
      totalAbsentUnique: absentStudentMap.size,
      totalStudents: activeStudents.length,
      attendanceRate:
        activeStudents.length > 0
          ? Math.round(((activeStudents.length - absentStudentMap.size) / activeStudents.length) * 100)
          : 0,
    };
  }, [records, batches, selectedDate, students, activeStudents]);

  // 7. Top Chronic Absentees Data
  const topAbsentees = useMemo(() => {
    const studentAbsenceCount = new Map<string, { student: any; count: number; periodsList: string[] }>();

    records.forEach((r) => {
      if (r.status === 'absent') {
        const st = students.find((s) => s.id === r.studentId);
        if (!st) return;
        if (!studentAbsenceCount.has(st.id)) {
          studentAbsenceCount.set(st.id, { student: st, count: 0, periodsList: [] });
        }
        const item = studentAbsenceCount.get(st.id)!;
        item.count += 1;
        item.periodsList.push(`${r.date} (ح${r.period})`);
      }
    });

    return Array.from(studentAbsenceCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [records, students]);

  // 8. Class Comparison Data
  const classComparisonData = useMemo(() => {
    return classes.map((cls) => {
      const clsStudents = students.filter((s) => s.classId === cls.id && !s.isArchived);
      const clsRecords = records.filter((r) => r.classId === cls.id);
      const absentCount = clsRecords.filter((r) => r.status === 'absent').length;

      // Unique absent students
      const uniqueAbsents = new Set(
        clsRecords.filter((r) => r.status === 'absent').map((r) => r.studentId)
      ).size;

      const rate = clsStudents.length > 0 ? Math.round((absentCount / (clsStudents.length * 8 || 1)) * 100) : 0;

      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        studentsCount: clsStudents.length,
        totalAbsenceCount: absentCount,
        uniqueAbsentStudentsCount: uniqueAbsents,
        absenceRate: rate,
      };
    }).sort((a, b) => b.totalAbsenceCount - a.totalAbsenceCount);
  }, [classes, students, records]);

  // 6. Individual Student Report
  const individualStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const studentRecords = useMemo(() => {
    if (!selectedStudentId) return [];
    return records
      .filter((r) => r.studentId === selectedStudentId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.period - a.period);
  }, [records, selectedStudentId]);

  // Export handlers
  const handleExportDailyExcel = () => {
    const rows = dailyReportData.absentList.map((item, idx) => ({
      'م': idx + 1,
      'الرقم المدرسي': item.student.schoolId,
      'اسم الطالب': item.student.fullName,
      'الصف الدراسي': classMap.get(item.student.classId) || item.student.classId,
      'الحصص الغائب فيها': item.periods.map((p: number) => `الحصة ${p}`).join(', '),
      'الأسباب المسجلة': item.reasons.join(' | ') || '-',
      'هاتف ولي الأمر': item.student.guardianPhone,
      'التاريخ': selectedDate,
    }));

    exportAttendanceReportToExcel(rows, 'الغياب اليومي', `تقرير_الغياب_اليومي_${selectedDate}`);
  };

  const handleExportTopAbsenteesExcel = () => {
    const rows = topAbsentees.map((item, idx) => ({
      'م': idx + 1,
      'الرقم المدرسي': item.student.schoolId,
      'اسم الطالب': item.student.fullName,
      'الصف الدراسي': classMap.get(item.student.classId) || item.student.classId,
      'إجمالي حصص الغياب': item.count,
      'هاتف ولي الأمر': item.student.guardianPhone,
    }));

    exportAttendanceReportToExcel(rows, 'الطلاب الأكثر غيابا', `تقرير_الطلاب_الأكثر_غيابا`);
  };

  const handleExportComparisonExcel = () => {
    const rows = classComparisonData.map((cls, idx) => ({
      'م': idx + 1,
      'الصف الدراسي': cls.name,
      'عدد الطلاب': cls.studentsCount,
      'الطلاب الغائبون الفريدون': cls.uniqueAbsentStudentsCount,
      'إجمالي حصص الغياب': cls.totalAbsenceCount,
    }));

    exportAttendanceReportToExcel(rows, 'مقارنة الصفوف', `مقارنة_غياب_الصفوف_المدرسية`);
  };

  const reportTabs = [
    { id: 'daily', label: 'التقرير اليومي' },
    { id: 'top_absent', label: 'الأكثر غياباً' },
    { id: 'compare', label: 'مقارنة الصفوف' },
    { id: 'student', label: 'سجل الطالب الفردي' },
    { id: 'class', label: 'تقرير الصف' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Printable Ministry & School Header */}
      <div className="hidden print:flex items-center justify-between p-4 border-b-2 border-slate-900 mb-6 pb-4">
        <div className="text-right">
          <div className="text-sm font-black text-slate-900">{settings.ministryName}</div>
          <div className="text-xs font-bold text-slate-700">{settings.directorate}</div>
          <div className="text-base font-black text-blue-900 mt-1">{settings.schoolName}</div>
          <div className="text-[11px] font-bold text-slate-600 mt-0.5">
            العام الدراسي: {settings.academicYear}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <img
            src="/assets/aistudio/image_8acdb664.png"
            alt="شعار مدرسة قتيبة بن مسلم"
            className="h-16 w-auto object-contain"
          />
          <span className="text-xs font-black text-slate-900 mt-1">نظام الحضور والغياب</span>
        </div>

        <div className="text-left text-xs font-semibold text-slate-700">
          <div className="font-bold text-slate-900">سلطنة عُمان</div>
          <div>تقرير الغياب الرسمي المعتمد</div>
          <div>مدير المدرسة: {settings.principalName}</div>
          <div>تاريخ الطباعة: {new Date().toLocaleDateString('ar-OM')}</div>
        </div>
      </div>

      {/* Screen Header Bar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            نظام التقارير والإحصائيات المدرسية
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            استخراج تقارير دقيقة ومفصلة مع دعم التصدير إلى Excel والطباعة بتنسيق A4 رسمي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            طباعة التقرير (A4)
          </button>
        </div>
      </div>

      {/* Report Tabs Selector */}
      <div className="no-print bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
              activeReportTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DAILY REPORT */}
      {activeReportTab === 'daily' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">تاريخ التقرير:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 cursor-pointer"
              />
            </div>
            <button
              onClick={handleExportDailyExcel}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              تصدير هذا التقرير إلى Excel
            </button>
          </div>

          {/* Stat Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-bold">الطلاب الغائبون الفريدون</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{dailyReportData.totalAbsentUnique} طالب</div>
              <div className="text-[10px] text-slate-400 mt-0.5">غابوا عن حصة واحدة أو أكثر اليوم</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-bold">نسبة الحضور المدرسية</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{dailyReportData.attendanceRate}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">من إجمالي طلاب المدرسة</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-bold">إجمالي طلاب المدرسة</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{dailyReportData.totalStudents} طالب</div>
              <div className="text-[10px] text-slate-400 mt-0.5">في {classes.length} صفاً دراسياً</div>
            </div>
          </div>

          {/* Daily Absent Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-600" />
                كشف بأسماء الطلاب الغائبين في يوم: {selectedDate}
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                العدد: {dailyReportData.absentList.length} طالب
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">م</th>
                    <th className="py-2.5 px-3">الرقم المدرسي</th>
                    <th className="py-2.5 px-4">اسم الطالب رباعي</th>
                    <th className="py-2.5 px-3">الصف</th>
                    <th className="py-2.5 px-3">الحصص التي غاب عنها</th>
                    <th className="py-2.5 px-4">الأسباب والملاحظات</th>
                    <th className="py-2.5 px-3">هاتف ولي الأمر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyReportData.absentList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        لا توجد حالات غياب مسجلة لهذا اليوم.
                      </td>
                    </tr>
                  ) : (
                    dailyReportData.absentList.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700">{item.student.schoolId}</td>
                        <td className="py-2 px-4 font-black text-slate-900">{item.student.fullName}</td>
                        <td className="py-2 px-3 font-bold text-blue-700">
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-50">
                            {classMap.get(item.student.classId)}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {item.periods.map((p: number) => (
                              <span
                                key={p}
                                className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]"
                              >
                                ح{p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-4 text-slate-600 font-medium">
                          {item.reasons.join(' | ') || '-'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">{item.student.guardianPhone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOP ABSENT STUDENTS */}
      {activeReportTab === 'top_absent' && (
        <div className="space-y-6">
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <p className="text-xs text-slate-600">
              تقرير بالطلاب الأكثر غياباً على مدار العام الدراسي لاتخاذ الإجراءات الإدارية وإرسال الإخطارات
            </p>
            <button
              onClick={handleExportTopAbsenteesExcel}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              تصدير إلى Excel
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">الترتيب</th>
                    <th className="py-3 px-3">الرقم المدرسي</th>
                    <th className="py-3 px-4">اسم الطالب</th>
                    <th className="py-3 px-3">الصف الدراسي</th>
                    <th className="py-3 px-3">إجمالي حصص الغياب</th>
                    <th className="py-3 px-3">مستوى الخطورة</th>
                    <th className="py-3 px-3">هاتف ولي الأمر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topAbsentees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        لا توجد حالات غياب مسجلة في النظام.
                      </td>
                    </tr>
                  ) : (
                    topAbsentees.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-black">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                            idx === 0 ? 'bg-rose-600 text-white font-black' : idx < 3 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{item.student.schoolId}</td>
                        <td className="py-3 px-4 font-black text-slate-900">{item.student.fullName}</td>
                        <td className="py-3 px-3 font-bold text-blue-700">
                          {classMap.get(item.student.classId)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-black text-rose-700 text-sm">
                            {item.count} حصة
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {item.count >= 10 ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                              إنذار نهائي (حرج)
                            </span>
                          ) : item.count >= 5 ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              إنذار أول
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                              متابعة اعتيادية
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{item.student.guardianPhone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLASS COMPARISON */}
      {activeReportTab === 'compare' && (
        <div className="space-y-6">
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <p className="text-xs text-slate-600">
              مقارنة نسب وحالات الغياب بين كافة الـ {classes.length} صفاً دراسياً لتحديد الصفوف الأكثر انضباطاً
            </p>
            <button
              onClick={handleExportComparisonExcel}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              تصدير المقارنة إلى Excel
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">م</th>
                    <th className="py-3 px-4">الصف الدراسي</th>
                    <th className="py-3 px-3 text-center">عدد الطلاب</th>
                    <th className="py-3 px-3 text-center">الطلاب الغائبون الفريدون</th>
                    <th className="py-3 px-3 text-center">إجمالي حصص الغياب</th>
                    <th className="py-3 px-4">مؤشر الانضباط والحضور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classComparisonData.map((cls, idx) => (
                    <tr key={cls.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-black text-slate-900">{cls.name}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{cls.studentsCount}</td>
                      <td className="py-3 px-3 text-center font-black text-rose-600">
                        {cls.uniqueAbsentStudentsCount} طالب
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-amber-700">
                        {cls.totalAbsenceCount} حصة
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, cls.absenceRate * 5)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-12 text-left">
                            {cls.absenceRate}% غياب
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INDIVIDUAL STUDENT REPORT */}
      {activeReportTab === 'student' && (
        <div className="space-y-6">
          {/* Student Selector Toolbar */}
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">اختر الطالب:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden min-w-[260px] cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({classMap.get(s.classId)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Profile Card */}
          {individualStudent && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-lg">
                    {individualStudent.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{individualStudent.fullName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      الرقم المدرسي: {individualStudent.schoolId} • الصف:{' '}
                      <span className="font-bold text-blue-700">{classMap.get(individualStudent.classId)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-center">
                  <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100">
                    <div className="text-[10px] text-rose-600 font-bold">مرات الغياب</div>
                    <div className="text-lg font-black text-rose-700">
                      {studentRecords.filter((r) => r.status === 'absent').length} حصة
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="text-[10px] text-amber-600 font-bold">مرات التأخر</div>
                    <div className="text-lg font-black text-amber-700">
                      {studentRecords.filter((r) => r.status === 'late').length} حصة
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-[10px] text-blue-600 font-bold">مرات الاستئذان</div>
                    <div className="text-lg font-black text-blue-700">
                      {studentRecords.filter((r) => r.status === 'excused').length} حصة
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Record History Table */}
              <div>
                <h4 className="text-xs font-black text-slate-800 mb-3">سجل الغياب والتأخر التاريخي للطالب:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">الحصة</th>
                        <th className="py-2.5 px-3">الحالة</th>
                        <th className="py-2.5 px-4">السبب المسجل</th>
                        <th className="py-2.5 px-3">المعلم الراصد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            سجل الطالب نظيف ولا توجد حالات غياب مسجلة.
                          </td>
                        </tr>
                      ) : (
                        studentRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{r.date}</td>
                            <td className="py-2 px-3 font-bold text-blue-700">الحصة {r.period}</td>
                            <td className="py-2 px-3">
                              {r.status === 'absent' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  غائب
                                </span>
                              ) : r.status === 'late' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  متأخر
                                </span>
                              ) : r.status === 'excused' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                  مستأذن
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  حاضر
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-slate-600 font-medium">{r.excuseReason || '-'}</td>
                            <td className="py-2 px-3 text-slate-500">{r.recordedBy}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CLASS REPORT */}
      {activeReportTab === 'class' && (
        <div className="space-y-6">
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">اختر الصف:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster of Students in this Class with total absences */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                كشف إحصائي لطلاب {classMap.get(selectedClassId)}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">م</th>
                    <th className="py-2.5 px-3">الرقم المدرسي</th>
                    <th className="py-2.5 px-4">اسم الطالب</th>
                    <th className="py-2.5 px-3">إجمالي حصص الغياب</th>
                    <th className="py-2.5 px-3">هاتف ولي الأمر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter((s) => s.classId === selectedClassId && !s.isArchived)
                    .map((st, i) => {
                      const absCount = records.filter(
                        (r) => r.studentId === st.id && r.status === 'absent'
                      ).length;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-400">{i + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">{st.schoolId}</td>
                          <td className="py-2 px-4 font-black text-slate-900">{st.fullName}</td>
                          <td className="py-2 px-3">
                            {absCount > 0 ? (
                              <span className="font-bold text-rose-700">{absCount} حصة</span>
                            ) : (
                              <span className="text-slate-400">٠</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">{st.guardianPhone}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Ministry Signature Footer */}
      <div className="hidden print:grid grid-cols-3 gap-8 pt-12 text-center text-xs text-slate-800">
        <div>
          <div className="font-bold mb-8">مشرف الحضور والغياب</div>
          <div className="border-t border-slate-400 pt-1 font-semibold">التوقيع والاعتماد</div>
        </div>
        <div>
          <div className="font-bold mb-8">مساعد المدير لشؤون الطلاب</div>
          <div className="border-t border-slate-400 pt-1 font-semibold">{settings.assistantPrincipalName}</div>
        </div>
        <div>
          <div className="font-bold mb-8">مدير المدرسة</div>
          <div className="border-t border-slate-400 pt-1 font-semibold">{settings.principalName}</div>
        </div>
      </div>
    </div>
  );
};
