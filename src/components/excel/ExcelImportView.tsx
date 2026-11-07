import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
  School,
  ArrowRight,
  RefreshCw,
  Eye,
  FileCheck,
} from 'lucide-react';
import {
  parseStudentsExcelFile,
  downloadExcelTemplate,
  ExcelImportResult,
  ParsedStudentRow,
} from '../../services/excelService';

export const ExcelImportView: React.FC = () => {
  const { classes, students, importStudents, setActiveTab } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Default class to apply if file lacks a class column
  const [defaultClassId, setDefaultClassId] = useState<string>(classes[0]?.id || '');
  
  // Parsed result
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);

  // Duplicate handling option
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');

  // Completed status
  const [successReport, setSuccessReport] = useState<{
    imported: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    // Check extension
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setErrorMessage('يرجى اختيار ملف إكسل بصيغة .xlsx أو .xls حصراً.');
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessReport(null);

    try {
      const result = await parseStudentsExcelFile(file, classes, students, defaultClassId);
      setImportResult(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء معالجة الملف.');
      setImportResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run parsing if user changes the default class selection
  const handleDefaultClassChange = async (classId: string) => {
    setDefaultClassId(classId);
    if (selectedFile) {
      setIsLoading(true);
      try {
        const result = await parseStudentsExcelFile(selectedFile, classes, students, classId);
        setImportResult(result);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'فشل إعادة المعالجة.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExecuteImport = () => {
    if (!importResult) return;

    const res = importStudents(importResult.validRows, {
      skipDuplicates: duplicateStrategy === 'skip',
      updateExisting: duplicateStrategy === 'update',
    });

    setSuccessReport({
      imported: res.importedCount,
      updated: res.updatedCount,
      skipped: res.skippedCount,
    });

    // Reset current file view to show success
    setImportResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            استيراد أسماء الطلاب من Excel (XLSX و XLS)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            يدعم استيراد طلاب عدة صفوف دفعة واحدة أو صف مستقل مع معاينة واكتشاف التكرار قبل الحفظ
          </p>
        </div>

        <button
          onClick={downloadExcelTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          تحميل النموذج المعتمد (.xlsx)
        </button>
      </div>

      {/* Success Banner if import completed */}
      {successReport && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-900">اكتمل استيراد ملف Excel بنجاح!</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                تم إضافة <span className="font-black text-emerald-950 underline">{successReport.imported}</span> طالباً جديداً، وتحديث بيانات{' '}
                <span className="font-black text-emerald-950">{successReport.updated}</span>، وتخطي{' '}
                <span className="font-bold">{successReport.skipped}</span> سجلات مكررة أو غير صالحة.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('students')}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer"
            >
              عرض قائمة الطلاب
            </button>
            <button
              onClick={() => setSuccessReport(null)}
              className="px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition cursor-pointer"
            >
              استيراد ملف آخر
            </button>
          </div>
        </div>
      )}

      {/* Upload Box */}
      {!importResult && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Optional default class selector if file lacks class column */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                الصف الافتراضي (في حال لم يحتوي ملف الإكسل على عمود يحدد الصف):
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                إذا كان الملف يحتوي على عمود "الصف" فسيتم التعرف على كل صف تلقائياً، وإلا فسيتم إسناد الطلاب إلى الصف التالي:
              </p>
              <select
                value={defaultClassId}
                onChange={(e) => handleDefaultClassChange(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-800 transition">
                اضغط هنا لاختيار ملف Excel أو اسحبه وأفلته هنا
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                يدعم صيغ <span className="font-bold text-slate-800">.XLSX</span> و{' '}
                <span className="font-bold text-slate-800">.XLS</span> (ملفات كشوفات المدارس المعتمدة أو البوابة التعليمية)
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200">الأعمدة المقروءة:</span>
                <span className="font-semibold text-slate-700">اسم الطالب</span> •
                <span className="font-semibold text-slate-700">الصف</span> •
                <span className="font-semibold text-slate-700">الرقم المدرسي</span> •
                <span className="font-semibold text-slate-700">هاتف ولي الأمر</span>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center gap-2 p-4 text-xs font-bold text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                جاري تحليل وقراءة بيانات ملف الإكسل...
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Preview Section */}
      {importResult && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  معاينة بيانات الملف: {importResult.fileName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                إجمالي السجلات المقروءة: <span className="font-bold text-slate-800">{importResult.totalRows}</span> •{' '}
                صالحة للاستيراد: <span className="font-bold text-emerald-700">{importResult.validRows.length}</span> •{' '}
                تحتوي ملاحظات: <span className="font-bold text-amber-700">{importResult.invalidRows.length}</span>
              </p>
              {importResult.detectedClasses.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600">
                  <span className="font-bold">الصفوف المكتشفة بالملف:</span>
                  <span className="text-blue-700 font-semibold">{importResult.detectedClasses.join('، ')}</span>
                </div>
              )}
            </div>

            {/* Strategy radio & Execute buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="radio"
                    name="strategy"
                    value="skip"
                    checked={duplicateStrategy === 'skip'}
                    onChange={() => setDuplicateStrategy('skip')}
                    className="text-blue-600 cursor-pointer"
                  />
                  تخطي المكرر
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                  <input
                    type="radio"
                    name="strategy"
                    value="update"
                    checked={duplicateStrategy === 'update'}
                    onChange={() => setDuplicateStrategy('update')}
                    className="text-blue-600 cursor-pointer"
                  />
                  تحديث المكرر
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setImportResult(null);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  إلغاء الملف
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={importResult.validRows.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  اعتماد وحفظ الطلاب ({importResult.validRows.length})
                </button>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">
                جدول المعاينة التفصيلي قبل إدراج البيانات في قاعدة البيانات:
              </span>
              <span className="text-[11px] text-slate-400">
                لن يتم حذف أي بيانات سابقة
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">رقم السطر</th>
                    <th className="py-2.5 px-4">اسم الطالب</th>
                    <th className="py-2.5 px-3">الصف المحدد</th>
                    <th className="py-2.5 px-3">الرقم المدرسي</th>
                    <th className="py-2.5 px-3">هاتف ولي الأمر</th>
                    <th className="py-2.5 px-3">حالة المطابقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Valid rows first */}
                  {importResult.validRows.map((row) => (
                    <tr key={row.rowNumber} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400 font-bold">{row.rowNumber}</td>
                      <td className="py-2 px-4 font-black text-slate-900">{row.fullName}</td>
                      <td className="py-2 px-3 font-bold text-blue-700">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50">
                          {row.matchedClassName || 'الصف غير محدد'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{row.schoolId}</td>
                      <td className="py-2 px-3 text-slate-600">{row.guardianPhone}</td>
                      <td className="py-2 px-3">
                        {row.isDuplicateInDb ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            طالب موجود مسبقاً
                          </span>
                        ) : row.isDuplicateInFile ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            مكرر في نفس الملف
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            جاهز للإضافة (جديد)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Invalid rows */}
                  {importResult.invalidRows.map((row) => (
                    <tr key={row.rowNumber} className="bg-rose-50/50 hover:bg-rose-50">
                      <td className="py-2 px-3 text-rose-500 font-bold">{row.rowNumber}</td>
                      <td className="py-2 px-4 font-bold text-rose-900">{row.fullName || 'اسم مفقود'}</td>
                      <td className="py-2 px-3 text-rose-700">{row.classIdentifier || 'غير محدد'}</td>
                      <td className="py-2 px-3 font-mono text-rose-700">{row.schoolId}</td>
                      <td className="py-2 px-3 text-rose-600">{row.guardianPhone}</td>
                      <td className="py-2 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          {row.validationErrors.join(' • ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
