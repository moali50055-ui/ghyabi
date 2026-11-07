import {
  ClassRoom,
  Student,
  PeriodAttendanceRecord,
  AttendanceBatchMetadata,
  User,
  SchoolSettings,
  AuditLog,
} from '../types';
import {
  DEFAULT_SCHOOL_SETTINGS,
  DEFAULT_USERS,
  generate29Classes,
  generateInitialStudents,
  generateInitialAttendance,
  INITIAL_AUDIT_LOGS,
} from '../utils/initialData';

const KEYS = {
  CLASSES: 'om_school_classes_v1',
  STUDENTS: 'om_school_students_v1',
  RECORDS: 'om_school_records_v1',
  BATCHES: 'om_school_batches_v1',
  SETTINGS: 'om_school_settings_v1',
  USERS: 'om_school_users_v1',
  CURRENT_USER: 'om_school_current_user_v1',
  AUDIT_LOGS: 'om_school_audit_logs_v1',
};

export interface AppState {
  classes: ClassRoom[];
  students: Student[];
  records: PeriodAttendanceRecord[];
  batches: AttendanceBatchMetadata[];
  settings: SchoolSettings;
  users: User[];
  currentUser: User;
  auditLogs: AuditLog[];
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadInitialOrStoredData(): AppState {
  try {
    const storedClasses = localStorage.getItem(KEYS.CLASSES);
    const storedStudents = localStorage.getItem(KEYS.STUDENTS);
    const storedRecords = localStorage.getItem(KEYS.RECORDS);
    const storedBatches = localStorage.getItem(KEYS.BATCHES);
    const storedSettings = localStorage.getItem(KEYS.SETTINGS);
    const storedUsers = localStorage.getItem(KEYS.USERS);
    const storedCurrentUser = localStorage.getItem(KEYS.CURRENT_USER);
    const storedAuditLogs = localStorage.getItem(KEYS.AUDIT_LOGS);

    if (storedClasses && storedStudents) {
      let classes: ClassRoom[] = JSON.parse(storedClasses);
      let students: Student[] = JSON.parse(storedStudents);
      let records: PeriodAttendanceRecord[] = storedRecords ? JSON.parse(storedRecords) : [];
      let batches: AttendanceBatchMetadata[] = storedBatches ? JSON.parse(storedBatches) : [];

      // Migrate to new grade 9-12 structure if old grades 5-8 are present
      if (classes.some((c) => c.grade < 9)) {
        classes = generate29Classes();
        students = generateInitialStudents(classes);
        const { records: newRecords, batches: newBatches } = generateInitialAttendance(
          classes,
          students,
          getTodayDateString()
        );
        records = newRecords;
        batches = newBatches;
      }

      let settings: SchoolSettings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SCHOOL_SETTINGS;
      settings.schoolName = DEFAULT_SCHOOL_SETTINGS.schoolName;
      settings.ministryName = DEFAULT_SCHOOL_SETTINGS.ministryName;
      settings.directorate = DEFAULT_SCHOOL_SETTINGS.directorate;
      settings.wilayat = DEFAULT_SCHOOL_SETTINGS.wilayat;
      settings.principalName = DEFAULT_SCHOOL_SETTINGS.principalName;
      settings.totalOfficialClasses = 27;

      const users: User[] = DEFAULT_USERS;
      const currentUser: User = users[0];
      const auditLogs: AuditLog[] = storedAuditLogs ? JSON.parse(storedAuditLogs) : INITIAL_AUDIT_LOGS;

      const updatedState = {
        classes,
        students,
        records,
        batches,
        settings,
        users,
        currentUser,
        auditLogs,
      };

      saveAllData(updatedState);
      return updatedState;
    }
  } catch (err) {
    console.error('Error reading localStorage, initializing defaults:', err);
  }

  // Generate pristine initial default data
  const defaultClasses = generate29Classes();
  const defaultStudents = generateInitialStudents(defaultClasses);
  const today = getTodayDateString();
  const { records: defaultRecords, batches: defaultBatches } = generateInitialAttendance(
    defaultClasses,
    defaultStudents,
    today
  );

  const initialData: AppState = {
    classes: defaultClasses,
    students: defaultStudents,
    records: defaultRecords,
    batches: defaultBatches,
    settings: DEFAULT_SCHOOL_SETTINGS,
    users: DEFAULT_USERS,
    currentUser: DEFAULT_USERS[0],
    auditLogs: INITIAL_AUDIT_LOGS,
  };

  saveAllData(initialData);
  return initialData;
}

export function saveAllData(state: AppState): void {
  try {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(state.classes));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(state.students));
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(state.records));
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(state.batches));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(KEYS.USERS, JSON.stringify(state.users));
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(state.auditLogs));
  } catch (err) {
    console.error('Failed to write to localStorage:', err);
  }
}

// Download complete JSON backup
export function downloadBackupFile(state: AppState): void {
  const backupObject = {
    app: 'OmanSchoolAttendanceSystem',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: state,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObject, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `school_attendance_backup_${getTodayDateString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Restore from JSON backup file
export async function restoreFromBackupFile(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.data || !Array.isArray(parsed.data.classes) || !Array.isArray(parsed.data.students)) {
          throw new Error('الملف غير صالح أو لا يحتوي على بنية البيانات المدرسية الصحيحة.');
        }
        const state: AppState = parsed.data;
        saveAllData(state);
        resolve(state);
      } catch (err) {
        reject(err instanceof Error ? err.message : 'خطأ في معالجة ملف النسخة الاحتياطية.');
      }
    };
    reader.onerror = () => reject('تعذر قراءة الملف.');
    reader.readAsText(file);
  });
}

// Reset everything to pristine factory defaults
export function resetStorageToDefaults(): AppState {
  localStorage.clear();
  return loadInitialOrStoredData();
}

// Clear all demo data to an empty school with 29 empty classes
export function clearAllStudentAndAttendanceData(): AppState {
  const currentSettings = DEFAULT_SCHOOL_SETTINGS;
  const classes = generate29Classes();
  const emptyState: AppState = {
    classes,
    students: [],
    records: [],
    batches: [],
    settings: currentSettings,
    users: DEFAULT_USERS,
    currentUser: DEFAULT_USERS[0],
    auditLogs: [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: 'أستاذ ناصر بن سعيد الهاشمي (مدير النظام)',
        userRole: 'admin',
        action: 'تصفير البيانات التجريبية',
        details: 'تم تفريغ كافة سجلات الطلاب والغياب لبدء الاستخدام الفعلي بالمدرسة مع الحفاظ على الصفوف الـ٢٧.',
      },
    ],
  };

  saveAllData(emptyState);
  return emptyState;
}
