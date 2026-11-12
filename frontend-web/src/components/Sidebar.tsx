import React from 'react';
import { Employee } from '../types';
import { 
  LayoutDashboard, 
  Camera, 
  ClipboardCheck, 
  School, 
  ShieldCheck, 
  Users, 
  Zap, 
  Briefcase, 
  LogOut, 
  X,
  ChevronRight,
  CheckCircle2,
  Bike
} from 'lucide-react';

interface SidebarProps {
  user: Employee | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: 'primary' | 'success' | 'amber';
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  onLogout
}) => {
  const operationsItems: NavItem[] = [
    { id: 'dashboard', label: 'Field Dashboard', icon: LayoutDashboard },
    { id: 'visit', label: 'School Check-In', icon: Camera, badge: 'Camera', badgeType: 'primary' },
    { id: 'audit', label: 'Dual-Photo Ledger', icon: ClipboardCheck },
    { id: 'bike-km', label: 'Bike & KM Audit (AI)', icon: Bike, badge: 'OCR AI', badgeType: 'primary' },
    { id: 'schools', label: 'Client Schools', icon: School },
  ];

  const managementItems: NavItem[] = [
    { id: 'superadmin', label: 'Super Admin Hub', icon: ShieldCheck, badge: 'Executive', badgeType: 'amber' },
    { id: 'roster', label: 'Sales Team Roster', icon: Users, badge: '5 Reps (Free)', badgeType: 'success' },
    { id: 'integrations', label: 'Zoho & Teams Sync', icon: Zap, badge: 'Live', badgeType: 'primary' },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const renderBadge = (badge?: string, type?: string) => {
    if (!badge) return null;
    let colorClass = 'bg-slate-100 text-slate-600';
    if (type === 'primary') colorClass = 'bg-sky-100 text-sky-700 border border-sky-200';
    if (type === 'success') colorClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (type === 'amber') colorClass = 'bg-amber-100 text-amber-800 border border-amber-200';

    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorClass}`}>
        {badge}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-2xl lg:shadow-none`}
      >
        {/* Top: Brand Header */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-900/50">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                  TECHNO SCHOOL
                </h1>
                <p className="text-[10px] text-sky-300 font-medium tracking-wide">
                  Field Sales & Zoho Sync
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden transition"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)] scrollbar-none">
            {/* Section 1: Field Operations */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Field Operations
              </p>
              <ul className="space-y-1">
                {operationsItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                          isActive
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          renderBadge(item.badge, item.badgeType)
                        ) : (
                          isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Section 2: Enterprise & Sync */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Enterprise & HRMS Sync
              </p>
              <ul className="space-y-1">
                {managementItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          renderBadge(item.badge, item.badgeType)
                        ) : (
                          isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>

        {/* Bottom Profile & Zoho Status Card */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-emerald-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user?.fullName || 'Representative'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span className="text-[10px] text-emerald-300 font-medium truncate">
                    Zoho Live Connected
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
