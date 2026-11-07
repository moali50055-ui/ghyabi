import * as XLSX from 'xlsx';
import { Student, ClassRoom } from '../types';

export interface ParsedStudentRow {
  rowNumber: number;
  fullName: string;
  classIdentifier?: string; // May be class name e.g. "الصف ٥/١" or "5/1" or "٥/١"
  matchedClassId?: string;
  matchedClassName?: string;
  schoolId: string;
  guardianPhone?: string;
  isValid: boolean;
  validationErrors: string[];
  isDuplicateInFile?: boolean;
  isDuplicateInDb?: boolean;
}

export interface ExcelImportResult {
  fileName: string;
  totalRows: number;
  validRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
  detectedClasses: string[];
}

// Normalize Arabic numbers & text
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ');
}

// Find matching class from text like "الصف ٥/١", "5/1", "٥/١", "صف 5-1"
export function matchClassFromText(text: string, classes: ClassRoom[]): ClassRoom | undefined {
  if (!text) return undefined;
  const clean = text.trim();

  // Direct name match
  const exact = classes.find((c) => c.name.trim() === clean);
  if (exact) return exact;

  // Normalized digits match (e.g. 5/1, 5-1)
  const normInput = clean.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const match = normInput.match(/(\d+)[\/\-_](\d+)/);
  if (match) {
    const grade = parseInt(match[1], 10);
    const section = parseInt(match[2], 10);
    return classes.find((c) => c.grade === grade && c.section === section);
  }

  // Substring search
  return classes.find((c) => c.name.includes(clean) || clean.includes(c.name));
}

// Parse Excel file (XLSX or XLS)
export async function parseStudentsExcelFile(
  file: File,
  classes: ClassRoom[],
  existingStudents: Student[],
  defaultClassId?: string
): Promise<ExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // Pick first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON array of rows
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawJson.length < 2) {
          throw new Error('الملف فارغ أو لا يحتوي على صفوف بيانات كافية.');
        }

        // Find header row (usually row 0 or 1)
        let headerRowIdx = 0;
        let colMap: { nameCol: number; classCol: number; idCol: number; phoneCol: number } = {
          nameCol: -1,
          classCol: -1,
          idCol: -1,
          phoneCol: -1,
        };

        for (let r = 0; r < Math.min(5, rawJson.length); r++) {
          const row = rawJson[r];
          if (!Array.isArray(row)) continue;

          row.forEach((cellVal: any, colIdx: number) => {
            const str = String(cellVal).trim().toLowerCase();
            if (colMap.nameCol === -1 && (str.includes('اسم') || str.includes('طالب') || str.includes('name') || str.includes('الاسم'))) {
              colMap.nameCol = colIdx;
            } else if (colMap.classCol === -1 && (str.includes('صف') || str.includes('فصل') || str.includes('شعبة') || str.includes('class') || str.includes('grade'))) {
              colMap.classCol = colIdx;
            } else if (colMap.idCol === -1 && (str.includes('رقم') || str.includes('قيد') || str.includes('مدني') || str.includes('مدرسي') || str.includes('id'))) {
              colMap.idCol = colIdx;
            } else if (colMap.phoneCol === -1 && (str.includes('هاتف') || str.includes('جوال') || str.includes('ولي') || str.includes('phone') || str.includes('mobile'))) {
              colMap.phoneCol = colIdx;
            }
          });

          if (colMap.nameCol !== -1) {
            headerRowIdx = r;
            break;
          }
        }

        // If no headers matched by name, assume standard column order: Col 0: Name, Col 1: Class, Col 2: ID
        if (colMap.nameCol === -1) {
          colMap = { nameCol: 0, classCol: 1, idCol: 2, phoneCol: 3 };
          headerRowIdx = 0; // Assume row 0 is header or data
        }

        const validRows: ParsedStudentRow[] = [];
        const invalidRows: ParsedStudentRow[] = [];
        const detectedClassesSet = new Set<string>();

        const existingIdsSet = new Set(existingStudents.map((s) => s.schoolId.trim()));
        const existingNamesSet = new Set(existingStudents.map((s) => s.fullName.trim().toLowerCase()));

        const seenFileIds = new Set<string>();
        const seenFileNames = new Set<string>();

        for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!Array.isArray(row) || row.every((c) => String(c).trim() === '')) {
            continue; // Skip empty rows
          }

          const rawName = colMap.nameCol >= 0 ? String(row[colMap.nameCol] || '').trim() : '';
          const rawClass = colMap.classCol >= 0 ? String(row[colMap.classCol] || '').trim() : '';
          const rawId = colMap.idCol >= 0 ? String(row[colMap.idCol] || '').trim() : '';
          const rawPhone = colMap.phoneCol >= 0 ? String(row[colMap.phoneCol] || '').trim() : '';

          const validationErrors: string[] = [];

          if (!rawName) {
            validationErrors.push('اسم الطالب مفقود');
          } else if (rawName.split(' ').length < 2) {
            validationErrors.push('يُفضل إدخال الاسم ثلاثياً أو رباعياً على الأقل');
          }

          // Match class
          let matchedClass: ClassRoom | undefined;
          if (rawClass) {
            matchedClass = matchClassFromText(rawClass, classes);
            detectedClassesSet.add(rawClass);
          } else if (defaultClassId) {
            matchedClass = classes.find((c) => c.id === defaultClassId);
          }

          if (!matchedClass) {
            if (rawClass) {
              validationErrors.push(`لم يتم العثور على صف مطابق لـ "${rawClass}"`);
            } else {
              validationErrors.push('لم يتم تحديد الصف في الملف، يرجى اختيار صف افتراضي للاستيراد');
            }
          }

          // School ID fallback if missing
          const schoolId = rawId || `AUT-${Date.now().toString().slice(-6)}-${r}`;

          // Duplicate checks
          const isDupInDb = existingIdsSet.has(schoolId) || existingNamesSet.has(rawName.toLowerCase());
          const isDupInFile = (rawId && seenFileIds.has(rawId)) || seenFileNames.has(rawName.toLowerCase());

          if (rawId) seenFileIds.add(rawId);
          if (rawName) seenFileNames.add(rawName.toLowerCase());

          const parsedRow: ParsedStudentRow = {
            rowNumber: r + 1,
            fullName: rawName,
            classIdentifier: rawClass,
            matchedClassId: matchedClass?.id,
            matchedClassName: matchedClass?.name,
            schoolId,
            guardianPhone: rawPhone || 'غير مسجل',
            isValid: validationErrors.length === 0,
            validationErrors,
            isDuplicateInFile: isDupInFile,
            isDuplicateInDb: isDupInDb,
          };

          if (parsedRow.isValid) {
            validRows.push(parsedRow);
          } else {
            invalidRows.push(parsedRow);
          }
        }

        resolve({
          fileName: file.name,
          totalRows: validRows.length + invalidRows.length,
          validRows,
          invalidRows,
          detectedClasses: Array.from(detectedClassesSet),
        });
      } catch (err) {
        reject(err instanceof Error ? err.message : 'فشل قراءة ملف الإكسل.');
      }
    };

    reader.onerror = () => reject('حدث خطأ أثناء قراءة الملف من الجهاز.');
    reader.readAsArrayBuffer(file);
  });
}

// Download Excel Template for Teachers / Admins
export function downloadExcelTemplate(): void {
  const sampleData = [
    {
      'الرقم المدرسي': '2024090101',
      'اسم الطالب': 'محمد بن سالم بن علي البلوشي',
      'الصف': 'الصف ٩/١',
      'هاتف ولي الأمر': '91234567',
      'ملاحظات': 'طالب منتظم',
    },
    {
      'الرقم المدرسي': '2024100101',
      'اسم الطالب': 'سلطان بن حمود بن ناصر المعمري',
      'الصف': 'الصف ١٠/١',
      'هاتف ولي الأمر': '92345678',
      'ملاحظات': '',
    },
    {
      'الرقم المدرسي': '2024110101',
      'اسم الطالب': 'أحمد بن سعيد بن حمد الحوسني',
      'الصف': 'الصف ١١/١',
      'هاتف ولي الأمر': '71122334',
      'ملاحظات': '',
    },
    {
      'الرقم المدرسي': '2024120101',
      'اسم الطالب': 'ناصر بن خلفان بن مبارك العامري',
      'الصف': 'الصف ١٢/١',
      'هاتف ولي الأمر': '99887766',
      'ملاحظات': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 16 }, // الرقم المدرسي
    { wch: 32 }, // اسم الطالب
    { wch: 14 }, // الصف
    { wch: 16 }, // الهاتف
    { wch: 20 }, // ملاحظات
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'بيانات الطلاب');
  XLSX.writeFile(workbook, 'قالب_استيراد_الطلاب_المدرسي.xlsx');
}

// Export Students list to Excel
export function exportStudentsToExcel(students: Student[], classes: ClassRoom[], fileName = 'قائمة_الطلاب_المدرسية.xlsx'): void {
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  const rows = students.map((s, index) => ({
    'م': index + 1,
    'الرقم المدرسي': s.schoolId,
    'اسم الطالب': s.fullName,
    'الصف الدراسي': classMap.get(s.classId) || s.classId,
    'هاتف ولي الأمر': s.guardianPhone,
    'الحالة': s.isArchived ? 'مؤرشف' : 'نشط',
    'سبب الأرشفة': s.archiveReason || '-',
    'ملاحظات': s.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 32 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
    { wch: 20 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
  XLSX.writeFile(workbook, fileName);
}

// Export Attendance Report to Excel
export function exportAttendanceReportToExcel(
  reportData: any[],
  sheetName: string,
  fileName: string
): void {
  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
