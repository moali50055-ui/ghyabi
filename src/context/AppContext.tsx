import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  ClassRoom,
  Student,
  PeriodAttendanceRecord,
  AttendanceBatchMetadata,
  User,
  SchoolSettings,
  AuditLog,
  AttendanceStatus,
  UserRole,
} from '../types';
import {
  AppState,
  loadInitialOrStoredData,
  saveAllData,
  getTodayDateString,
  resetStorageToDefaults,
  clearAllStudentAndAttendanceData,
} from '../services/storage';
import { ParsedStudentRow } from '../services/excelService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  classes: ClassRoom[];
  students: Student[];
  records: PeriodAttendanceRecord[];
  batches: AttendanceBatchMetadata[];
  settings: SchoolSettings;
  users: User[];
  currentUser: User;
  auditLogs: AuditLog[];
  isOnline: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  removeToast: (id: string) => void;

  // User auth/role switcher
  setCurrentUser: (user: User) => void;
  canEditClassAttendance: (classId: string) => boolean;

  // Class Actions
  addClass: (cls: Omit<ClassRoom, 'id'>) => void;
  updateClass: (id: string, updates: Partial<ClassRoom>) => void;
  deleteClass: (id: string, forceTransferToClassId?: string) => { success: boolean; message?: string };

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  transferStudent: (id: string, targetClassId: string, reason?: string) => void;
  archiveStudent: (id: string, reason: string) => void;
  unarchiveStudent: (id: string) => void;
  deleteStudentPermanently: (id: string) => void;
  bulkUpdateParentPhones: (
    updates: { studentId: string; phone: string; guardianName?: string }[]
  ) => number;
  importStudents: (
    rows: ParsedStudentRow[],
    options: { skipDuplicates?: boolean; updateExisting?: boolean }
  ) => { importedCount: number; updatedCount: number; skippedCount: number };

  // Attendance Actions
  savePeriodAttendance: (params: {
    date: string;
    classId: string;
    period: number;
    studentStatuses: Record<string, { status: AttendanceStatus; excuseReason?: string }>;
  }) => void;
  markStudentAbsentAllDay: (params: {
    date: string;
    classId: string;
    studentId: string;
    excuseReason?: string;
  }) => void;
  deleteStudentAbsenceWithMedicalExcuse: (params: {
    date: string;
    studentId: string;
    mode: 'remove' | 'excuse';
    medicalDocRef?: string;
    notes?: string;
  }) => void;

  // Settings & Users
  updateSettings: (updates: Partial<SchoolSettings>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Backup / Reset
  resetToDemo: () => void;
  clearData: () => void;
  restoreData: (newState: AppState) => void;

  // Quick stats queries
  getStudentsByClass: (classId: string, includeArchived?: boolean) => Student[];
  getClassAttendanceStatusForDate: (date: string, classId: string) => {
    completedPeriods: number[];
    isFullyRecorded: boolean;
    hasAnyRecord: boolean;
  };
  getDailySummary: (date: string) => {
    totalStudents: number;
    uniquePresentStudents: number;
    uniqueAbsentStudents: number;
    uniqueLateStudents: number;
    uniqueExcusedStudents: number;
    attendanceRate: number;
    absenceRate: number;
    totalPeriodAbsenceInstances: number;
    completedClassesCount: number;
    pendingClassesCount: number;
    totalClassesCount: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppState>(() => loadInitialOrStoredData());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Sync to localStorage whenever data changes
  useEffect(() => {
    saveAllData(data);
  }, [data]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('info', 'تمت استعادة الاتصال بالشبكة.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('warning', 'أنت غير متصل بالإنترنت حالياً (يعمل النظام محلياً بدون انقطاع).');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAudit = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: data.currentUser.name,
      userRole: data.currentUser.role,
      action,
      details,
    };
    setData((prev) => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs],
    }));
  };

  const setCurrentUser = (user: User) => {
    setData((prev) => ({ ...prev, currentUser: user }));
    addToast('info', `تم التبديل إلى المستخدم: ${user.name} (${user.jobTitle || user.role})`);
  };

  const canEditClassAttendance = (classId: string): boolean => {
    if (data.currentUser.role === 'admin' || data.currentUser.role === 'management') {
      return true;
    }
    // Teacher: only assigned classes
    if (data.currentUser.role === 'teacher') {
      return (data.currentUser.assignedClassIds || []).includes(classId);
    }
    return false;
  };

  // Class actions
  const addClass = (cls: Omit<ClassRoom, 'id'>) => {
    const newId = `class-${Date.now()}`;
    const newClass: ClassRoom = { ...cls, id: newId };
    setData((prev) => ({
      ...prev,
      classes: [...prev.classes, newClass],
    }));
    logAudit('إضافة صف دراسي', `تمت إضافة الصف: ${newClass.name}`);
    addToast('success', `تمت إضافة ${newClass.name} بنجاح.`);
  };

  const updateClass = (id: string, updates: Partial<ClassRoom>) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    logAudit('تعديل صف دراسي', `تم تعديل بيانات الصف (معرف: ${id})`);
    addToast('success', 'تم حفظ تعديلات الصف بنجاح.');
  };

  const deleteClass = (id: string, forceTransferToClassId?: string): { success: boolean; message?: string } => {
    const targetClass = data.classes.find((c) => c.id === id);
    if (!targetClass) return { success: false, message: 'الصف غير موجود' };

    const studentsInClass = data.students.filter((s) => s.classId === id && !s.isArchived);
    if (studentsInClass.length > 0 && !forceTransferToClassId) {
      addToast('error', `لا يمكن حذف ${targetClass.name} لوجود ${studentsInClass.length} طالباً مسجلاً به. يرجى نقل الطلاب أولاً أو تحديد صف بديل.`);
      return { success: false, message: 'يحتوي الصف على طلاب نشطين' };
    }

    setData((prev) => {
      let updatedStudents = prev.students;
      if (forceTransferToClassId && studentsInClass.length > 0) {
        updatedStudents = prev.students.map((s) =>
          s.classId === id ? { ...s, classId: forceTransferToClassId } : s
        );
      }
      return {
        ...prev,
        classes: prev.classes.filter((c) => c.id !== id),
        students: updatedStudents,
      };
    });
    logAudit(
      'حذف صف دراسي',
      `تم حذف الصف: ${targetClass.name}${forceTransferToClassId ? ` ونقل ${studentsInClass.length} طالباً` : ''}`
    );
    addToast('success', `تم حذف ${targetClass.name} بنجاح.`);
    return { success: true };
  };

  // Student actions
  const addStudent = (student: Omit<Student, 'id' | 'createdAt'>) => {
    const newId = `std-${Date.now()}`;
    const newStudent: Student = {
      ...student,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setData((prev) => ({
      ...prev,
      students: [newStudent, ...prev.students],
    }));
    logAudit('إضافة طالب', `تمت إضافة الطالب: ${newStudent.fullName} بالرقم: ${newStudent.schoolId}`);
    addToast('success', `تمت إضافة الطالب ${newStudent.fullName} بنجاح.`);
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    logAudit('تعديل طالب', `تم تحديث بيانات الطالب (معرف: ${id})`);
    addToast('success', 'تم حفظ تعديلات الطالب بنجاح.');
  };

  const transferStudent = (id: string, targetClassId: string, reason?: string) => {
    const student = data.students.find((s) => s.id === id);
    const targetClass = data.classes.find((c) => c.id === targetClassId);
    if (!student || !targetClass) return;

    const oldClass = data.classes.find((c) => c.id === student.classId);

    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === id
          ? {
              ...s,
              classId: targetClassId,
              notes: reason ? `${s.notes || ''} [نقل من ${oldClass?.name || ''} إلى ${targetClass.name}: ${reason}]` : s.notes,
            }
          : s
      ),
    }));

    logAudit('نقل طالب', `تم نقل الطالب ${student.fullName} من ${oldClass?.name || ''} إلى ${targetClass.name}`);
    addToast('success', `تم نقل الطالب ${student.fullName} إلى ${targetClass.name} بنجاح.`);
  };

  const archiveStudent = (id: string, reason: string) => {
    const student = data.students.find((s) => s.id === id);
    if (!student) return;

    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === id
          ? {
              ...s,
              isArchived: true,
              archiveReason: reason,
              archivedAt: new Date().toISOString().split('T')[0],
            }
          : s
      ),
    }));

    logAudit('أرشفة طالب', `تمت أرشفة الطالب: ${student.fullName}. السبب: ${reason}`);
    addToast('success', `تمت أرشفة الطالب ${student.fullName} مع الاحتفاظ بكافة سجلات غيابه السابقة.`);
  };

  const unarchiveStudent = (id: string) => {
    const student = data.students.find((s) => s.id === id);
    if (!student) return;

    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === id
          ? {
              ...s,
              isArchived: false,
              archiveReason: undefined,
              archivedAt: undefined,
            }
          : s
      ),
    }));

    logAudit('إلغاء أرشفة طالب', `تمت إعادة تنشيط الطالب: ${student.fullName}`);
    addToast('success', `تمت استعادة الطالب ${student.fullName} إلى القوائم النشطة.`);
  };

  const deleteStudentPermanently = (id: string) => {
    const student = data.students.find((s) => s.id === id);
    if (!student) return;

    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
      records: prev.records.filter((r) => r.studentId !== id),
    }));

    logAudit('حذف طالب نهائياً', `تم حذف الطالب وسجلاته نهائياً: ${student.fullName}`);
    addToast('info', `تم حذف الطالب ${student.fullName} وسجلاته نهائياً.`);
  };

  const bulkUpdateParentPhones = (
    updates: { studentId: string; phone: string; guardianName?: string }[]
  ): number => {
    if (!updates.length) return 0;
    const updateMap = new Map(updates.map((u) => [u.studentId, u]));
    let count = 0;

    setData((prev) => {
      const updatedStudents = prev.students.map((student) => {
        const match = updateMap.get(student.id);
        if (match && match.phone.trim()) {
          count++;
          return {
            ...student,
            guardianPhone: match.phone.trim(),
            guardianName: match.guardianName ? match.guardianName.trim() : student.guardianName,
          };
        }
        return student;
      });
      return {
        ...prev,
        students: updatedStudents,
      };
    });

    logAudit(
      'ربط أرقام أولياء الأمور',
      `تم ربط وتحديث هواتف أولياء الأمور لعدد ${updates.length} طالباً`
    );
    addToast('success', `تم ربط وتحديث هواتف أولياء الأمور بنجاح لـ ${updates.length} طالباً.`);
    return updates.length;
  };

  const importStudents = (
    rows: ParsedStudentRow[],
    options: { skipDuplicates?: boolean; updateExisting?: boolean }
  ) => {
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const existingById = new Map(data.students.map((s) => [s.schoolId.trim(), s]));
    const existingByName = new Map(data.students.map((s) => [s.fullName.trim().toLowerCase(), s]));

    const newStudents: Student[] = [];
    const updatedStudentIds = new Set<string>();

    rows.forEach((row, idx) => {
      if (!row.isValid || !row.matchedClassId) {
        skippedCount++;
        return;
      }

      const existing = existingById.get(row.schoolId.trim()) || existingByName.get(row.fullName.trim().toLowerCase());

      if (existing) {
        if (options.updateExisting) {
          existing.classId = row.matchedClassId;
          if (row.guardianPhone) existing.guardianPhone = row.guardianPhone;
          updatedStudentIds.add(existing.id);
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        newStudents.push({
          id: `std-imp-${Date.now()}-${idx}`,
          schoolId: row.schoolId,
          fullName: row.fullName,
          classId: row.matchedClassId,
          gender: 'بنين',
          guardianPhone: row.guardianPhone || 'غير مسجل',
          isArchived: false,
          createdAt: new Date().toISOString().split('T')[0],
        });
        importedCount++;
      }
    });

    setData((prev) => {
      const mergedStudents = prev.students.map((s) => {
        if (updatedStudentIds.has(s.id)) {
          const matchRow = rows.find((r) => r.schoolId === s.schoolId || r.fullName.toLowerCase() === s.fullName.toLowerCase());
          if (matchRow && matchRow.matchedClassId) {
            return {
              ...s,
              classId: matchRow.matchedClassId,
              guardianPhone: matchRow.guardianPhone || s.guardianPhone,
            };
          }
        }
        return s;
      });

      return {
        ...prev,
        students: [...newStudents, ...mergedStudents],
      };
    });

    logAudit(
      'استيراد إكسل',
      `تم استيراد ${importedCount} طالباً جديداً، وتحديث ${updatedCount}، وتخطي ${skippedCount}.`
    );

    addToast('success', `تم الاستيراد بنجاح: تم إضافة ${importedCount} طالباً وتحديث ${updatedCount}.`);
    return { importedCount, updatedCount, skippedCount };
  };

  // Attendance recording per period
  const savePeriodAttendance = (params: {
    date: string;
    classId: string;
    period: number;
    studentStatuses: Record<string, { status: AttendanceStatus; excuseReason?: string }>;
  }) => {
    const { date, classId, period, studentStatuses } = params;
    const nowIso = new Date().toISOString();
    const batchId = `${date}_${classId}_${period}`;

    const newRecords: PeriodAttendanceRecord[] = [];

    Object.entries(studentStatuses).forEach(([studentId, info]) => {
      const recordId = `${date}_${classId}_${period}_${studentId}`;
      newRecords.push({
        id: recordId,
        date,
        classId,
        period,
        studentId,
        status: info.status,
        excuseReason: info.excuseReason,
        recordedBy: data.currentUser.name,
        recordedByRole: data.currentUser.role,
        recordedAt: nowIso,
        updatedAt: nowIso,
        updatedBy: data.currentUser.name,
      });
    });

    const newBatch: AttendanceBatchMetadata = {
      id: batchId,
      date,
      classId,
      period,
      isCompleted: true,
      recordedBy: data.currentUser.name,
      recordedAt: nowIso,
      updatedAt: nowIso,
      updatedBy: data.currentUser.name,
    };

    setData((prev) => {
      // Remove previous records for this specific date, class, period
      const filteredRecords = prev.records.filter(
        (r) => !(r.date === date && r.classId === classId && r.period === period)
      );
      const filteredBatches = prev.batches.filter((b) => b.id !== batchId);

      return {
        ...prev,
        records: [...filteredRecords, ...newRecords],
        batches: [...filteredBatches, newBatch],
      };
    });

    const cls = data.classes.find((c) => c.id === classId);
    logAudit(
      'تسجيل غياب الحصة',
      `تم حفظ غياب ${cls?.name || classId} للحصة (${period}) لتاريخ ${date} بواسطة ${data.currentUser.name}`
    );

    addToast('success', `تم حفظ حضور وغياب ${cls?.name || ''} للحصة (${period}) بنجاح.`);
  };

  const markStudentAbsentAllDay = (params: {
    date: string;
    classId: string;
    studentId: string;
    excuseReason?: string;
  }) => {
    const { date, classId, studentId, excuseReason } = params;
    const student = data.students.find((s) => s.id === studentId);
    const cls = data.classes.find((c) => c.id === classId);
    if (!student) return;

    const nowIso = new Date().toISOString();
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    setData((prev) => {
      // Remove previous records for this student on this date across any period
      const otherRecords = prev.records.filter(
        (r) => !(r.date === date && r.studentId === studentId)
      );

      const newDayRecords: PeriodAttendanceRecord[] = periods.map((p) => ({
        id: `${date}_${classId}_${p}_${studentId}`,
        date,
        classId,
        period: p,
        studentId,
        status: 'absent' as AttendanceStatus,
        excuseReason: excuseReason || 'غياب كامل اليوم (الحصص الثماني)',
        recordedBy: data.currentUser.name,
        recordedByRole: data.currentUser.role,
        recordedAt: nowIso,
        updatedAt: nowIso,
        updatedBy: data.currentUser.name,
      }));

      // Ensure batches exist for each period if not already present
      const updatedBatches = [...prev.batches];
      periods.forEach((p) => {
        const batchId = `${date}_${classId}_${p}`;
        const existingIdx = updatedBatches.findIndex((b) => b.id === batchId);
        if (existingIdx >= 0) {
          updatedBatches[existingIdx] = {
            ...updatedBatches[existingIdx],
            updatedAt: nowIso,
            updatedBy: data.currentUser.name,
          };
        } else {
          updatedBatches.push({
            id: batchId,
            date,
            classId,
            period: p,
            isCompleted: true,
            recordedBy: data.currentUser.name,
            recordedAt: nowIso,
            updatedAt: nowIso,
            updatedBy: data.currentUser.name,
          });
        }
      });

      return {
        ...prev,
        records: [...otherRecords, ...newDayRecords],
        batches: updatedBatches,
      };
    });

    logAudit(
      'تسجيل غياب طول اليوم',
      `تم تسجيل غياب الطالب ${student.fullName} (${cls?.name || ''}) عن الحصص الثماني كاملة لتاريخ ${date}`
    );
    addToast(
      'success',
      `تم تسجيل غياب الطالب ${student.fullName} في الحصص الثماني معاً (طوال اليوم).`
    );
  };

  const deleteStudentAbsenceWithMedicalExcuse = (params: {
    date: string;
    studentId: string;
    mode: 'remove' | 'excuse';
    medicalDocRef?: string;
    notes?: string;
  }) => {
    const { date, studentId, mode, medicalDocRef, notes } = params;
    const student = data.students.find((s) => s.id === studentId);
    if (!student) return;

    const nowIso = new Date().toISOString();
    const docLabel = medicalDocRef ? `مستند طبي رقم: ${medicalDocRef}` : 'مستند طبي معتمد';
    const fullExcuseText = notes ? `${docLabel} - ${notes}` : docLabel;

    let affectedCount = 0;

    setData((prev) => {
      let updatedRecords: PeriodAttendanceRecord[];

      if (mode === 'remove') {
        // Change absent records to present with audit note so absence is erased/cancelled
        updatedRecords = prev.records.map((r) => {
          if (r.date === date && r.studentId === studentId && (r.status === 'absent' || r.status === 'excused')) {
            affectedCount++;
            return {
              ...r,
              status: 'present' as AttendanceStatus,
              excuseReason: `تم شطب الغياب بمستند طبي (${fullExcuseText})`,
              updatedAt: nowIso,
              updatedBy: data.currentUser.name,
            };
          }
          return r;
        });
      } else {
        // Mode === 'excuse': convert absent records to excused with medical document
        updatedRecords = prev.records.map((r) => {
          if (r.date === date && r.studentId === studentId && (r.status === 'absent' || r.status === 'late')) {
            affectedCount++;
            return {
              ...r,
              status: 'excused' as AttendanceStatus,
              excuseReason: `مستأذن بعذر طبي: ${fullExcuseText}`,
              updatedAt: nowIso,
              updatedBy: data.currentUser.name,
            };
          }
          return r;
        });
      }

      return {
        ...prev,
        records: updatedRecords,
      };
    });

    const actionTitle = mode === 'remove' ? 'شطب وحذف غياب بمستند طبي' : 'اعتماد إجازة مرضية لطالب';
    logAudit(
      actionTitle,
      `تم ${mode === 'remove' ? 'شطب وحذف' : 'تحويل'} غياب الطالب ${student.fullName} لتاريخ ${date}. المستند: ${fullExcuseText}`
    );

    addToast(
      'success',
      `تم ${mode === 'remove' ? 'حذف وشطب غياب' : 'اعتماد العذر الطبي لـ'} الطالب ${student.fullName} بنجاح بموجب المستند الطبي.`
    );
  };

  const updateSettings = (updates: Partial<SchoolSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
    logAudit('تحديث إعدادات المدرسة', 'تم تعديل بيانات المدرسة الرسمية.');
    addToast('success', 'تم حفظ إعدادات المدرسة.');
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newId = `user-${Date.now()}`;
    setData((prev) => ({
      ...prev,
      users: [...prev.users, { ...user, id: newId }],
    }));
    logAudit('إضافة مستخدم', `تم إنشاء حساب مستخدم: ${user.name}`);
    addToast('success', `تمت إضافة المستخدم ${user.name} بنجاح.`);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      currentUser: prev.currentUser.id === id ? { ...prev.currentUser, ...updates } : prev.currentUser,
    }));
    logAudit('تعديل مستخدم', `تم تعديل بيانات المستخدم (معرف: ${id})`);
    addToast('success', 'تم تعديل بيانات المستخدم بنجاح.');
  };

  const deleteUser = (id: string) => {
    if (data.users.length <= 1) {
      addToast('error', 'لا يمكن حذف المستخدم الوحيد في النظام.');
      return;
    }
    setData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
    logAudit('حذف مستخدم', `تم حذف حساب المستخدم (معرف: ${id})`);
    addToast('info', 'تم حذف حساب المستخدم.');
  };

  const resetToDemo = () => {
    const fresh = resetStorageToDefaults();
    setData(fresh);
    addToast('success', 'تمت إعادة تعيين البيانات التجريبية لـ٢٩ صفاً بنجاح.');
  };

  const clearData = () => {
    const empty = clearAllStudentAndAttendanceData();
    setData(empty);
    addToast('info', 'تم تصفير قوائم الطلاب وسجلات الغياب للبدء الفعلي النظيف.');
  };

  const restoreData = (newState: AppState) => {
    setData(newState);
    saveAllData(newState);
    addToast('success', 'تمت استعادة النسخة الاحتياطية بنجاح.');
  };

  // Queries
  const getStudentsByClass = (classId: string, includeArchived = false) => {
    return data.students.filter((s) => s.classId === classId && (includeArchived ? true : !s.isArchived));
  };

  const getClassAttendanceStatusForDate = (date: string, classId: string) => {
    const completedPeriods = data.batches
      .filter((b) => b.date === date && b.classId === classId && b.isCompleted)
      .map((b) => b.period)
      .sort((a, b) => a - b);

    return {
      completedPeriods,
      isFullyRecorded: completedPeriods.length === 8,
      hasAnyRecord: completedPeriods.length > 0,
    };
  };

  // Daily summary calculation
  const getDailySummary = (date: string) => {
    const activeStudents = data.students.filter((s) => !s.isArchived);
    const totalStudents = activeStudents.length;

    // Filter all records for the given date
    const dateRecords = data.records.filter((r) => r.date === date);

    // Group records by student
    const studentStatusMap = new Map<string, AttendanceStatus[]>();
    dateRecords.forEach((r) => {
      if (!studentStatusMap.has(r.studentId)) {
        studentStatusMap.set(r.studentId, []);
      }
      studentStatusMap.get(r.studentId)!.push(r.status);
    });

    let uniqueAbsentCount = 0;
    let uniqueLateCount = 0;
    let uniqueExcusedCount = 0;
    let totalPeriodAbsenceInstances = 0;

    studentStatusMap.forEach((statuses) => {
      const hasAbsent = statuses.includes('absent');
      const hasLate = statuses.includes('late');
      const hasExcused = statuses.includes('excused');

      if (hasAbsent) {
        uniqueAbsentCount++;
      } else if (hasExcused) {
        uniqueExcusedCount++;
      } else if (hasLate) {
        uniqueLateCount++;
      }

      totalPeriodAbsenceInstances += statuses.filter((s) => s === 'absent').length;
    });

    // Unique present students = total active students minus students who were absent/excused in that day
    // (If no records at all yet for a student, they are considered default enrolled/present or unrecorded)
    const uniquePresentStudents = Math.max(0, totalStudents - uniqueAbsentCount - uniqueExcusedCount);

    const attendanceRate = totalStudents > 0 ? Math.round((uniquePresentStudents / totalStudents) * 100) : 0;
    const absenceRate = totalStudents > 0 ? Math.round((uniqueAbsentCount / totalStudents) * 100) : 0;

    // Class completion stats
    const totalClassesCount = data.classes.length;
    let completedClassesCount = 0;

    data.classes.forEach((cls) => {
      const { isFullyRecorded } = getClassAttendanceStatusForDate(date, cls.id);
      if (isFullyRecorded) completedClassesCount++;
    });

    const pendingClassesCount = Math.max(0, totalClassesCount - completedClassesCount);

    return {
      totalStudents,
      uniquePresentStudents,
      uniqueAbsentStudents: uniqueAbsentCount,
      uniqueLateStudents: uniqueLateCount,
      uniqueExcusedStudents: uniqueExcusedCount,
      attendanceRate,
      absenceRate,
      totalPeriodAbsenceInstances,
      completedClassesCount,
      pendingClassesCount,
      totalClassesCount,
    };
  };

  const value = {
    classes: data.classes,
    students: data.students,
    records: data.records,
    batches: data.batches,
    settings: data.settings,
    users: data.users,
    currentUser: data.currentUser,
    auditLogs: data.auditLogs,
    isOnline,
    activeTab,
    setActiveTab,
    toasts,
    addToast,
    removeToast,
    setCurrentUser,
    canEditClassAttendance,
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    updateStudent,
    transferStudent,
    archiveStudent,
    unarchiveStudent,
    deleteStudentPermanently,
    bulkUpdateParentPhones,
    importStudents,
    savePeriodAttendance,
    markStudentAbsentAllDay,
    deleteStudentAbsenceWithMedicalExcuse,
    updateSettings,
    addUser,
    updateUser,
    deleteUser,
    resetToDemo,
    clearData,
    restoreData,
    getStudentsByClass,
    getClassAttendanceStatusForDate,
    getDailySummary,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
