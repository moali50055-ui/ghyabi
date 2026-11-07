export type UserRole = 'admin' | 'management' | 'teacher';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  assignedClassIds?: string[]; // IDs of classes assigned to this teacher
  jobTitle?: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "الصف ٥/١"
  grade: number; // 5
  section: number; // 1
  stage: string; // "التعليم الأساسي (٥-١٠)" or "ما بعد الأساسي (١١-١٢)"
  roomNumber?: string;
  supervisorTeacherId?: string;
  supervisorTeacherName?: string;
  notes?: string;
}

export interface Student {
  id: string;
  schoolId: string; // الرقم المدرسي أو المدني
  fullName: string; // اسم الطالب رباعي
  classId: string; // معرف الصف الحالي
  gender: 'بنين' | 'بنات';
  guardianPhone: string; // هاتف ولي الأمر
  guardianName?: string;
  isArchived: boolean; // أرشفة الطالب بدلاً من حذفه
  archiveReason?: string;
  archivedAt?: string;
  createdAt: string;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface PeriodAttendanceRecord {
  id: string; // composite key: `${date}_${classId}_${period}_${studentId}`
  date: string; // YYYY-MM-DD
  classId: string;
  period: number; // 1 to 8
  studentId: string;
  status: AttendanceStatus;
  excuseReason?: string;
  recordedBy: string; // اسم المستخدم/المعلم
  recordedByRole: UserRole;
  recordedAt: string; // ISO
  updatedAt?: string;
  updatedBy?: string;
}

export interface AttendanceBatchMetadata {
  id: string; // `${date}_${classId}_${period}`
  date: string;
  classId: string;
  period: number;
  isCompleted: boolean;
  recordedBy: string;
  recordedAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
}

export interface SchoolSettings {
  schoolName: string;
  ministryName: string;
  directorate: string; // المديرية العامة للتربية والتعليم
  wilayat: string; // الولاية
  academicYear: string; // العام الدراسي
  principalName: string; // مدير المدرسة
  assistantPrincipalName: string; // مساعد المدير لشؤون الطلاب
  totalOfficialClasses: number; // 29
}
