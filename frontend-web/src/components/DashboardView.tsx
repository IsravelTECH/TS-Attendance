import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Employee, FieldSummaryMetrics } from '../types';
import { Users, CheckCircle2, Clock, MapPin, ArrowUpRight, Camera, ShieldCheck, School } from 'lucide-react';

interface DashboardViewProps {
  user: Employee;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate }) => {
  const [metrics, setMetrics] = useState<FieldSummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getVisitsSummary();
      setMetrics(res.metrics);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-3 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GPS Geofenced • Mandatory Dual-Photo Verification Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user.fullName}!
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Techno School Field Operations Console. Tracking educational sales reps, client school meetings, gate arrival photos, and departure signed sheets.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center md:text-right min-w-[200px]">
            <p className="text-xs text-sky-200 uppercase tracking-wider font-semibold">{todayDateString}</p>
            <p className="text-3xl font-mono font-bold tracking-tight mt-1">{currentTime}</p>
            <p className="text-xs text-emerald-300 mt-1 flex items-center justify-center md:justify-end gap-1">
              <MapPin className="w-3 h-3" /> Territory: {user.territory}
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Visits Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Visits Today</span>
            <School className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800">
            {loading ? '...' : metrics?.totalVisitsToday || 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Logged school touchpoints</p>
        </div>

        {/* Currently in Meeting */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Meeting Right Now</span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600">
            {loading ? '...' : metrics?.currentlyInMeeting || 0}
          </p>
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" /> Checked-in at client schools
          </p>
        </div>

        {/* Completed Visits */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Visits</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
            {loading ? '...' : metrics?.completedVisits || 0}
          </p>
          <p className="text-xs text-emerald-600 mt-1">Both photos & notes logged</p>
        </div>

        {/* Active Field Sales Reps */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-indigo-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Field Executives</span>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-700">
            {loading ? '...' : `${metrics?.activeFieldExecutives || 0} / ${metrics?.totalFieldSalesForce || 0}`}
          </p>
          <p className="text-xs text-indigo-400 mt-1">Reps active on ground today</p>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action 1: Self Check-In with Photo */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold mb-3">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800">School Arrival Check-In (Photo Proof)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select client school, verify GPS distance, snap gate arrival photo, and log your visit start.
            </p>
          </div>
          <button
            onClick={() => onNavigate('visit')}
            className="mt-4 inline-flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
          >
            <span>Start School Visit</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action 2: Dual-Photo Audit Ledger */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              📸
            </div>
            <h3 className="text-base font-bold text-slate-800">Dual-Photo Audit Inspector</h3>
            <p className="text-xs text-slate-500 mt-1">
              Inspect side-by-side Arrival Gate Photo and Departure Meeting Photo with GPS timestamps across all sales reps.
            </p>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="mt-4 inline-flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
          >
            <span>Review Photo Ledger</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action 3: Client Schools Directory */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
              🏫
            </div>
            <h3 className="text-base font-bold text-slate-800">Client Schools Directory</h3>
            <p className="text-xs text-slate-500 mt-1">
              View mapped client schools, principals, contact numbers, and GPS geofence radiuses.
            </p>
          </div>
          <button
            onClick={() => onNavigate('schools')}
            className="mt-4 inline-flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
          >
            <span>Manage Client Schools</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
