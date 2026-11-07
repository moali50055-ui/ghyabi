import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import {
  X,
  Phone,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ClipboardPaste,
  Edit3,
  Save,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { normalizeArabicText } from '../../services/excelService';

interface LinkParentPhonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassId?: string;
}

interface MatchCandidate {
  rawLine: string;
  extractedPhone: string;
  extractedQuery: string;
  matchedStudent?: Student;
  guardianName?: string;
  status: 'matched' | 'unmatched' | 'invalid_phone';
}

export const LinkParentPhonesModal: React.FC<LinkParentPhonesModalProps> = ({
  isOpen,
  onClose,
  defaultClassId,
}) => {
  const { students, classes, updateStudent, bulkUpdateParentPhones } = useApp();

  const [activeTab, setActiveTab] = useState<'table' | 'paste' | 'file'>('table');
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId || 'all');
  const [onlyMissingPhone, setOnlyMissingPhone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Local draft for quick table edits: { [studentId]: { phone: string, guardianName: string, changed: boolean } }
  const [draftPhones, setDraftPhones] = useState<Record<string, { phone: string; guardianName: string; changed: boolean }>>({});

  // Tab 2: Paste mode state
  const [pasteText, setPasteText] = useState('');
  const [parsedCandidates, setParsedCandidates] = useState<MatchCandidate[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  // Tab 3: File import state
  const [importFileName, setImportFileName] = useState<string>('');
  const [importPreview, setImportPreview] = useState<MatchCandidate[]>([]);

  // Statistics
  const activeStudents = useMemo(() => students.filter((s) => !s.isArchived), [students]);
  const linkedCount = useMemo(
    () => activeStudents.filter((s) => s.guardianPhone && s.guardianPhone.trim().length >= 8).length,
    [activeStudents]
  );
  const missingCount = activeStudents.length - linkedCount;
  const percentage = activeStudents.length ? Math.round((linkedCount / activeStudents.length) * 100) : 0;

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

  // Filtered students for Tab 1
  const filteredStudents = useMemo(() => {
    return activeStudents.filter((s) => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      const hasPhone = Boolean(s.guardianPhone && s.guardianPhone.trim().length >= 8);
      const matchMissing = onlyMissingPhone ? !hasPhone : true;
      const matchSearch =
        searchQuery === '' ||
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.schoolId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.guardianPhone && s.guardianPhone.includes(searchQuery));

      return matchClass && matchMissing && matchSearch;
    });
  }, [activeStudents, selectedClassId, onlyMissingPhone, searchQuery]);

  if (!isOpen) return null;

  // Clean Omani phone number string
  const cleanPhone = (val: string): string => {
    let p = val
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/[^0-9+]/g, '');
    if (p.startsWith('+968')) p = p.substring(4);
    if (p.startsWith('00968')) p = p.substring(5);
    if (p.startsWith('968') && p.length > 8) p = p.substring(3);
    return p.trim();
  };

  const handlePhoneInputChange = (studentId: string, phoneVal: string, guardianNameVal?: string) => {
    const student = students.find((s) => s.id === studentId);
    setDraftPhones((prev) => ({
      ...prev,
      [studentId]: {
        phone: phoneVal,
        guardianName: guardianNameVal !== undefined ? guardianNameVal : (prev[studentId]?.guardianName ?? student?.guardianName ?? ''),
        changed: true,
      },
    }));
  };

  const handleSaveSingleRow = (studentId: string) => {
    const draft = draftPhones[studentId];
    if (!draft) return;
    updateStudent(studentId, {
      guardianPhone: draft.phone.trim(),
      guardianName: draft.guardianName.trim() || undefined,
    });
    setDraftPhones((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleSaveAllTableChanges = () => {
    const updates: { studentId: string; phone: string; guardianName?: string }[] = [];
    Object.entries(draftPhones).forEach(([studentId, data]) => {
      if (data.changed && data.phone.trim()) {
        updates.push({
          studentId,
          phone: data.phone.trim(),
          guardianName: data.guardianName.trim() || undefined,
        });
      }
    });

    if (updates.length > 0) {
      bulkUpdateParentPhones(updates);
      setDraftPhones({});
    }
  };

  // Smart Parser for Pasted Text
  const handleParsePastedText = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const candidates: MatchCandidate[] = [];

    lines.forEach((line) => {
      // Look for 8-digit sequences (with optional +968 or 968)
      // Supports separators like comma, tab, dash, colon, spaces
      const tokens = line.split(/[,\t;|]+/).map((t) => t.trim());
      let phoneCandidate = '';
      let textCandidate = '';

      if (tokens.length >= 2) {
        // Test each token to find the one that looks like a phone
        for (let i = 0; i < tokens.length; i++) {
          const cleaned = cleanPhone(tokens[i]);
          if (/^[792]\d{7}$/.test(cleaned) || /^\d{8}$/.test(cleaned)) {
            phoneCandidate = cleaned;
            const otherTokens = tokens.filter((_, idx) => idx !== i);
            textCandidate = otherTokens.join(' ');
            break;
          }
        }
      }

      // If not split by delimiters, use regex to find phone number inside string
      if (!phoneCandidate) {
        const phoneMatch = line.match(/(?:\+?968)?\s*([792]\d{7}|\d{8})/);
        if (phoneMatch) {
          phoneCandidate = cleanPhone(phoneMatch[1]);
          textCandidate = line.replace(phoneMatch[0], '').replace(/[,\-:]+/g, ' ').trim();
        }
      }

      if (!phoneCandidate) {
        candidates.push({
          rawLine: line,
          extractedPhone: '',
          extractedQuery: line,
          status: 'invalid_phone',
        });
        return;
      }

      // Now match textCandidate with students
      const normQuery = normalizeArabicText(textCandidate).toLowerCase();
      let matched = activeStudents.find((s) => s.schoolId.trim() === textCandidate.trim());

      if (!matched && normQuery) {
        matched = activeStudents.find((s) => {
          const normName = normalizeArabicText(s.fullName).toLowerCase();
          return normName === normQuery || normName.includes(normQuery) || normQuery.includes(normName);
        });
      }

      candidates.push({
        rawLine: line,
        extractedPhone: phoneCandidate,
        extractedQuery: textCandidate || 'غير محدد',
        matchedStudent: matched,
        status: matched ? 'matched' : 'unmatched',
      });
    });

    setParsedCandidates(candidates);
    setHasParsed(true);
  };

  const handleApplyPastedMatches = () => {
    const validMatches = parsedCandidates.filter(
      (c) => c.status === 'matched' && c.matchedStudent && c.extractedPhone
    );

    if (validMatches.length === 0) return;

    const updates = validMatches.map((c) => ({
      studentId: c.matchedStudent!.id,
      phone: c.extractedPhone,
    }));

    bulkUpdateParentPhones(updates);
    setPasteText('');
    setParsedCandidates([]);
    setHasParsed(false);
  };

  // Handle Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (data.length < 2) return;

        // Find columns for name, id, phone
        const headerRow = (data[0] || []).map((h: any) => String(h || '').trim());
        let phoneIdx = -1;
        let nameIdx = -1;
        let idIdx = -1;

        headerRow.forEach((colName, idx) => {
          const col = colName.toLowerCase();
          if (col.includes('هاتف') || col.includes('جوال') || col.includes('phone') || col.includes('موبايل') || col.includes('ولي')) {
            phoneIdx = idx;
          } else if (col.includes('اسم') || col.includes('طالب') || col.includes('name')) {
            nameIdx = idx;
          } else if (col.includes('رقم') || col.includes('مدني') || col.includes('id') || col.includes('قيد')) {
            idIdx = idx;
          }
        });

        // Fallbacks if not detected
        if (phoneIdx === -1 && headerRow.length >= 2) phoneIdx = headerRow.length - 1;
        if (nameIdx === -1) nameIdx = 0;

        const candidates: MatchCandidate[] = [];

        for (let r = 1; r < data.length; r++) {
          const row = data[r];
          if (!row || row.length === 0) continue;

          const rawPhone = row[phoneIdx] !== undefined ? String(row[phoneIdx]) : '';
          const rawName = nameIdx !== -1 && row[nameIdx] !== undefined ? String(row[nameIdx]) : '';
          const rawId = idIdx !== -1 && row[idIdx] !== undefined ? String(row[idIdx]) : '';

          const phone = cleanPhone(rawPhone);
          const query = rawId || rawName;

          if (!phone || phone.length < 8) continue;

          let matched = activeStudents.find((s) => rawId && s.schoolId.trim() === rawId.trim());
          if (!matched && rawName) {
            const normName = normalizeArabicText(rawName).toLowerCase();
            matched = activeStudents.find((s) => {
              const sNorm = normalizeArabicText(s.fullName).toLowerCase();
              return sNorm === normName || sNorm.includes(normName) || normName.includes(sNorm);
            });
          }

          candidates.push({
            rawLine: `${rawName} | ${rawId} | ${rawPhone}`,
            extractedPhone: phone,
            extractedQuery: query,
            matchedStudent: matched,
            status: matched ? 'matched' : 'unmatched',
          });
        }

        setImportPreview(candidates);
      } catch (err) {
        console.error('Failed to parse excel file', err);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleApplyFileMatches = () => {
    const validMatches = importPreview.filter(
      (c) => c.status === 'matched' && c.matchedStudent && c.extractedPhone
    );

    if (validMatches.length === 0) return;

    const updates = validMatches.map((c) => ({
      studentId: c.matchedStudent!.id,
      phone: c.extractedPhone,
    }));

    bulkUpdateParentPhones(updates);
    setImportPreview([]);
    setImportFileName('');
  };

  const pendingTableChangesCount = Object.values(draftPhones).filter((d) => d.changed).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Phone className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                ربط أرقام تليفونات أولياء الأمور بالطلاب
              </h2>
              <p className="text-xs text-blue-100">
                إدارة وربط هواتف أولياء الأمور بسهولة لإرسال إشعارات الغياب عبر الرسائل والواتساب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Stat Cards Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 block text-[11px]">إجمالي الطلاب النشطين</span>
            <span className="text-base font-black text-slate-800">{activeStudents.length}</span>
          </div>

          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-emerald-700 block text-[11px] font-bold">أرقام هواتف مسجلة</span>
            <span className="text-base font-black text-emerald-800">{linkedCount} ولي أمر</span>
          </div>

          <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-amber-700 block text-[11px] font-bold">بدون هاتف (بحاجة للربط)</span>
            <span className="text-base font-black text-amber-800">{missingCount} طالب</span>
          </div>

          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-800 mb-1">
              <span>نسبة الاكتمال</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-blue-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'table'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              الربط السريع بالجدول
              {pendingTableChangesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px]">
                  {pendingTableChangesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              الربط الذكي باللصق دفعة واحدة
            </button>

            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'file'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              استيراد ملف Excel / CSV
            </button>
          </div>
        </div>

        {/* Tab 1: Live Interactive Table */}
        {activeTab === 'table' && (
          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">جميع الصفوف ({classes.length} صف)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={onlyMissingPhone}
                    onChange={(e) => setOnlyMissingPhone(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>غير المسجلين فقط ({missingCount})</span>
                </label>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم الطالب أو الرقم المدرسي..."
                  className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">م</th>
                    <th className="py-2.5 px-3">اسم الطالب رباعي</th>
                    <th className="py-2.5 px-2">الصف</th>
                    <th className="py-2.5 px-3">الرقم المدرسي</th>
                    <th className="py-2.5 px-3">رقم هاتف ولي الأمر (عُمان)</th>
                    <th className="py-2.5 px-2">واتساب</th>
                    <th className="py-2.5 px-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        لا توجد نتائج مطابقة للتصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const currentVal = draftPhones[student.id]?.phone ?? student.guardianPhone ?? '';
                      const isDraft = draftPhones[student.id]?.changed;
                      const hasPhone = currentVal.trim().length >= 8;

                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50 transition ${
                            isDraft ? 'bg-amber-50/40' : !hasPhone ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3 font-black text-slate-900">
                            {student.fullName}
                          </td>
                          <td className="py-2 px-2 font-bold text-blue-700">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[11px]">
                              {classMap.get(student.classId) || student.classId}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500">{student.schoolId}</td>
                          <td className="py-2 px-3">
                            <div className="relative max-w-[190px]">
                              <input
                                type="text"
                                dir="ltr"
                                value={currentVal}
                                onChange={(e) => handlePhoneInputChange(student.id, e.target.value)}
                                placeholder="9XXXXXXX"
                                className={`w-full px-2.5 py-1 rounded-lg border text-xs font-mono text-center font-bold transition focus:outline-hidden ${
                                  isDraft
                                    ? 'border-amber-400 bg-amber-50/70 focus:border-amber-500'
                                    : hasPhone
                                    ? 'border-emerald-200 bg-emerald-50/30 focus:border-blue-500'
                                    : 'border-slate-300 bg-slate-50 focus:border-blue-500'
                                }`}
                              />
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            {hasPhone ? (
                              <a
                                href={`https://wa.me/968${cleanPhone(currentVal)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                                title="مراسلة ولي الأمر عبر واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isDraft ? (
                              <button
                                onClick={() => handleSaveSingleRow(student.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer flex items-center gap-1 mx-auto"
                              >
                                <Save className="w-3 h-3" />
                                حفظ
                              </button>
                            ) : hasPhone ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                <Check className="w-3 h-3" /> مربوط
                              </span>
                            ) : (
                              <span className="text-[11px] text-rose-500 font-bold">مطلوب</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom bar for saving all changes */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                ملاحظة: تدعم هواتف عُمان الأرقام المكونة من ٨ أرقام تبدأ بـ ٩ أو ٧ أو ٢.
              </span>

              {pendingTableChangesCount > 0 && (
                <button
                  onClick={handleSaveAllTableChanges}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ كافة التغييرات ({pendingTableChangesCount} تعديل)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Smart Paste Parser */}
        {activeTab === 'paste' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-800">
                <Sparkles className="w-4 h-4 text-blue-600" />
                طريقة الربط الذكي باللصق:
              </div>
              <p>
                يمكنك نسخ قائمة أسماء الطلاب أو أرقامهم المدرسية مع أرقام هواتف أولياء أمورهم من أي ملف أو محادثة
                واتساب، ولصقها في المربع أدناه. وسيقوم النظام بمطابقة الطلاب تلقائياً وربط أرقامهم.
              </p>
              <div className="font-mono bg-white p-2 rounded-lg border border-blue-100 text-[11px] text-slate-600 leading-relaxed">
                محمد أحمد الكندي 91234567<br />
                2024101 , 92345678<br />
                سعيد بن ناصر الهاشمي	98765432
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                الصق القائمة هنا (كل طالب ورقم هاتفه في سطر مستقل):
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="الصق النص هنا..."
                rows={6}
                className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs focus:outline-hidden focus:border-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleParsePastedText}
                disabled={!pasteText.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                تحليل ومطابقة الطلاب
              </button>

              {hasParsed && (
                <button
                  onClick={() => {
                    setPasteText('');
                    setParsedCandidates([]);
                    setHasParsed(false);
                  }}
                  className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> مسح النتائج
                </button>
              )}
            </div>

            {/* Candidates Preview */}
            {hasParsed && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800">
                    معاينة نتائج المطابقة ({parsedCandidates.filter((c) => c.status === 'matched').length} مطابق من أصل{' '}
                    {parsedCandidates.length})
                  </h3>

                  {parsedCandidates.some((c) => c.status === 'matched') && (
                    <button
                      onClick={handleApplyPastedMatches}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      تأكيد وربط (
                      {parsedCandidates.filter((c) => c.status === 'matched').length}) أرقام هواتف
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">السطر الأصلي</th>
                        <th className="py-2 px-3">الطالب المطابق</th>
                        <th className="py-2 px-3">الصف</th>
                        <th className="py-2 px-3">رقم الهاتف المستخرج</th>
                        <th className="py-2 px-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedCandidates.map((c, idx) => (
                        <tr
                          key={idx}
                          className={
                            c.status === 'matched' ? 'bg-emerald-50/30' : 'bg-rose-50/30 text-rose-800'
                          }
                        >
                          <td className="py-2 px-3 font-mono text-[11px] truncate max-w-xs">{c.rawLine}</td>
                          <td className="py-2 px-3 font-bold">
                            {c.matchedStudent ? c.matchedStudent.fullName : c.extractedQuery}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-700">
                            {c.matchedStudent ? classMap.get(c.matchedStudent.classId) : '-'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{c.extractedPhone || '-'}</td>
                          <td className="py-2 px-3">
                            {c.status === 'matched' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> مطابق
                              </span>
                            ) : c.status === 'invalid_phone' ? (
                              <span className="text-rose-600 font-bold text-[11px]">رقم غير صالح</span>
                            ) : (
                              <span className="text-amber-600 font-bold text-[11px]">لم يتم العثور على الطالب</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: File Import */}
        {activeTab === 'file' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-800">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                استيراد ملف هواتف Excel أو CSV:
              </div>
              <p>
                قم برفع ملف Excel (XLSX أو XLS) أو CSV يحتوي على عمود لاسم الطالب أو الرقم المدرسي، وعمود لرقم هاتف
                ولي الأمر.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center transition bg-slate-50/50">
              <input
                type="file"
                id="phone-excel-upload"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="phone-excel-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-slate-800">اضغط لاختيار ملف Excel أو CSV</span>
                <span className="text-[11px] text-slate-400 mt-1">يدعم صيغ .xlsx و .xls و .csv</span>
              </label>

              {importFileName && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  <FileSpreadsheet className="w-4 h-4" />
                  {importFileName}
                </div>
              )}
            </div>

            {importPreview.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800">
                    تم استخراج {importPreview.length} سجل ({importPreview.filter((c) => c.status === 'matched').length} مطابق للطلاب)
                  </h3>

                  <button
                    onClick={handleApplyFileMatches}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    تأكيد وربط الأرقام المطابقة (
                    {importPreview.filter((c) => c.status === 'matched').length})
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">البيان في الملف</th>
                        <th className="py-2 px-3">الطالب المطابق</th>
                        <th className="py-2 px-3">الصف</th>
                        <th className="py-2 px-3">رقم الهاتف</th>
                        <th className="py-2 px-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreview.map((c, idx) => (
                        <tr
                          key={idx}
                          className={c.status === 'matched' ? 'bg-emerald-50/30' : 'bg-slate-50 text-slate-500'}
                        >
                          <td className="py-2 px-3 font-mono text-[11px]">{c.rawLine}</td>
                          <td className="py-2 px-3 font-bold">{c.matchedStudent?.fullName || c.extractedQuery}</td>
                          <td className="py-2 px-3 font-bold text-blue-700">
                            {c.matchedStudent ? classMap.get(c.matchedStudent.classId) : '-'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{c.extractedPhone}</td>
                          <td className="py-2 px-3">
                            {c.status === 'matched' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> جاهز للربط
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">غير مطابق</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>يتم تخزين بيانات الهواتف محلياً وبأمان داخل النظام المدرسي.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
