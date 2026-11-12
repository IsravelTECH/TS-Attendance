import React from 'react';
import { LayoutDashboard, Camera, ClipboardCheck, ShieldCheck } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab
}) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'visit', label: 'Check-In', icon: Camera, isPrimary: true },
    { id: 'audit', label: 'Audit', icon: ClipboardCheck },
    { id: 'superadmin', label: 'Admin', icon: ShieldCheck },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        if (item.isPrimary) {
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative -top-4 flex flex-col items-center focus:outline-none"
            >
              <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                isActive 
                  ? 'bg-sky-600 text-white shadow-sky-600/40' 
                  : 'bg-slate-900 text-white shadow-slate-900/30'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-sky-600' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
              isActive ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
