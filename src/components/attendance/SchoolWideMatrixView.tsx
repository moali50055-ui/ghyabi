import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../services/storage';
import {
  Grid3X3,
  Calendar,
  School,
  UserCheck,
  UserX,
  Clock,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { exportAttendanceReportToExcel } from '../../services/excelService';

export const SchoolWideMatrixView: React.FC = () => {
  const { classes, students, records, batches, setActiveTab } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedPeriod, setSelectedPeriod] = useState<number>(3); // Defaults to period 3 as in user example
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  // All active students
  const activeStudents = useMemo(() => students.filter((s) => !s.isArchived), [students]);

  // Filter batches for this date & period
  const periodBatches = useMemo(() => {
    return batches.filter((b) => b.date === selectedDate && b.period === selectedPeriod && b.isCompleted);
  }, [batches, selectedDate, selectedPeriod]);

  // Filter attendance records for this date & period
  const periodRecords = useMemo(() => {
    return records.filter((r) => r.date === selectedDate && r.period === selectedPeriod);
  }, [records, selectedDate, selectedPeriod]);

  // Target classes to evaluate
  const targetClasses = useMemo(() => {
    if (selectedClassFilter === 'all') return classes;
    return classes.filter((c) => c.id === selectedClassFilter);
  }, [classes, selectedClassFilter]);

  // Filter target student IDs
  const targetStudentIds = useMemo(() => {
    const classIdSet = new Set(targetClasses.map((c) => c.id));
    return new Set(activeStudents.filter((s) => classIdSet.has(s.classId)).map((s) => s.id));
  }, [targetClasses, activeStudents]);

  // Period records for target classes
  const relevantPeriodRecords = useMemo(() => {
    return periodRecords.filter((r) => targetStudentIds.has(r.studentId));
  }, [periodRecords, targetStudentIds]);

  // Stats for the selected period
  const periodStats = useMemo(() => {
    const totalStudentsInTargetClasses = activeStudents.filter((s) =>
      targetClasses.some((c) => c.id === s.classId)
    ).length;

    const absentRecords = relevantPeriodRecords.filter((r) => r.status === 'absent');
    const lateRecords = relevantPeriodRecords.filter((r) => r.status === 'late');
    const excusedRecords = relevantPeriodRecords.filter((r) => r.status === 'excused');
    const presentRecords = relevantPeriodRecords.filter((r) => r.status === 'present');

    // Count recorded classes
    const recordedClassIds = new Set(periodBatches.map((b) => b.classId));
    const targetRecordedClasses = targetClasses.filter((c) => recordedClassIds.has(c.id)).length;
    const targetPendingClasses = targetClasses.length - targetRecordedClasses;

    return {
      totalStudents: totalStudentsInTargetClasses,
      absentCount: absentRecords.length,
      lateCount: lateRecords.length,
      excusedCount: excusedRecords.length,
      presentCount: presentRecords.length,
      recordedClassesCount: targetRecordedClasses,
      pendingClassesCount: targetPendingClasses,
      totalClasses: targetClasses.length,
    };
  }, [activeStudents, targetClasses, relevantPeriodRecords, periodBatches]);

  // Absent & Late students details list
  const absentAndLateList = useMemo(() => {
    const studentById = new Map(students.map((s) => [s.id, s]));

    return relevantPeriodRecords
      .filter((r) => r.status === 'absent' || r.status === 'late' || r.status === 'excused')
      .map((r) => {
        const student = studentById.get(r.studentId);
        const cls = classMap.get(r.classId);

        return {
          recordId: r.id,
          studentId: r.studentId,
          fullName: student?.fullName || 'غير معروف',
          schoolId: student?.schoolId || '',
          guardianPhone: student?.guardianPhone || '',
          classId: r.classId,
          className: cls?.name || r.classId,
          status: r.status,
          excuseReason: r.excuseReason || '',
          recordedBy: r.recordedBy,
          recordedAt: r.recordedAt,
        };
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        return (
          item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.schoolId.includes(searchQuery) ||
          item.className.includes(searchQuery)
        );
      });
  }, [relevantPeriodRecords, students, classMap, searchQuery]);

  // Export to Excel for this period
  const handleExportExcel = () => {
    const rows = absentAndLateList.map((item, idx) => ({
      'م': idx + 1,
      'اسم الطالب': item.fullName,
      'الصف الدراسي': item.className,
      'الرقم المدرسي': item.schoolId,
      'الحالة': item.status === 'absent' ? 'غائب' : item.status === 'late' ? 'متأخر' : 'مستأذن',
      'السبب / الملاحظة': item.excuseReason || '-',
      'هاتف ولي الأمر': item.guardianPhone,
      'المعلم الراصد': item.recordedBy,
      'التاريخ': selectedDate,
      'الحصة': `الحصة ${selectedPeriod}`,
    }));

    exportAttendanceReportToExcel(
      rows,
      `غياب الحصة ${selectedPeriod}`,
      `تقرير_غياب_الحصة_${selectedPeriod}_تاريخ_${selectedDate}`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-blue-600" />
            تقرير غياب الحصص الثماني الشامل للمدرسة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة فورية للحضور والغياب خلال حصة دراسية معينة لجميع الصفوف ({classes.length} صفاً) أو لصف محدد
          </p>
        </div>

        {/* Date and Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            تصدير Excel
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="طباعة التقرير"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Period & Class Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* 8 Periods Selector */}
        <div>
          <div className="text-xs font-bold text-slate-600 mb-2">اختر الحصة المراد عرض تقريرها:</div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
              const isSelected = selectedPeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  الحصة {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Class Filter Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">نطاق الصفوف:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer min-w-[240px]"
            >
              <option value="all">تقرير شامل لكافة الـ {classes.length} صفاً بالمدرسة</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو الرقم أو الصف..."
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Period Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1">إجمالي الطلاب</div>
          <div className="text-xl font-black text-slate-900">{periodStats.totalStudents}</div>
          <div className="text-[10px] text-slate-400">في النطاق المحدد</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-800 mb-1">الحاضرون</div>
          <div className="text-xl font-black text-emerald-900">{periodStats.presentCount}</div>
          <div className="text-[10px] text-emerald-700">حاضرون بالحصة {selectedPeriod}</div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-rose-800 mb-1">الغائبون</div>
          <div className="text-xl font-black text-rose-900">{periodStats.absentCount}</div>
          <div className="text-[10px] text-rose-700">غائبون عن الحصة {selectedPeriod}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 mb-1">المتأخرون</div>
          <div className="text-xl font-black text-amber-900">{periodStats.lateCount}</div>
          <div className="text-[10px] text-amber-700">تأخر في الحصة {selectedPeriod}</div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-blue-800 mb-1">المستأذنون</div>
          <div className="text-xl font-black text-blue-900">{periodStats.excusedCount}</div>
          <div className="text-[10px] text-blue-700">بعذر مسبق</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-600 mb-1">حالة رصد الصفوف</div>
          <div className="text-xl font-black text-slate-900">
            {periodStats.recordedClassesCount} / {periodStats.totalClasses}
          </div>
          <div className="text-[10px] text-slate-500">صفاً مسجلاً للحصة {selectedPeriod}</div>
        </div>
      </div>

      {/* Absent and Late Students Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-600" />
            كشف الطلاب غير الحاضرين في الحصة {selectedPeriod} (تاريخ: {selectedDate})
          </h3>
          <span className="text-xs text-slate-400">
            العدد: {absentAndLateList.length} طالب
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">م</th>
                <th className="py-3 px-4">اسم الطالب</th>
                <th className="py-3 px-3">الصف الدراسي</th>
                <th className="py-3 px-3">الرقم المدرسي</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-4">السبب / الملاحظة</th>
                <th className="py-3 px-3">هاتف ولي الأمر</th>
                <th className="py-3 px-3">المعلم الراصد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {absentAndLateList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا توجد حالات غياب أو تأخر مسجلة في الحصة {selectedPeriod} لهذا التاريخ.
                  </td>
                </tr>
              ) : (
                absentAndLateList.map((item, index) => (
                  <tr key={item.recordId} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{item.fullName}</td>
                    <td className="py-3 px-3 font-bold text-blue-700">
                      <span className="inline-block px-2.5 py-1 rounded bg-blue-50">
                        {item.className}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">{item.schoolId}</td>
                    <td className="py-3 px-3">
                      {item.status === 'absent' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                          غائب
                        </span>
                      ) : item.status === 'late' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">
                          متأخر
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black text-[10px]">
                          مستأذن
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.excuseReason || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.guardianPhone}</td>
                    <td className="py-3 px-3 text-slate-500 font-medium">{item.recordedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
