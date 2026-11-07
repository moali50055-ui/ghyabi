import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-right relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-blue-900/10 shrink-0 border border-slate-200">
            <img src="/assets/aistudio/image_8acdb664.png" alt="شعار مدرسة قتيبة بن مسلم" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">نظام الحضور والغياب - مدرسة قتيبة بن مسلم</h3>
            <p className="text-xs text-blue-700 font-bold mt-0.5">وزارة التعليم • محافظة جنوب الشرقية</p>
          </div>
        </div>

        {/* Benefits Badges */}
        <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-slate-50 rounded-2xl border border-slate-100 mb-5 text-center">
          <div className="flex flex-col items-center">
            <Zap className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-700">سريع وفوري</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-200 px-1">
            <Globe className="w-4 h-4 text-emerald-600 mb-1" />
            <span className="text-[10px] font-bold text-slate-700">يعمل دون إنترنت</span>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-4 h-4 text-blue-600 mb-1" />
            <span className="text-[10px] font-bold text-slate-700">قاعدة بيانات آمنة</span>
          </div>
        </div>

        {/* Content Flow */}
        {installSuccess ? (
          <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-black text-emerald-950">تم تثبيت التطبيق بنجاح!</h4>
            <p className="text-xs text-emerald-800">
              ستجد أيقونة «غياب مدرسة قتيبة» في الشاشة الرئيسية لهاتفك.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Direct 1-Click Install Button (Chromium / Android / Desktop) */}
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black shadow-lg shadow-blue-700/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                تثبيت التطبيق على الهاتف الآن (ضغطة واحدة)
              </button>
            )}

            {/* iOS Safari Guided Steps */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>خطوات التثبيت على أجهزة iPhone و iPad (متصفح Safari):</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pr-1 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-700">١.</span>
                  <span>اضغط على أيقونة <strong>المشاركة (Share)</strong> <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-1" /> في شريط أدوات Safari السفلي.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-700">٢.</span>
                  <span>مرر للأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen) <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-1" />.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-700">٣.</span>
                  <span>اضغط على <strong>«إضافة» (Add)</strong> في أعلى الزاوية ليظهر التطبيق في شاشة تطبيقاتك.</span>
                </li>
              </ol>
            </div>

            {/* Android Chrome Guided Steps */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>خطوات التثبيت على هواتف Android (متصفح Chrome):</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside pr-1 leading-relaxed">
                <li>اضغط على قائمة الخيارات (الثلاث نقاط الرأسية ⋮) أعلى أو أسفل المتصفح.</li>
                <li>اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                <li>وافق على التثبيت ليظهر التطبيق كأيقونة مستقلة فوراً.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>يعمل عبر بروتوكول HTTPS المشفر والآمن</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
