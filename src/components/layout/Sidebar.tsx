import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  School,
  Users,
  FileSpreadsheet,
  CheckSquare,
  Grid3X3,
  BarChart3,
  UserCog,
  Settings,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, classes, students, currentUser } = useApp();

  const totalStudents = students.filter((s) => !s.isArchived).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'classes',
      label: 'الصفوف الدراسية',
      icon: School,
      badge: `${classes.length} صفاً`,
    },
    {
      id: 'students',
      label: 'إدارة الطلاب',
      icon: Users,
      badge: `${totalStudents} طالباً`,
    },
    {
      id: 'excel',
      label: 'استيراد Excel',
      icon: FileSpreadsheet,
      badge: 'XLSX / XLS',
    },
    {
      id: 'attendance',
      label: 'تسجيل الغياب',
      icon: CheckSquare,
      badge: '٨ حصص',
      highlight: true,
    },
    {
      id: 'matrix',
      label: 'غياب الحصص الثماني',
      icon: Grid3X3,
      badge: 'شامل',
    },
    {
      id: 'reports',
      label: 'التقارير والإحصائيات',
      icon: BarChart3,
      badge: 'طباعة وتصدير',
    },
    {
      id: 'users',
      label: 'إدارة المستخدمين',
      icon: UserCog,
      badge: null,
      adminOnly: true,
    },
    {
      id: 'settings',
      label: 'الإعدادات والنسخ',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-40 w-72 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-l border-slate-800 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 px-4 sm:px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-blue-950/40 border border-slate-700 shrink-0">
              <img
                src="/assets/aistudio/image_8acdb664.png"
                alt="شعار مدرسة قتيبة بن مسلم"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-black text-white tracking-wide block truncate">
                نظام الحضور والغياب
              </span>
              <span className="text-[11px] text-blue-300 font-bold block truncate">
                مدرسة قتيبة بن مسلم
              </span>
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                وزارة التعليم • جنوب الشرقية
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            القائمة الرئيسية
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer group ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${item.highlight && !isActive ? 'border border-blue-500/30 bg-blue-950/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                      isActive
                        ? 'bg-blue-700/80 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info & current user summary */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs font-bold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentUser.role === 'admin'
                  ? 'مدير النظام (كامل الصلاحيات)'
                  : currentUser.role === 'management'
                  ? 'الإدارة المدرسية'
                  : 'معلم'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
