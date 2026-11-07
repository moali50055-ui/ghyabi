import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus, Student } from '../../types';
import { getTodayDateString } from '../../services/storage';
import {
  CheckSquare,
  Calendar,
  School,
  Clock,
  UserCheck,
  UserX,
  UserMinus,
  CheckCircle2,
  AlertTriangle,
  Save,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Printer,
  ChevronDown,
  Info,
  MoreVertical,
  CalendarX,
  FileText,
  ShieldCheck,
  FileCheck,
  Phone,
  MessageSquare,
  X,
  HeartPulse,
  RotateCcw,
} from 'lucide-react';

export const PeriodAttendanceView: React.FC = () => {
  const {
    classes,
    students,
    records,
    batches,
    savePeriodAttendance,
    markStudentAbsentAllDay,
    deleteStudentAbsenceWithMedicalExcuse,
    currentUser,
    canEditClassAttendance,
    addToast,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    // If teacher has assigned classes, default to their first assigned class
    if (currentUser.role === 'teacher' && currentUser.assignedClassIds?.length) {
      return currentUser.assignedClassIds[0];
    }
    return classes[0]?.id || '';
  });
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local state for current attendance form: studentId -> { status, excuseReason }
  const [studentStatuses, setStudentStatuses] = useState<
    Record<string, { status: AttendanceStatus; excuseReason?: string }>
  >({});
  
  // Track dirty unsaved state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Student row action dropdown state (studentId or null)
  const [activeDropdownStudentId, setActiveDropdownStudentId] = useState<string | null>(null);

  // Medical excuse / absence deletion modal state
  const [medicalModalStudent, setMedicalModalStudent] = useState<Student | null>(null);
  const [medicalDocRef, setMedicalDocRef] = useState<string>('');
  const [medicalNotes, setMedicalNotes] = useState<string>('');
  const [medicalActionType, setMedicalActionType] = useState<'remove' | 'excuse'>('remove');

  // Selected class object
  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  // Active students for this class
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId && !s.isArchived)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar'));
  }, [students, selectedClassId]);

  // Existing batch metadata for this date, class, period
  const currentBatch = useMemo(() => {
    return batches.find(
      (b) =>
        b.date === selectedDate &&
        b.classId === selectedClassId &&
        b.period === selectedPeriod
    );
  }, [batches, selectedDate, selectedClassId, selectedPeriod]);

  // Load records into studentStatuses whenever (date, class, period) change
  useEffect(() => {
    const existingForPeriod = records.filter(
      (r) =>
        r.date === selectedDate &&
        r.classId === selectedClassId &&
        r.period === selectedPeriod
    );

    const initialMap: Record<string, { status: AttendanceStatus; excuseReason?: string }> = {};

    classStudents.forEach((st) => {
      const rec = existingForPeriod.find((r) => r.studentId === st.id);
      if (rec) {
        initialMap[st.id] = {
          status: rec.status,
          excuseReason: rec.excuseReason || '',
        };
      } else {
        // Default to present if not yet recorded
        initialMap[st.id] = {
          status: 'present',
          excuseReason: '',
        };
      }
    });

    setStudentStatuses(initialMap);
    setHasUnsavedChanges(false);
  }, [selectedDate, selectedClassId, selectedPeriod, classStudents, records]);

  // Handle single student status change
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Handle excuse text change
  const handleExcuseChange = (studentId: string, reason: string) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        excuseReason: reason,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Quick Action: Mark all present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; excuseReason?: string }> = {};
    classStudents.forEach((st) => {
      updated[st.id] = {
        status: 'present',
        excuseReason: '',
      };
    });
    setStudentStatuses(updated);
    setHasUnsavedChanges(true);
    addToast('info', 'تم تحديد جميع الطلاب حاضرين.');
  };

  // Save Attendance Action
  const handleSaveAttendance = () => {
    if (!canEditClassAttendance(selectedClassId)) {
      addToast('error', 'ليس لديك صلاحية رصد الغياب لهذا الصف.');
      return;
    }

    savePeriodAttendance({
      date: selectedDate,
      classId: selectedClassId,
      period: selectedPeriod,
      studentStatuses,
    });

    setHasUnsavedChanges(false);
  };

  // Quick Action: Mark a single student absent for all 8 periods of today
  const handleMarkStudentAllDay = (student: Student) => {
    if (!canEditClassAttendance(selectedClassId)) {
      addToast('error', 'ليس لديك صلاحية رصد الغياب لهذا الصف.');
      return;
    }

    markStudentAbsentAllDay({
      date: selectedDate,
      classId: selectedClassId,
      studentId: student.id,
      excuseReason: 'غياب كامل اليوم (الحصص الثماني)',
    });

    // Update local state for active period so UI reflects immediately
    setStudentStatuses((prev) => ({
      ...prev,
      [student.id]: {
        status: 'absent',
        excuseReason: 'غياب كامل اليوم (الحصص الثماني)',
      },
    }));

    setActiveDropdownStudentId(null);
  };

  // Open Medical Excuse Modal
  const handleOpenMedicalModal = (student: Student, defaultType: 'remove' | 'excuse' = 'remove') => {
    if (!canEditClassAttendance(selectedClassId)) {
      addToast('error', 'ليس لديك صلاحية تعديل سجلات هذا الصف.');
      return;
    }

    setMedicalModalStudent(student);
    setMedicalActionType(defaultType);
    setMedicalDocRef('');
    setMedicalNotes('');
    setActiveDropdownStudentId(null);
  };

  // Confirm medical excuse deletion / update
  const handleConfirmMedicalExcuse = () => {
    if (!medicalModalStudent) return;

    deleteStudentAbsenceWithMedicalExcuse({
      date: selectedDate,
      studentId: medicalModalStudent.id,
      mode: medicalActionType,
      medicalDocRef: medicalDocRef.trim(),
      notes: medicalNotes.trim(),
    });

    // Synchronize current period's local state
    const targetId = medicalModalStudent.id;
    setStudentStatuses((prev) => ({
      ...prev,
      [targetId]: {
        status: medicalActionType === 'remove' ? 'present' : 'excused',
        excuseReason:
          medicalActionType === 'remove'
            ? `تم شطب الغياب بمستند طبي (${medicalDocRef.trim() || 'عذر مرضي معتمد'})`
            : `مستأذن بعذر طبي: ${medicalDocRef.trim() || 'إجازة مرضية معتمدة'}`,
      },
    }));

    setMedicalModalStudent(null);
  };

  // Open WhatsApp with prefilled message
  const handleOpenWhatsApp = (student: Student) => {
    const raw = (student.guardianPhone || '').replace(/[^0-9]/g, '');
    if (!raw) {
      addToast('warning', 'لا يوجد رقم هاتف مسجل لولي أمر هذا الطالب.');
      return;
    }
    const cleanPhone = raw.startsWith('968') ? raw : `968${raw}`;
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته،\nولي أمر الطالب المحترم: ${student.fullName}\nنحيطكم علماً بأنه تم رصد نجلكم غائباً بتاريخ ${selectedDate} في مدرسة قتيبة بن مسلم.\nيرجى التواصل مع إدارة المدرسة أو تقديم مستند طبي معتمد في حال وجود عذر مرضي.\nشاكرين ومقدرين حسن تعاونكم.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    setActiveDropdownStudentId(null);
  };

  // Navigation helpers
  const handleNextPeriod = () => {
    if (selectedPeriod < 8) {
      setSelectedPeriod(selectedPeriod + 1);
    }
  };

  const handlePrevPeriod = () => {
    if (selectedPeriod > 1) {
      setSelectedPeriod(selectedPeriod - 1);
    }
  };

  // Live Counts for the currently viewed period
  const liveCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    Object.values(studentStatuses).forEach((item) => {
      if (item.status === 'present') present++;
      if (item.status === 'absent') absent++;
      if (item.status === 'late') late++;
      if (item.status === 'excused') excused++;
    });

    return { present, absent, late, excused, total: classStudents.length };
  }, [studentStatuses, classStudents]);

  // Filter students by search
  const visibleStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    return classStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.schoolId.includes(searchQuery)
    );
  }, [classStudents, searchQuery]);

  // Check which periods are completed for this class on this date
  const classPeriodStatus = useMemo(() => {
    const recordedPeriods = new Set(
      batches
        .filter((b) => b.date === selectedDate && b.classId === selectedClassId && b.isCompleted)
        .map((b) => b.period)
    );
    return recordedPeriods;
  }, [batches, selectedDate, selectedClassId]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600" />
            شاشة رصد الحضور والغياب للحصص الثماني
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل مستقل لكل طالب، لكل حصة، ولكل تاريخ مع التمييز بين الغياب والتأخر والاستئذان
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
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
            onClick={() => window.print()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="طباعة كشف الحضور لهذا الصف"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Class & Period Selection Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Class Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-700 whitespace-nowrap">الصف الدراسي:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-black text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer min-w-[220px]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({students.filter((s) => s.classId === c.id && !s.isArchived).length} طالباً)
                </option>
              ))}
            </select>
            {currentClass?.supervisorTeacherName && (
              <span className="text-xs text-slate-400 hidden lg:inline">
                مشرف الصف: {currentClass.supervisorTeacherName}
              </span>
            )}
          </div>

          {/* Quick Stats of Current Class */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">حالة الرصد اليوم:</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              {classPeriodStatus.size} من ٨ حصص مسجلة
            </span>
          </div>
        </div>

        {/* 8 Periods Tabs */}
        <div>
          <div className="text-[11px] font-bold text-slate-500 mb-2">اختر رقم الحصة الدراسية المراد رصدها:</div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
              const isSelected = selectedPeriod === p;
              const isRecorded = classPeriodStatus.has(p);

              return (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`py-3 px-2 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-300'
                      : isRecorded
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm">الحصة {p}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      isSelected
                        ? 'bg-blue-700/80 text-white'
                        : isRecorded
                        ? 'text-emerald-700 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {isRecorded ? '✓ مسجلة' : 'لم ترصد'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Strip: Live Summary & Save Controls */}
      <div className="sticky top-20 z-20 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>الحاضرون:</span>
            <span className="text-emerald-400 font-black text-sm">{liveCounts.present}</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>الغائبون:</span>
            <span className="text-rose-400 font-black text-sm">{liveCounts.absent}</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>المتأخرون:</span>
            <span className="text-amber-400 font-black text-sm">{liveCounts.late}</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>المستأذنون:</span>
            <span className="text-blue-300 font-black text-sm">{liveCounts.excused}</span>
          </div>

          {currentBatch && (
            <div className="text-[11px] text-slate-400 border-r border-slate-700 pr-3 mr-1">
              آخر رصد: <span className="text-slate-200 font-medium">{currentBatch.recordedBy}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            تحديد الكل حاضر
          </button>

          <button
            onClick={handleSaveAttendance}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-md ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-300 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
          >
            <Save className="w-4 h-4" />
            {hasUnsavedChanges ? 'حفظ الغياب (توجد تعديلات)' : 'حفظ الغياب'}
          </button>
        </div>
      </div>

      {/* Student List & Attendance Recording Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Search & Title */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800">
              قائمة طلاب {currentClass?.name} - الحصة {selectedPeriod} ({visibleStudents.length} طالباً)
            </span>
          </div>

          {/* Search inside class */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم الطالب..."
              className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Student Cards / Table */}
        <div className="divide-y divide-slate-100">
          {visibleStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              لا يوجد طلاب مسجلون في هذا الصف أو لا توجد نتائج للبحث.
            </div>
          ) : (
            visibleStudents.map((student, idx) => {
              const currentStatus = studentStatuses[student.id]?.status || 'present';
              const currentExcuse = studentStatuses[student.id]?.excuseReason || '';

              // Check if student has chronic absences in general
              const studentAllAbsences = records.filter(
                (r) => r.studentId === student.id && r.status === 'absent'
              ).length;

              return (
                <div
                  key={student.id}
                  className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    currentStatus === 'absent'
                      ? 'bg-rose-50/50'
                      : currentStatus === 'late'
                      ? 'bg-amber-50/40'
                      : currentStatus === 'excused'
                      ? 'bg-blue-50/30'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Student Name & Info */}
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {student.fullName}
                        </span>

                        {/* Chronic absences badge */}
                        {studentAllAbsences >= 5 && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold"
                            title="طالب متكرر الغياب"
                          >
                            كثير الغياب ({studentAllAbsences})
                          </span>
                        )}

                        {/* Indicators for today's status across all 8 periods */}
                        {(() => {
                          const todayAbsences = records.filter(
                            (r) => r.date === selectedDate && r.studentId === student.id && r.status === 'absent'
                          );
                          const isAllDay = todayAbsences.length === 8;
                          const hasMedicalExcuse = records.some(
                            (r) =>
                              r.date === selectedDate &&
                              r.studentId === student.id &&
                              (r.excuseReason?.includes('طبي') || r.excuseReason?.includes('مرضي'))
                          );

                          if (isAllDay) {
                            return (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black flex items-center gap-1 shadow-xs">
                                <CalendarX className="w-3 h-3" />
                                غائب طوال اليوم (٨ حصص)
                              </span>
                            );
                          }
                          if (todayAbsences.length > 0) {
                            return (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                                غائب في {todayAbsences.length} حصص اليوم
                              </span>
                            );
                          }
                          if (hasMedicalExcuse) {
                            return (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                مستند طبي معتمد
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        رقم مدرسي: {student.schoolId} • ولي الأمر: {student.guardianPhone}
                      </div>
                    </div>
                  </div>

                  {/* Status Selection Buttons, Excuse Input, All-Day Absence Action, and Dropdown Menu */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Reason input if absent or excused or late */}
                    {(currentStatus === 'absent' || currentStatus === 'excused' || currentStatus === 'late') && (
                      <input
                        type="text"
                        value={currentExcuse}
                        onChange={(e) => handleExcuseChange(student.id, e.target.value)}
                        placeholder="سبب الغياب / التأخر (اختياري)..."
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white focus:outline-hidden focus:border-blue-500 w-full sm:w-44"
                      />
                    )}

                    {/* 4 Status Choices: حاضر, غائب, متأخر, مستأذن */}
                    <div className="grid grid-cols-4 gap-1 sm:flex sm:items-center sm:gap-1.5">
                      {/* 1. Present */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'present')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        حاضر
                      </button>

                      {/* 2. Absent */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'absent')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        غائب
                      </button>

                      {/* 3. Late */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'late')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                          currentStatus === 'late'
                            ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        متأخر
                      </button>

                      {/* 4. Excused */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'excused')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                          currentStatus === 'excused'
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        مستأذن
                      </button>
                    </div>

                    {/* إمكانية تسجيل الطالب في الثماني حصص معاً (كامل اليوم) */}
                    {(() => {
                      const todayAbsencesCount = records.filter(
                        (r) => r.date === selectedDate && r.studentId === student.id && r.status === 'absent'
                      ).length;
                      const isAllDayAbsent = todayAbsencesCount === 8;

                      return (
                        <button
                          type="button"
                          onClick={() => handleMarkStudentAllDay(student)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border ${
                            isAllDayAbsent
                              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                          }`}
                          title="تسجيل غياب الطالب في الحصص الثماني معاً (طوال اليوم)"
                        >
                          <CalendarX className="w-3.5 h-3.5 text-rose-600" />
                          <span>غياب اليوم كاملاً (٨ حصص)</span>
                        </button>
                      );
                    })()}

                    {/* القائمة المنسدلة لخيارات الطالب وإجراء حذف الغياب بمستند طبي */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDropdownStudentId(
                            activeDropdownStudentId === student.id ? null : student.id
                          )
                        }
                        className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                          activeDropdownStudentId === student.id
                            ? 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-100'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                        title="خيارات إضافية للطالب"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu Popup */}
                      {activeDropdownStudentId === student.id && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveDropdownStudentId(null)}
                          />

                          <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-40 text-xs animate-in fade-in zoom-in-95 origin-top-left divide-y divide-slate-100">
                            <div className="px-3.5 py-1.5 text-[11px] font-black text-slate-400">
                              خيارات: {student.fullName.split(' ')[0]}
                            </div>

                            {/* رصد غياب كامل اليوم 8 حصص */}
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => handleMarkStudentAllDay(student)}
                                className="w-full text-right px-3.5 py-2 text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-2.5 transition"
                              >
                                <CalendarX className="w-4 h-4 text-rose-600 shrink-0" />
                                <div>
                                  <div className="font-black">تسجيل غياب اليوم كاملاً</div>
                                  <div className="text-[10px] text-rose-500 font-normal">
                                    رصد في الحصص الثماني معاً (١-٨)
                                  </div>
                                </div>
                              </button>
                            </div>

                            {/* خيار حذف الغياب بمستند طبي في القائمة المنسدلة */}
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => handleOpenMedicalModal(student, 'remove')}
                                className="w-full text-right px-3.5 py-2 text-emerald-800 hover:bg-emerald-50 font-bold flex items-center gap-2.5 transition"
                              >
                                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div>
                                  <div className="font-black text-emerald-700">حذف الغياب بمستند طبي</div>
                                  <div className="text-[10px] text-emerald-600 font-normal">
                                    شطب الغياب بعد تقديم تقرير أو إجازة مرضية
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenMedicalModal(student, 'excuse')}
                                className="w-full text-right px-3.5 py-2 text-blue-700 hover:bg-blue-50 font-bold flex items-center gap-2.5 transition"
                              >
                                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                  <div>تحويل إلى مستأذن بعذر مرضي</div>
                                  <div className="text-[10px] text-blue-500 font-normal">
                                    توثيق التقرير الطبي كعذر رسمي
                                  </div>
                                </div>
                              </button>
                            </div>

                            {/* التواصل مع ولي الأمر */}
                            <div className="py-1">
                              {student.guardianPhone ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWhatsApp(student)}
                                    className="w-full text-right px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 font-bold flex items-center gap-2.5 transition"
                                  >
                                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>إشعار ولي الأمر عبر واتساب</span>
                                  </button>
                                  <a
                                    href={`tel:${student.guardianPhone}`}
                                    className="w-full text-right px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-2.5 transition block"
                                  >
                                    <Phone className="w-4 h-4 text-slate-500 shrink-0 inline ml-1.5" />
                                    <span>اتصال هاتف بولي الأمر</span>
                                  </a>
                                </>
                              ) : (
                                <div className="px-3.5 py-2 text-[11px] text-slate-400">
                                  لا يوجد هاتف مسجل لولي الأمر
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation: Next / Prev Period */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handlePrevPeriod}
            disabled={selectedPeriod === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            الحصة السابقة (الحصة {selectedPeriod - 1})
          </button>

          <span className="text-xs font-bold text-slate-500">
            {currentClass?.name} - الحصة {selectedPeriod} من ٨
          </span>

          <button
            onClick={handleNextPeriod}
            disabled={selectedPeriod === 8}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-xs font-bold text-white transition cursor-pointer"
          >
            الحصة التالية (الحصة {selectedPeriod + 1})
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal: حذف الغياب بمستند طبي */}
      {medicalModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 bg-gradient-to-l from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black">حذف غياب طالب بمستند طبي</h3>
                  <p className="text-xs text-emerald-100">
                    توثيق الإجازة المرضية وإسقاط الغياب من سجلات الطالب
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMedicalModalStudent(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Student Card Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-xs font-black text-slate-900 flex items-center justify-between">
                  <span>الطالب: {medicalModalStudent.fullName}</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    الرقم: {medicalModalStudent.schoolId}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span>الصف: {currentClass?.name}</span>
                  <span className="font-bold text-blue-700">التاريخ: {selectedDate}</span>
                </div>
                {/* Absence status info */}
                {(() => {
                  const dayAbs = records.filter(
                    (r) =>
                      r.date === selectedDate &&
                      r.studentId === medicalModalStudent.id &&
                      r.status === 'absent'
                  );
                  return (
                    <div className="pt-2 text-xs font-bold text-rose-700 flex items-center gap-1.5 border-t border-slate-200/60 mt-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      {dayAbs.length === 8 ? (
                        <span>مسجل حالياً غائباً طوال اليوم (الحصص الثماني كلها)</span>
                      ) : dayAbs.length > 0 ? (
                        <span>
                          مسجل حالياً غائباً في {dayAbs.length} حصص (
                          {dayAbs.map((r) => `الحصة ${r.period}`).join('، ')})
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">
                          لم يُرصد له غياب مسبق في هذا اليوم، وسيتم تطبيق العذر للحصة الحالية.
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Action Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800">
                  نوع الإجراء المطلوب للمستند الطبي:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMedicalActionType('remove')}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1 ${
                      medicalActionType === 'remove'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-emerald-900">
                        شطب وحذف الغياب نهائياً
                      </span>
                      {medicalActionType === 'remove' && (
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      إلغاء الغياب واعتبار الطالب حاضراً بعذر مرضي وإسقاطه من الإحصائيات
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMedicalActionType('excuse')}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-1 ${
                      medicalActionType === 'excuse'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-blue-900">
                        تحويل إلى مستأذن بعذر مرضي
                      </span>
                      {medicalActionType === 'excuse' && (
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      توثيق التقرير الطبي والاحتفاظ به كعذر رسمي مقبول
                    </span>
                  </button>
                </div>
              </div>

              {/* Document reference / ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">
                  بيانات المستند / الإجازة المرضية:
                </label>
                <input
                  type="text"
                  value={medicalDocRef}
                  onChange={(e) => setMedicalDocRef(e.target.value)}
                  placeholder="مثال: مستشفى صور المرجعي - إجازة مرضية رقم 58392"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Extra Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">
                  ملاحظات الطبيب المعالج / إدارة المدرسة (اختياري):
                </label>
                <textarea
                  rows={2}
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="مثال: راحة مرضية موصى بها من الطبيب، مراجعة عيادة الأسنان..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMedicalModalStudent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmMedicalExcuse}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-600/30"
              >
                <FileCheck className="w-4 h-4" />
                <span>تأكيد حذف الغياب واعتماد المستند</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
