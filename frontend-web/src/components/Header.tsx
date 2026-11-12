import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { 
  Menu, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  ShieldCheck,
  Building2,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  user: Employee | null;
  onLogout: () => void;
  onSwitchUser: (email: string) => void;
  demoAccounts: any[];
  activeTab: string;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onSwitchUser,
  demoAccounts,
  activeTab,
  onToggleSidebar
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return { category: 'Field Operations', title: 'Field Sales Dashboard' };
      case 'visit':
        return { category: 'Field Operations', title: 'School Check-In (Live Photo Proof)' };
      case 'audit':
        return { category: 'Field Operations', title: 'Dual-Photo Visit Ledger' };
      case 'bike-km':
        return { category: 'Field Operations', title: 'Bike Plate & Odometer KM Analysis (AI OCR)' };
      case 'schools':
        return { category: 'Field Operations', title: 'Client Schools Directory' };
      case 'superadmin':
        return { category: 'Enterprise HRMS', title: 'Super Admin Command Hub' };
      case 'roster':
        return { category: 'Enterprise HRMS', title: 'Sales Team Roster (5 Reps - Free Tier)' };
      case 'integrations':
        return { category: 'Enterprise HRMS', title: 'Zoho People & Teams Live Sync' };
      default:
        return { category: 'Field Operations', title: 'Techno School Platform' };
    }
  };

  const pageInfo = getPageTitle(activeTab);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Page Title Breadcrumb */}
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs & Section Title */}
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            <span>{pageInfo.category}</span>
            <span>/</span>
            <span className="text-sky-600 font-bold">{activeTab}</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
            {pageInfo.title}
          </h2>
        </div>
      </div>

      {/* Right: Live Sync Indicators & Rep Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Zoho Live Status Pill (Hidden on smallest mobile) */}
        <div className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zoho Live</span>
        </div>

        {/* MS Teams Status Pill (Hidden on mobile) */}
        <div className="hidden xl:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          <span>Teams Ready</span>
        </div>

        {/* Live Clock Display */}
        <div className="hidden sm:flex items-center space-x-1 text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-mono font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        {/* Active Representative Switcher */}
        <div className="flex items-center bg-slate-50 hover:bg-slate-100/80 transition rounded-xl border border-slate-200 px-2 sm:px-2.5 py-1.5 text-xs">
          <RefreshCw className="w-3 h-3 text-sky-600 mr-1.5 shrink-0" />
          <span className="hidden sm:inline text-slate-500 font-medium mr-1.5">Rep:</span>
          <select
            className="bg-transparent border-0 font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
            value={user?.email || ''}
            onChange={(e) => onSwitchUser(e.target.value)}
          >
            {demoAccounts.map((acc) => (
              <option key={acc.email} value={acc.email}>
                {acc.fullName} ({acc.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
