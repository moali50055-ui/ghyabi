import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  School,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Save,
  Lock,
} from 'lucide-react';
import { downloadBackupFile, restoreFromBackupFile } from '../../services/storage';

const SECURITY_PASSWORD = '72273188';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    classes,
    students,
    records,
    currentUser,
    resetToDemo,
    clearData,
    restoreData,
    addToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [clearPassword, setClearPassword] = useState('');
  const [clearError, setClearError] = useState('');

  const handleConfirmReset = () => {
    if (resetPassword.trim() !== SECURITY_PASSWORD) {
      setResetError('كلمة المرور غير صحيحة، يرجى إدخال كلمة المرور الصحيحة.');
      addToast('error', 'كلمة المرور غير صحيحة، تعذر استكمال إعادة التوليد.');
      return;
    }
    resetToDemo();
    setIsResetConfirmOpen(false);
    setResetPassword('');
    setResetError('');
    addToast('success', 'تمت إعادة توليد البيانات التجريبية بنجاح.');
  };

  const handleConfirmClear = () => {
    if (clearPassword.trim() !== SECURITY_PASSWORD) {
      setClearError('كلمة المرور غير صحيحة، يرجى إدخال كلمة المرور الصحيحة.');
      addToast('error', 'كلمة المرور غير صحيحة، تعذر استكمال تصفير البيانات.');
      return;
    }
    clearData();
    setIsClearConfirmOpen(false);
    setClearPassword('');
    setClearError('');
    addToast('success', 'تم تصفير البيانات بنجاح للبدء الفعلي النظيف.');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const handleDownloadBackup = () => {
    const state = {
      classes,
      students,
      records,
      batches: [],
      settings,
      users: [],
      currentUser,
      auditLogs: [],
    };
    downloadBackupFile(state as any);
    addToast('success', 'تم تنزيل ملف النسخة الاحتياطية بنجاح.');
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restoredState = await restoreFromBackupFile(file);
      restoreData(restoredState);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'فشلت استعادة النسخة الاحتياطية.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            إعدادات النظام والنسخ الاحتياطي
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تهيئة معلومات المدرسة الرسمية وإدارة قواعد البيانات والنسخ الاحتياطي الكامل
          </p>
        </div>
      </div>

      {/* School Information Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200 shrink-0">
              <img
                src="/assets/aistudio/image_8acdb664.png"
                alt="شعار المدرسة"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">نظام الحضور والغياب - بيانات المدرسة</h3>
              <p className="text-xs text-slate-500 font-medium">وزارة التعليم • محافظة جنوب الشرقية</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المدرسة *</label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الجهة المشرفة *</label>
              <input
                type="text"
                required
                value={formData.ministryName}
                onChange={(e) => setFormData({ ...formData, ministryName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المديرية العامة للتربية والتعليم</label>
              <input
                type="text"
                value={formData.directorate}
                onChange={(e) => setFormData({ ...formData, directorate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الولاية</label>
              <input
                type="text"
                value={formData.wilayat}
                onChange={(e) => setFormData({ ...formData, wilayat: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العام الدراسي</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">مدير المدرسة</label>
              <input
                type="text"
                value={formData.principalName}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">مساعد المدير لشؤون الطلاب</label>
              <input
                type="text"
                value={formData.assistantPrincipalName}
                onChange={(e) => setFormData({ ...formData, assistantPrincipalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ بيانات المدرسة
            </button>
          </div>
        </form>
      </div>

      {/* Backup and Database Tools */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Database className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-black text-slate-900">
            النسخ الاحتياطي واستعادة البيانات وحماية المعلومات
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Download Backup */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">تصدير نسخة احتياطية كاملة (JSON)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                تنزيل ملف يحتوي على كافة الـ ٢٩ صفاً والطلاب وسجلات الغياب للحصص الثماني وسجل التدقيق لحفظه في مكان آمن.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="mt-4 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              تنزيل ملف النسخة الاحتياطية الآن
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">استعادة نسخة احتياطية سابقة</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                استرجاع بيانات المدرسة بالكامل من ملف نسخة احتياطية سابق تم تنزيله من النظام.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreBackupFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                اختيار ملف النسخة الاحتياطية لاستعادتها
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone: Reset / Clear demo data */}
        <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-4">
          <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            إدارة البيانات التجريبية والبدء الفعلي بالمدرسة
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            تتيح هذه الخيارات إعادة توليد البيانات التجريبية لاختبار كافة خصائص التطبيق أو تصفير بيانات الطلاب وسجلات الغياب بالكامل للبدء الفعلي بالعام الدراسي الجديد مع بقاء الـ ٢٩ صفاً دراسياً.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                setResetPassword('');
                setResetError('');
                setIsResetConfirmOpen(true);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-blue-600" />
              إعادة توليد البيانات التجريبية (٢٩ صفاً + طلاب وغيابات)
            </button>

            <button
              onClick={() => {
                setClearPassword('');
                setClearError('');
                setIsClearConfirmOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              تصفير البيانات التجريبية للبدء الفعلي النظيف
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals with Password Protection */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 text-center">
              تأكيد إعادة توليد البيانات التجريبية
            </h3>
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              سيتم استبدال البيانات الحالية بالبيانات الافتراضية التجريبية (٢٩ صفاً دراسياً مع قوائم طلاب وسجلات غياب واقعية).
            </p>

            <div className="mt-4 text-right">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور الأمنية للمتابعة:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => {
                    setResetPassword(e.target.value);
                    if (resetError) setResetError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmReset();
                    }
                  }}
                  placeholder="أدخل كلمة المرور"
                  autoFocus
                  className={`w-full px-3 py-2.5 pl-9 rounded-xl border text-sm text-center font-mono tracking-widest ${
                    resetError ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {resetError && (
                <p className="text-xs text-rose-600 font-bold mt-1.5 text-center">
                  {resetError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  setResetPassword('');
                  setResetError('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                تأكيد إعادة التوليد
              </button>
            </div>
          </div>
        </div>
      )}

      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 text-center">
              تأكيد تصفير بيانات الطلاب وسجلات الغياب
            </h3>
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              سيتم مسح كافة أسماء الطلاب وسجلات الغياب للبدء الفعلي واستيراد ملفات المدرسة الحقيقية من Excel مع الإبقاء على الـ ٢٩ صفاً دراسياً.
            </p>

            <div className="mt-4 text-right">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور الأمنية للمتابعة:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={clearPassword}
                  onChange={(e) => {
                    setClearPassword(e.target.value);
                    if (clearError) setClearError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmClear();
                    }
                  }}
                  placeholder="أدخل كلمة المرور"
                  autoFocus
                  className={`w-full px-3 py-2.5 pl-9 rounded-xl border text-sm text-center font-mono tracking-widest ${
                    clearError ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-rose-500`}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {clearError && (
                <p className="text-xs text-rose-600 font-bold mt-1.5 text-center">
                  {clearError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => {
                  setIsClearConfirmOpen(false);
                  setClearPassword('');
                  setClearError('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                تأكيد التصفير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
