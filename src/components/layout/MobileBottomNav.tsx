import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CheckSquare,
  School,
  Users,
  Smartphone,
  ArrowRightLeft,
  Download,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface MobileBottomNavProps {
  onOpenInstallModal: () => void;
  onOpenSyncModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenInstallModal,
  onOpenSyncModal,
}) => {
  const { activeTab, setActiveTab } = useApp();
  const { isInstalled } = usePWAInstall();

  const navItems = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: LayoutDashboard,
    },
    {
      id: 'attendance',
      label: 'رصد الغياب',
      icon: CheckSquare,
      highlight: true,
    },
    {
      id: 'classes',
      label: 'الصفوف',
      icon: School,
    },
    {
      id: 'students',
      label: 'الطلاب',
      icon: Users,
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl safe-area-pb">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-blue-600/30'
                    : 'bg-gradient-to-tr from-blue-700 to-indigo-800 text-white shadow-blue-800/25'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black mt-1 ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 cursor-pointer transition ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* 5th Button: Quick PWA install or Sync modal */}
        {!isInstalled ? (
          <button
            onClick={onOpenInstallModal}
            className="flex flex-col items-center justify-center py-1 text-emerald-600 hover:text-emerald-700 cursor-pointer font-bold animate-pulse"
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">تثبيت التطبيق</span>
          </button>
        ) : (
          <button
            onClick={onOpenSyncModal}
            className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-blue-600 cursor-pointer"
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">مزامنة</span>
          </button>
        )}
      </div>
    </div>
  );
};
