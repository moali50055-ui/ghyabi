import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Percent,
  School,
  CheckCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart2,
  PieChart,
  ArrowUpRight,
  Printer,
  Sparkles,
  BookOpenCheck,
  UserPlus,
  Plus,
  Phone,
} from 'lucide-react';
import { getTodayDateString } from '../../services/storage';

export const DashboardView: React.FC = () => {
  const {
    classes,
    students,
    records,
    batches,
    getDailySummary,
    getClassAttendanceStatusForDate,
    setActiveTab,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Calculate the 9 primary statistics
  const summary = useMemo(() => getDailySummary(selectedDate), [getDailySummary, selectedDate]);

  // Attendance matrix data for all 29 classes across 8 periods
  const classMatrixData = useMemo(() => {
    return classes.map((cls) => {
      const classStudents = students.filter((s) => s.classId === cls.id && !s.isArchived);
      const studentCount = classStudents.length;

      // Class records for this date
      const clsRecords = records.filter((r) => r.date === selectedDate && r.classId === cls.id);

      // Period by period stats (1 to 8)
      const periods = [1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
        const batch = batches.find(
          (b) => b.date === selectedDate && b.classId === cls.id && b.period === p
        );
        const periodRecords = clsRecords.filter((r) => r.period === p);
        const absentCount = periodRecords.filter((r) => r.status === 'absent').length;
        const lateCount = periodRecords.filter((r) => r.status === 'late').length;
        const excusedCount = periodRecords.filter((r) => r.status === 'excused').length;
        const presentCount = periodRecords.filter((r) => r.status === 'present').length;

        return {
          period: p,
          isRecorded: Boolean(batch && batch.isCompleted),
          absentCount,
          lateCount,
          excusedCount,
          presentCount,
          recordedBy: batch?.recordedBy,
        };
      });

      // Calculate unique absent students in this class for the day
      const studentStatusesMap = new Map<string, string[]>();
      clsRecords.forEach((r) => {
        if (!studentStatusesMap.has(r.studentId)) studentStatusesMap.set(r.studentId, []);
        studentStatusesMap.get(r.studentId)!.push(r.status);
      });

      let uniqueAbsentInClass = 0;
      let totalAbsenceInstancesInClass = 0;
      studentStatusesMap.forEach((statuses) => {
        if (statuses.includes('absent')) uniqueAbsentInClass++;
        totalAbsenceInstancesInClass += statuses.filter((s) => s === 'absent').length;
      });

      const completedPeriodsCount = periods.filter((p) => p.isRecorded).length;
      const isComplete = completedPeriodsCount === 8;

      return {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        roomNumber: cls.roomNumber,
        supervisorTeacherName: cls.supervisorTeacherName,
        studentCount,
        periods,
        completedPeriodsCount,
        isComplete,
        uniqueAbsentInClass,
        totalAbsenceInstancesInClass,
      };
    });
  }, [classes, students, records, batches, selectedDate]);

  // Aggregate stats per period across all classes for chart
  const periodAbsenceChartData = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
      const recordsForP = records.filter((r) => r.date === selectedDate && r.period === p);
      const absentCount = recordsForP.filter((r) => r.status === 'absent').length;
      const lateCount = recordsForP.filter((r) => r.status === 'late').length;
      const recordedClassesCount = batches.filter(
        (b) => b.date === selectedDate && b.period === p && b.isCompleted
      ).length;

      return {
        period: p,
        periodName: `الحصة ${p}`,
        absentCount,
        lateCount,
        recordedClassesCount,
      };
    });
  }, [records, batches, selectedDate]);

  // Top 5 classes with most absences today for quick intervention
  const topAbsentClasses = useMemo(() => {
    return [...classMatrixData]
      .filter((c) => c.uniqueAbsentInClass > 0)
      .sort((a, b) => b.uniqueAbsentInClass - a.uniqueAbsentInClass)
      .slice(0, 5);
  }, [classMatrixData]);

  // Date stepper handlers
  const handlePrevDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const maxAbsenceOnPeriod = Math.max(...periodAbsenceChartData.map((d) => d.absentCount), 5);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header & Date Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-600" />
            لوحة تحكم وإحصائيات الحضور والغياب
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة شاملة لـ {classes.length} صفاً دراسياً عبر ٨ حصص يومية مع تحليل فوري ودقيق
          </p>
        </div>

        {/* Date Selector & Jump to Today */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 p-1">
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
              title="اليوم التالي"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold outline-hidden cursor-pointer"
              />
            </div>
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
              title="اليوم السابق"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(getTodayDateString())}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            اليوم الحالي
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <BookOpenCheck className="w-4 h-4" />
            تسجيل غياب اليوم
          </button>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs font-black text-slate-700 ml-1">إجراءات سريعة:</span>
        <button
          onClick={() => setActiveTab('students')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          حذف أو إضافة طالب
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer"
        >
          <School className="w-3.5 h-3.5" />
          حذف أو إضافة صف
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-600" />
          ربط أرقام تليفونات أولياء الأمور بالطلاب
        </button>
      </div>

      {/* The 9 Required Primary Stat Cards */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>المؤشرات الإحصائية اليومية المعتمدة (تاريخ: {selectedDate})</span>
          <span className="text-slate-400 font-normal">يتم التحديث فور حفظ أي حصة</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-9 gap-3">
          
          {/* 1. Total Students */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold">إجمالي الطلاب</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{summary.totalStudents}</div>
            <div className="text-[10px] text-slate-400 mt-1">طالب مسجل بالمدرسة</div>
          </div>

          {/* 2. Present Students */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-[11px] font-bold">الطلاب الحاضرون</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-900">{summary.uniquePresentStudents}</div>
            <div className="text-[10px] text-emerald-700/80 mt-1">حاضرون في المدرسة اليوم</div>
          </div>

          {/* 3. Absent Students (Unique) */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-700 mb-2">
              <span className="text-[11px] font-bold">الطلاب الغائبون</span>
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-900">{summary.uniqueAbsentStudents}</div>
            <div className="text-[10px] text-rose-700/80 mt-1 font-medium">غائبون فريدون (دون تكرار)</div>
          </div>

          {/* 4. Late Students */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-[11px] font-bold">الطلاب المتأخرون</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-900">{summary.uniqueLateStudents}</div>
            <div className="text-[10px] text-amber-700/80 mt-1">تأخر صباحي مسجل</div>
          </div>

          {/* 5. Attendance Rate */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold">نسبة الحضور</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{summary.attendanceRate}%</div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.attendanceRate}%` }}
              />
            </div>
          </div>

          {/* 6. Absence Rate */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold">نسبة الغياب</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600">{summary.absenceRate}%</div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.absenceRate}%` }}
              />
            </div>
          </div>

          {/* 7. Total Classes */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold">عدد الصفوف</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{summary.totalClassesCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">صفاً دراسياً معتمداً</div>
          </div>

          {/* 8. Completed Classes */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-[11px] font-bold">اكتمل تسجيلها</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-900">{summary.completedClassesCount}</div>
            <div className="text-[10px] text-blue-700/80 mt-1 font-medium">سُجلت الـ ٨ حصص بالكامل</div>
          </div>

          {/* 9. Pending Classes */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-[11px] font-bold">لم تكتمل بعد</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-900">{summary.pendingClassesCount}</div>
            <div className="text-[10px] text-amber-700/80 mt-1 font-medium">بانتظار رصد الحصص المتبقية</div>
          </div>

        </div>
      </div>

      {/* Distinction Banner: Unique Absentees vs Total Period Absence Instances */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black">التمييز الرياضي الدقيق بين الغائبين الفريدين وإجمالي غيابات الحصص:</h3>
            <p className="text-xs text-blue-200/80 mt-0.5">
              لا يُحسب الطالب مرتين في نسبة الغياب اليومية إذا غاب عن عدة حصص، بينما يظهر إجمالي غيابات الحصص لمتابعة التسرب الحصصي.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 shrink-0 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs">
          <div className="text-center">
            <div className="text-xs text-blue-200">الطلاب الغائبون الفريدون</div>
            <div className="text-xl font-black text-white">{summary.uniqueAbsentStudents} طالب</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <div className="text-xs text-blue-200">إجمالي حالات غياب الحصص</div>
            <div className="text-xl font-black text-amber-300">{summary.totalPeriodAbsenceInstances} حالة حصة</div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Absence by Period (Periods 1 to 8) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                توزيع الغياب والتأخر حسب الحصص الثماني
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">عدد الطلاب الغائبين في كل حصة من الحصة ١ إلى الحصة ٨</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                غياب
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                تأخر
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="grid grid-cols-8 gap-2 sm:gap-4 items-end h-44 border-b border-slate-200 pb-2">
              {periodAbsenceChartData.map((d) => {
                const absentHeightPercent = Math.min(100, Math.round((d.absentCount / maxAbsenceOnPeriod) * 100));
                const lateHeightPercent = Math.min(100, Math.round((d.lateCount / maxAbsenceOnPeriod) * 100));

                return (
                  <div key={d.period} className="flex flex-col items-center h-full justify-end group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none">
                      غياب: {d.absentCount} | تأخر: {d.lateCount}
                    </div>

                    {/* Bars */}
                    <div className="w-full flex items-end justify-center gap-1 h-32">
                      {/* Absent Bar */}
                      <div
                        className="w-1/2 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md transition-all duration-300 relative group-hover:brightness-110"
                        style={{ height: `${Math.max(4, absentHeightPercent)}%` }}
                      >
                        {d.absentCount > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-rose-700">
                            {d.absentCount}
                          </span>
                        )}
                      </div>
                      {/* Late Bar */}
                      <div
                        className="w-1/2 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-md transition-all duration-300 relative group-hover:brightness-110"
                        style={{ height: `${Math.max(4, lateHeightPercent)}%` }}
                      >
                        {d.lateCount > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-amber-700">
                            {d.lateCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-black text-slate-700 mt-2">
                      ح{d.period}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {d.recordedClassesCount}/{classes.length}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>الحصص الصباحية (١ - ٤)</span>
              <span>الحصص المسائية (٥ - ٨)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Top Absent Classes & Attendance Ratio Gauge */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                أعلى الصفوف تسجيلاً للغياب اليوم
              </h3>
              <span className="text-[11px] text-slate-400">تحليل فوري</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              الصفوف التي تحتاج إلى متابعة إدارية وتواصل مع أولياء الأمور
            </p>

            <div className="space-y-3">
              {topAbsentClasses.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                  لا توجد حالات غياب مسجلة لهذا التاريخ.
                </div>
              ) : (
                topAbsentClasses.map((cls, idx) => (
                  <div
                    key={cls.classId}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-black text-slate-900">{cls.className}</div>
                        <div className="text-[10px] text-slate-500">{cls.studentCount} طالباً • {cls.supervisorTeacherName || 'مشرف الصف'}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-xs">
                        {cls.uniqueAbsentInClass} غائب
                      </span>
                      <div className="text-[10px] text-slate-400 text-left mt-0.5">
                        {cls.totalAbsenceInstancesInClass} حصة غياب
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick jump link to matrix */}
          <button
            onClick={() => setActiveTab('matrix')}
            className="mt-4 w-full py-2.5 rounded-xl border border-blue-200 hover:border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            عرض جدول غياب الحصص الثماني لكافة الصفوف ({classes.length} صفاً)
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Main Table: 8-Period Attendance Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              جدول حالة غياب الـ {classes.length} صفاً دراسياً خلال الحصص الثماني
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة حالة رصد كل حصة (مكتمل / غير مسجل) مع عدد الغائبين لكل صف
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">مفتاح الرموز:</span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              حاضر
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
              غائب
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              متأخر
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-400">
              لم ترصد
            </span>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">الصف الدراسي</th>
                <th className="py-3 px-3 text-center">الطلاب</th>
                <th className="py-3 px-2 text-center">الحصة ١</th>
                <th className="py-3 px-2 text-center">الحصة ٢</th>
                <th className="py-3 px-2 text-center">الحصة ٣</th>
                <th className="py-3 px-2 text-center">الحصة ٤</th>
                <th className="py-3 px-2 text-center">الحصة ٥</th>
                <th className="py-3 px-2 text-center">الحصة ٦</th>
                <th className="py-3 px-2 text-center">الحصة ٧</th>
                <th className="py-3 px-2 text-center">الحصة ٨</th>
                <th className="py-3 px-3 text-center">الرصد</th>
                <th className="py-3 px-3 text-center">الغائبون الفريدون</th>
                <th className="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classMatrixData.map((row) => (
                <tr key={row.classId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-black text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                      {row.className}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal pr-4">
                      {row.supervisorTeacherName || 'مشرف الصف'}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center font-bold text-slate-700">
                    {row.studentCount}
                  </td>

                  {/* Periods 1 to 8 cells */}
                  {row.periods.map((p) => {
                    if (!p.isRecorded) {
                      return (
                        <td key={p.period} className="py-2.5 px-2 text-center">
                          <span
                            className="inline-block px-1.5 py-1 rounded bg-slate-100 text-slate-400 text-[10px] font-medium"
                            title={`الحصة ${p.period}: لم ترصد بعد`}
                          >
                            -
                          </span>
                        </td>
                      );
                    }

                    if (p.absentCount > 0) {
                      return (
                        <td key={p.period} className="py-2.5 px-2 text-center">
                          <span
                            className="inline-block px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-[11px] shadow-xs"
                            title={`الحصة ${p.period}: ${p.absentCount} غائب (${p.recordedBy || 'المعلم'})`}
                          >
                            {p.absentCount} غ
                          </span>
                        </td>
                      );
                    }

                    if (p.lateCount > 0) {
                      return (
                        <td key={p.period} className="py-2.5 px-2 text-center">
                          <span
                            className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]"
                            title={`الحصة ${p.period}: ${p.lateCount} متأخر`}
                          >
                            {p.lateCount} ت
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={p.period} className="py-2.5 px-2 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold text-[10px]"
                          title={`الحصة ${p.period}: اكتمل الحضور`}
                        >
                          ✓
                        </span>
                      </td>
                    );
                  })}

                  {/* Completion badge */}
                  <td className="py-3 px-3 text-center">
                    {row.isComplete ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" />
                        مكتمل (٨/٨)
                      </span>
                    ) : row.completedPeriodsCount > 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {row.completedPeriodsCount}/٨ حصص
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                        لم يرصد
                      </span>
                    )}
                  </td>

                  {/* Unique absent students */}
                  <td className="py-3 px-3 text-center">
                    {row.uniqueAbsentInClass > 0 ? (
                      <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                        {row.uniqueAbsentInClass} طلاب
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">٠</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition cursor-pointer"
                    >
                      تسجيل / تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
