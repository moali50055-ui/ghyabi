import { ClassRoom, Student, PeriodAttendanceRecord, AttendanceBatchMetadata, User, SchoolSettings, AuditLog } from '../types';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'مدرسة قتيبة بن مسلم',
  ministryName: 'وزارة التعليم',
  directorate: 'محافظة جنوب الشرقية',
  wilayat: 'محافظة جنوب الشرقية',
  academicYear: '٢٠٢٥ / ٢٠٢٦ م',
  principalName: 'أستاذ ناصر بن سعيد الهاشمي',
  assistantPrincipalName: 'أ. محمد بن خلفان العامري',
  totalOfficialClasses: 27,
};

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'أستاذ ناصر بن سعيد الهاشمي',
    role: 'admin',
    email: 'naser.alhashmi@school.om',
    jobTitle: 'مدير المدرسة ومدير النظام (كامل الصلاحيات)',
  },
  {
    id: 'user-management',
    name: 'أ. مريم بنت سيف المعمرية',
    role: 'management',
    email: 'admin.deputy@school.om',
    jobTitle: 'مساعد مدير المدرسة لشؤون الطلاب',
  },
  {
    id: 'user-teacher-1',
    name: 'أ. أحمد بن محمد الحارثي',
    role: 'teacher',
    email: 'a.alharthy@school.om',
    jobTitle: 'معلم أول لغة عربية',
    assignedClassIds: ['class-9-1', 'class-9-2', 'class-10-1', 'class-10-2'],
  },
  {
    id: 'user-teacher-2',
    name: 'أ. حمود بن سعيد الحوسني',
    role: 'teacher',
    email: 'h.alhosni@school.om',
    jobTitle: 'معلم رياضيات',
    assignedClassIds: ['class-11-1', 'class-11-2', 'class-12-1', 'class-12-2'],
  },
];

// Generates the official school classes:
// 9/1 to 9/5 (5 classes)
// 10/1 to 10/5 (5 classes)
// 11/1 to 11/8 (8 classes)
// 12/1 to 12/9 (9 classes)
export function generate29Classes(): ClassRoom[] {
  const classes: ClassRoom[] = [];
  
  // Grade 9: 5 classes (من تاسع 1 إلى تاسع 5)
  for (let s = 1; s <= 5; s++) {
    classes.push({
      id: `class-9-${s}`,
      name: `الصف ٩/${s}`,
      grade: 9,
      section: s,
      stage: 'التعليم الأساسي (٩-١٠)',
      roomNumber: `قاعة 90${s}`,
      supervisorTeacherName: s === 1 ? 'أ. أحمد الحارثي' : `أ. مشرف ٩/${s}`,
    });
  }

  // Grade 10: 5 classes (من عاشر 1 إلى عاشر 5)
  for (let s = 1; s <= 5; s++) {
    classes.push({
      id: `class-10-${s}`,
      name: `الصف ١٠/${s}`,
      grade: 10,
      section: s,
      stage: 'التعليم الأساسي (٩-١٠)',
      roomNumber: `قاعة 100${s}`,
      supervisorTeacherName: `أ. مشرف ١٠/${s}`,
    });
  }

  // Grade 11: 8 classes (من حادي عشر 1 إلى حادي عشر 8)
  for (let s = 1; s <= 8; s++) {
    classes.push({
      id: `class-11-${s}`,
      name: `الصف ١١/${s}`,
      grade: 11,
      section: s,
      stage: 'التعليم ما بعد الأساسي (١١-١٢)',
      roomNumber: `قاعة 110${s}`,
      supervisorTeacherName: s === 1 ? 'أ. ناصر الحوسني' : `أ. مشرف ١١/${s}`,
    });
  }

  // Grade 12: 9 classes (من ثاني عشر 1 إلى ثاني عشر 9)
  for (let s = 1; s <= 9; s++) {
    classes.push({
      id: `class-12-${s}`,
      name: `الصف ١٢/${s}`,
      grade: 12,
      section: s,
      stage: 'التعليم ما بعد الأساسي (١١-١٢)',
      roomNumber: `قاعة 120${s}`,
      supervisorTeacherName: `أ. مشرف ١٢/${s}`,
    });
  }

  return classes;
}

// Authentic Omani names
const FIRST_NAMES = [
  'محمد', 'عبدالله', 'أحمد', 'سلطان', 'حمد', 'سالم', 'سعيد', 'علي', 'خالد', 'ناصر',
  'فيصل', 'مهند', 'يوسف', 'ماجد', 'فهد', 'عمر', 'إبراهيم', 'هيثم', 'طارق', 'راشد',
  'سعود', 'حامد', 'بدر', 'معاذ', 'أسامة', 'زايد', 'إلياس', 'يعرب', 'مؤيد', 'المنذر'
];

const FATHER_NAMES = [
  'بن سعيد', 'بن ناصر', 'بن سالم', 'بن حمد', 'بن راشد', 'بن محمد', 'بن خلفان', 'بن عبدالله',
  'بن علي', 'بن مبارك', 'بن مسعود', 'بن حمود', 'بن خميس', 'بن بدر', 'بن جمعة'
];

const GRANDFATHER_NAMES = [
  'بن حارب', 'بن سيف', 'بن عامر', 'بن صالح', 'بن غانم', 'بن سهيل', 'بن مظفر', 'بن درويش'
];

const TRIBE_NAMES = [
  'البلوشي', 'العامري', 'الحارثي', 'الحوسني', 'المعولي', 'اليعربي', 'الراشدي', 'الشامسي',
  'المعمري', 'الريامي', 'الوهيبي', 'الكندي', 'الجهوري', 'السيابي', 'الشحي', 'الخروصي',
  'المقبالي', 'السعدي', 'الغافري', 'الهنائي', 'السنيدي', 'الحكماني', 'العلوي', 'البوسعيدي'
];

// Generates students for all 29 classes (~20 students per class = ~580 students)
export function generateInitialStudents(classes: ClassRoom[]): Student[] {
  const students: Student[] = [];
  let studentCounter = 1001;

  classes.forEach((c) => {
    // 18 to 22 students per class
    const studentCount = 18 + (c.grade % 5);
    for (let i = 1; i <= studentCount; i++) {
      const first = FIRST_NAMES[(studentCounter + i * 3) % FIRST_NAMES.length];
      const father = FATHER_NAMES[(studentCounter + i * 5) % FATHER_NAMES.length];
      const grand = GRANDFATHER_NAMES[(studentCounter + i * 2) % GRANDFATHER_NAMES.length];
      const tribe = TRIBE_NAMES[(studentCounter + i * 7) % TRIBE_NAMES.length];
      const fullName = `${first} ${father} ${grand} ${tribe}`;
      
      const phonePrefix = (i % 2 === 0) ? '9' : '7';
      const phoneNum = `${phonePrefix}${Math.floor(1000000 + Math.random() * 8999999)}`;
      const schoolId = `2024${String(c.grade).padStart(2, '0')}${String(c.section)}${String(i).padStart(3, '0')}`;

      // Archive a couple of students for demonstration
      const isArchived = (studentCounter % 97 === 0);

      students.push({
        id: `std-${studentCounter}`,
        schoolId,
        fullName,
        classId: c.id,
        gender: 'بنين',
        guardianPhone: phoneNum,
        guardianName: `${father.replace('بن ', '')} ${tribe}`,
        isArchived,
        archiveReason: isArchived ? 'انتقال إلى مدرسة أخرى بمحافظة الداخلية' : undefined,
        archivedAt: isArchived ? '2025-09-15' : undefined,
        createdAt: '2025-09-01',
      });

      studentCounter++;
    }
  });

  return students;
}

// Generates sample attendance records for today (8 periods)
export function generateInitialAttendance(
  classes: ClassRoom[],
  students: Student[],
  todayDate: string
): { records: PeriodAttendanceRecord[]; batches: AttendanceBatchMetadata[] } {
  const records: PeriodAttendanceRecord[] = [];
  const batches: AttendanceBatchMetadata[] = [];

  // Group active students by class
  const classStudentsMap: Record<string, Student[]> = {};
  students.filter(s => !s.isArchived).forEach(s => {
    if (!classStudentsMap[s.classId]) classStudentsMap[s.classId] = [];
    classStudentsMap[s.classId].push(s);
  });

  // Complete attendance for the first 18 classes up to period 4 or 5
  // And partially for some others to demonstrate realistic school progress
  classes.forEach((cls, classIndex) => {
    const classStudents = classStudentsMap[cls.id] || [];
    if (classStudents.length === 0) return;

    // Pick 1 to 2 chronic absentees for this class
    const absentStudent1 = classStudents[0]?.id;
    const absentStudent2 = classStudents[4]?.id;
    const lateStudent = classStudents[8]?.id;

    // First 15 classes completed up to period 4
    const maxPeriodRecorded = classIndex < 12 ? 4 : (classIndex < 20 ? 2 : 0);

    for (let p = 1; p <= maxPeriodRecorded; p++) {
      batches.push({
        id: `${todayDate}_${cls.id}_${p}`,
        date: todayDate,
        classId: cls.id,
        period: p,
        isCompleted: true,
        recordedBy: cls.supervisorTeacherName || 'أ. أحمد الحارثي',
        recordedAt: `${todayDate}T0${7 + p}:45:00.000Z`,
      });

      classStudents.forEach(st => {
        let status: 'present' | 'absent' | 'late' | 'excused' = 'present';
        let excuseReason: string | undefined;

        if (st.id === absentStudent1) {
          status = 'absent';
          excuseReason = 'عذر مرضي مسبق';
        } else if (st.id === absentStudent2 && (p === 2 || p === 3)) {
          // Absent in periods 2 and 3, present in 1 and 4!
          status = 'absent';
          excuseReason = 'في العيادة المدرسية';
        } else if (st.id === lateStudent && p === 1) {
          status = 'late';
          excuseReason = 'تأخر في الحافلة المدرسية';
        }

        records.push({
          id: `${todayDate}_${cls.id}_${p}_${st.id}`,
          date: todayDate,
          classId: cls.id,
          period: p,
          studentId: st.id,
          status,
          excuseReason,
          recordedBy: cls.supervisorTeacherName || 'أ. أحمد الحارثي',
          recordedByRole: 'teacher',
          recordedAt: `${todayDate}T0${7 + p}:45:00.000Z`,
        });
      });
    }
  });

  return { records, batches };
}

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    userName: 'أستاذ ناصر بن سعيد الهاشمي (مدير النظام)',
    userRole: 'admin',
    action: 'تهيئة النظام',
    details: 'تهيئة الصفوف وقوائم الطلاب لمدرسة قتيبة بن مسلم للعام الدراسي ٢٠٢٥ / ٢٠٢٦م بنجاح.',
  },
];
