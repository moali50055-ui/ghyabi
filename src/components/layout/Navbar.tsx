import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronDown,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Menu,
  X,
  BookOpenCheck,
  Smartphone,
  ArrowRightLeft,
  Download,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenInstallModal: () => void;
  onOpenSyncModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onOpenInstallModal,
  onOpenSyncModal,
}) => {
  const { settings, currentUser, users, setCurrentUser, isOnline, setActiveTab } = useApp();
  const { isInstalled } = usePWAInstall();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Format today's date in formal Arabic
  const formattedDate = new Intl.DateTimeFormat('ar-OM', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'مدير النظام', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'management':
        return { label: 'الإدارة المدرسية', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'teacher':
        return { label: 'معلم', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: role, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const currentRoleInfo = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Left / Right Start: Brand & Mobile Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden"
              aria-label="القائمة الجانبية"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
              {/* School Logo */}
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm border border-slate-200 shrink-0 hover:shadow-md transition">
                <img
                  src="/assets/aistudio/image_8acdb664.png"
                  alt="شعار مدرسة قتيبة بن مسلم"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Title & Ministry Details */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    نظام الحضور والغياب
                  </h1>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                    مدرسة قتيبة بن مسلم
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wide line-clamp-1 mt-0.5">
                  {settings.ministryName} • {settings.directorate}
                </div>
              </div>
            </div>
          </div>

          {/* Center Info: Date & Online status */}
          <div className="hidden xl:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200/80 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{formattedDate}</span>
            </div>

            {/* Online Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>وضع محلي (دون إنترنت)</span>
                </>
              )}
            </div>
          </div>

          {/* Right Actions: Sync, Install PWA, Quick Record, User Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Sync PC <-> Phone Button */}
            <button
              onClick={onOpenSyncModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition cursor-pointer shadow-xs"
              title="مزامنة البيانات بين الكمبيوتر والهاتف"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">مزامنة الهاتف</span>
            </button>

            {/* In-App PWA Install Button */}
            {!isInstalled && (
              <button
                onClick={onOpenInstallModal}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black transition cursor-pointer shadow-xs animate-pulse"
                title="تثبيت التطبيق على الهاتف"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">تثبيت التطبيق</span>
                <span className="sm:hidden">تثبيت</span>
              </button>
            )}

            {/* Quick Action Button: "تسجيل غياب اليوم" */}
            <button
              onClick={() => setActiveTab('attendance')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-700/20 hover:shadow-lg transition cursor-pointer"
            >
              <BookOpenCheck className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل غياب اليوم</span>
              <span className="sm:hidden">رصد</span>
            </button>

            {/* Role & User Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition text-right cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${currentRoleInfo.color}`}>
                      {currentRoleInfo.label}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div
                  className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">المستخدم الحالي المسجل:</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{currentUser.name}</p>
                    <p className="text-xs text-slate-500">{currentUser.jobTitle || currentUser.email}</p>
                  </div>

                  <div className="py-2">
                    <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      تبديل الحساب لاختبار الصلاحيات:
                    </p>
                    {users.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      const badge = getRoleBadge(u.role);
                      return (
                        <button
                          key={u.id}
                          onClick={() => setCurrentUser(u)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right text-xs transition cursor-pointer ${
                            isSelected ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{u.jobTitle || u.email}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
