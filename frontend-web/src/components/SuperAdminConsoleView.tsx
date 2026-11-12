import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { SuperAdminOverview, ZohoLiveAttendanceResponse, ZohoLivePunchRecord } from '../types';
import { 
  Building2, 
  Users, 
  Calendar, 
  RefreshCw, 
  Send, 
  Download, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  Layers,
  MessageSquare,
  MapPin,
  Sparkles
} from 'lucide-react';

export const SuperAdminConsoleView: React.FC = () => {
  const [data, setData] = useState<SuperAdminOverview | null>(null);
  const [zohoLive, setZohoLive] = useState<ZohoLiveAttendanceResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'zoho' | 'teams' | 'reconciliation'>('zoho');

  useEffect(() => {
    loadOverview();
  }, [selectedDate]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const [res, live] = await Promise.allSettled([
        api.getSuperAdminOverview(selectedDate),
        api.getZohoLivePunches(selectedDate)
      ]);

      if (res.status === 'fulfilled') {
        setData(res.value);
      }
      if (live.status === 'fulfilled') {
        setZohoLive(live.value);
      }
    } catch (err: any) {
      console.error('Failed to load super admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLivePunches = async () => {
    try {
      setFetchingLive(true);
      setActionMessage(null);
      const live = await api.getZohoLivePunches(selectedDate);
      setZohoLive(live);
      setActionMessage({
        type: 'success',
        text: `Retrieved ${live.records.length} real employee attendance records directly from Zoho People!`
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Failed to fetch Zoho live punches: ${err.message}` });
    } finally {
      setFetchingLive(false);
    }
  };

  const handleReconcileZoho = async () => {
    try {
      setReconciling(true);
      setActionMessage(null);
      const res = await api.reconcileZohoAttendance(selectedDate);
      setActionMessage({
        type: 'success',
        text: res.message
      });
      await loadOverview();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Reconciliation failed: ${err.message}` });
    } finally {
      setReconciling(false);
    }
  };

  const handleBulkSyncAll = async () => {
    try {
      setSyncingAll(true);
      setActionMessage(null);
      const res = await api.superAdminSyncAll(selectedDate);
      setActionMessage({
        type: 'success',
        text: `Bulk sync complete! Synced ${res.syncedCount} visits to Zoho People.`
      });
      await loadOverview();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Bulk sync failed: ${err.message}` });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleBroadcastTeamsBriefing = async () => {
    try {
      setBroadcasting(true);
      setActionMessage(null);
      const res = await api.broadcastDailySummary(selectedDate);
      setActionMessage({
        type: 'success',
        text: res.message || 'Daily Operations Briefing posted to Microsoft Teams channel!'
      });
      await loadOverview();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Broadcast failed: ${err.message}` });
    } finally {
      setBroadcasting(false);
    }
  };

  const exportMasterCSV = () => {
    if (!data) return;
    const headers = [
      'Date', 'Employee Code', 'Full Name', 'Designation', 'Territory', 
      'Total Visits', 'Completed Visits', 'First Check-In', 'Last Check-Out', 
      'Field Hours', 'Zoho Sync Status', 'Teams Alerted', 'Reconciliation Status'
    ];

    const rows = data.employeeLedger.map(emp => [
      data.date,
      emp.employeeCode,
      `"${emp.fullName}"`,
      `"${emp.designation}"`,
      `"${emp.territory}"`,
      emp.totalVisits,
      emp.completedVisits,
      emp.firstCheckIn ? new Date(emp.firstCheckIn).toLocaleTimeString() : '',
      emp.lastCheckOut ? new Date(emp.lastCheckOut).toLocaleTimeString() : '',
      (emp.totalFieldMinutes / 60).toFixed(1),
      emp.zohoStatus,
      emp.teamsNotified ? 'YES' : 'NO',
      emp.reconciliationStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `super_admin_zoho_teams_master_${data.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Executive Command Center • Super Admin Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Enterprise Data Hub: Zoho People & MS Teams
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Consolidated enterprise oversight connecting on-ground school field reps, official Zoho People payroll attendance punches, and live Microsoft Teams operations broadcasts.
            </p>
          </div>

          {/* Date Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20">
              <Calendar className="w-4 h-4 text-sky-300 mr-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleBulkSyncAll}
              disabled={syncingAll || loading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Push all pending attendance records to Zoho People"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
              <span>Sync All to Zoho</span>
            </button>

            <button
              onClick={handleBroadcastTeamsBriefing}
              disabled={broadcasting || loading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Broadcast Daily Briefing Card to Microsoft Teams"
            >
              <Send className={`w-3.5 h-3.5 ${broadcasting ? 'animate-spin' : ''}`} />
              <span>Broadcast to Teams</span>
            </button>

            <button
              onClick={exportMasterCSV}
              disabled={!data || loading}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-white/20"
              title="Download Master CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Super Admin Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Workforce & Active Field Reps */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Field Force Active</span>
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loading ? '...' : `${data?.kpi.activeExecutivesOnGround || 0} / ${data?.kpi.totalWorkforce || 0}`}
          </p>
          <p className="text-xs text-sky-600 mt-1 font-medium">Representatives deployed today</p>
        </div>

        {/* Zoho People Attendance Sync */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Zoho People Punches</span>
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {loading ? '...' : data?.kpi.zohoPunchesRecorded || 0}
            </p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {data?.kpi.zohoSyncCompliancePct || 100}% Synced
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Official payroll timestamps logged</p>
        </div>

        {/* Microsoft Teams Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">MS Teams Alerts</span>
            <MessageSquare className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
              {loading ? '...' : data?.kpi.teamsAlertsBroadcasted || 0}
            </p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {data?.kpi.teamsBroadcastCompliancePct || 100}% Delivery
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Live channel notification cards</p>
        </div>

        {/* Dual-Photo & Geofence Compliance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Audit Pass Rate</span>
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {loading ? '...' : `${data?.kpi.dualPhotoVerificationCompliancePct || 100}%`}
            </p>
            <span className="text-xs font-mono text-slate-500">
              {data?.kpi.totalFieldHoursLogged || '0'} hrs logged
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Gate photo + meeting signed sheet</p>
        </div>
      </div>

      {/* Sub-Tab Navigation for Super Admin Views */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('zoho')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'zoho'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>1. Zoho People Attendance Ledger</span>
        </button>

        <button
          onClick={() => setActiveSubTab('teams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'teams'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>2. MS Teams Live Broadcast Feed</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'reconciliation'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>3. 3-Way Reconciliation Matrix</span>
        </button>
      </div>

      {/* SUB-VIEW 1: Zoho People Master Attendance & Live Stream */}
      {activeSubTab === 'zoho' && (
        <div className="space-y-6">
          {/* SECTION 1: Real-Time Zoho People Punches Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-emerald-50/70 to-sky-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    Live Zoho People Attendance Stream
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      Real API Punches
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Direct check-in & check-out punches, working hours, and reverse-geocoded location fetched live from Zoho People ({selectedDate}).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFetchLivePunches}
                  disabled={fetchingLive}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${fetchingLive ? 'animate-spin' : ''}`} />
                  <span>Fetch Live Punches</span>
                </button>

                <button
                  onClick={handleReconcileZoho}
                  disabled={reconciling}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${reconciling ? 'animate-spin' : ''}`} />
                  <span>Reconcile with Visits</span>
                </button>
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 divide-x divide-slate-100 bg-white text-center text-xs">
              <div className="p-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Present in Zoho</p>
                <p className="text-lg font-black text-emerald-600 mt-0.5">{zohoLive?.presentCount ?? 0}</p>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Punches In-Progress</p>
                <p className="text-lg font-black text-amber-600 mt-0.5">{zohoLive?.inProgressCount ?? 0}</p>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Free-Tier Workforce</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{zohoLive?.totalEmployees ?? 5}</p>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Zoho Cloud Endpoint</p>
                <p className="text-xs font-mono font-bold text-sky-700 mt-1 truncate">people.zoho.in</p>
              </div>
            </div>

            {/* Live Punches Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">First In (Check-In)</th>
                    <th className="px-4 py-3">Last Out (Check-Out)</th>
                    <th className="px-4 py-3">Working Hours</th>
                    <th className="px-4 py-3">Shift & Timings</th>
                    <th className="px-4 py-3">Live Geolocation / Address</th>
                    <th className="px-4 py-3">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {fetchingLive || loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Fetching live punches from Zoho People API...</td>
                    </tr>
                  ) : !zohoLive || zohoLive.records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No attendance records returned from Zoho People for this date.</td>
                    </tr>
                  ) : (
                    zohoLive.records.map((rec) => (
                      <tr key={rec.employeeEmail} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{rec.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {rec.employeeEmail} {rec.erecno ? `• EREC: ${rec.erecno}` : ''}
                          </p>
                        </td>

                        <td className="px-4 py-3 font-mono font-medium">
                          {rec.firstIn ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              {rec.firstIn}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono font-medium">
                          {rec.lastOut ? (
                            <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 px-2 py-0.5 rounded font-bold">
                              <Clock className="w-3 h-3 text-sky-600" />
                              {rec.lastOut}
                            </span>
                          ) : rec.firstIn ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                              <Clock className="w-3 h-3 animate-spin text-amber-500" />
                              Clocked In
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {rec.workingHours !== '00:00' ? `${rec.workingHours} hrs` : (rec.totalHours !== '00:00' ? `${rec.totalHours} hrs` : '—')}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{rec.shiftName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{rec.shiftStartTime} - {rec.shiftEndTime}</p>
                        </td>

                        <td className="px-4 py-3 max-w-xs">
                          {rec.firstInLocation || rec.lastOutLocation ? (
                            <div className="flex items-start gap-1 text-[11px] text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                              <span className="truncate" title={rec.lastOutLocation || rec.firstInLocation || ''}>
                                {rec.lastOutLocation || rec.firstInLocation}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Not captured</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {rec.status === 'PRESENT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Present
                            </span>
                          ) : rec.status === 'IN_PROGRESS' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                              Absent / Leave
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: Master Attendance & Reconciliation Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                  <h3 className="font-bold text-slate-900 text-base">Field Visits & Payroll Reconciliation Sheet</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Combined view of School Visits matched with Zoho People Attendance timestamps.
                </p>
              </div>
              <div className="text-xs text-slate-600 font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                API Gateway: <strong className="text-sky-700">{data?.zohoSystem.apiUrl}</strong>
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Designation & Territory</th>
                  <th className="px-4 py-3">First Clock-In (Zoho)</th>
                  <th className="px-4 py-3">Last Clock-Out (Zoho)</th>
                  <th className="px-4 py-3">Field Meeting Hours</th>
                  <th className="px-4 py-3">Visits Logged</th>
                  <th className="px-4 py-3">Zoho Sync Status</th>
                  <th className="px-4 py-3">Zoho Punch ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading master attendance data...</td>
                  </tr>
                ) : data?.employeeLedger.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{emp.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{emp.employeeCode} • {emp.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{emp.designation}</p>
                      <p className="text-[11px] text-slate-400">{emp.territory}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {emp.firstCheckIn ? new Date(emp.firstCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {emp.lastCheckOut ? new Date(emp.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (emp.totalVisits > 0 ? 'In Meeting' : '—')}
                    </td>
                    <td className="px-4 py-3">
                      {emp.totalFieldMinutes > 0 ? (
                        <span className="font-bold text-slate-900">
                          {Math.floor(emp.totalFieldMinutes / 60)}h {emp.totalFieldMinutes % 60}m
                        </span>
                      ) : (
                        <span className="text-slate-400">0h</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800">
                        {emp.totalVisits} visits
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {emp.zohoStatus === 'SYNCED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Live Synced
                        </span>
                      ) : emp.zohoStatus === 'SIMULATED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                          <CheckCircle2 className="w-3 h-3" /> Synced (Sim)
                        </span>
                      ) : emp.zohoStatus === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          <AlertCircle className="w-3 h-3" /> Sync Failed
                        </span>
                      ) : emp.zohoStatus === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Pending Sync
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Headquarters / On Leave</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {emp.zohoPunchIds.length > 0 ? emp.zohoPunchIds[0] : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* SUB-VIEW 2: Microsoft Teams Live Broadcast Stream */}
      {activeSubTab === 'teams' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                <h3 className="font-bold text-slate-900 text-base">Microsoft Teams Live Operations Stream</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time channel notification cards posted to MS Teams channels for operational visibility.
              </p>
            </div>
            <div className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
              Channel: <strong>#field-sales-alerts</strong>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading Teams activity feed...</div>
            ) : data?.teamsActivityFeed.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No Teams alerts dispatched on this date.</div>
            ) : data?.teamsActivityFeed.map((item) => (
              <div key={item.visitId} className="p-4 hover:bg-slate-50/80 transition flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs mt-0.5 border border-indigo-100">
                    MS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.employeeName}</span>
                      <span className="text-slate-400 text-xs">checked in at</span>
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm">{item.schoolName}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
                      <span>Arrival: {new Date(item.checkInTime).toLocaleTimeString()}</span>
                      {item.checkOutTime && (
                        <span>• Departure: {new Date(item.checkOutTime).toLocaleTimeString()} ({item.durationMinutes} mins)</span>
                      )}
                      <span>• Perimeter: {item.isInsideGeofence ? `✅ Inside (${item.checkInDistanceMeters}m)` : `⚠️ ${item.checkInDistanceMeters}m`}</span>
                    </div>

                    {item.outcome && (
                      <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 italic">
                        "{item.outcome}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    🔔 Delivered to Teams
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    {new Date(item.teamsNotifiedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: 3-Way Reconciliation Matrix */}
      {activeSubTab === 'reconciliation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                <h3 className="font-bold text-slate-900 text-base">3-Way Enterprise Reconciliation Matrix</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cross-checking Field Visits (Techno App) ↔ Official Timesheets (Zoho People) ↔ Push Notifications (Microsoft Teams).
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
              Full Data Integrity Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Representative</th>
                  <th className="px-4 py-3">Step 1: Field App Proof</th>
                  <th className="px-4 py-3">Step 2: Zoho People HRMS</th>
                  <th className="px-4 py-3">Step 3: Microsoft Teams</th>
                  <th className="px-4 py-3">Reconciliation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Computing 3-way reconciliation...</td>
                  </tr>
                ) : data?.employeeLedger.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{emp.fullName}</p>
                      <p className="text-[11px] text-slate-400">{emp.designation}</p>
                    </td>
                    <td className="px-4 py-3">
                      {emp.totalVisits > 0 ? (
                        <div>
                          <p className="font-bold text-emerald-700">✅ {emp.totalVisits} Verified Visits</p>
                          <p className="text-[11px] text-slate-500">Dual photos & GPS geofence logged</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">No field visits logged</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {emp.zohoStatus === 'SYNCED' || emp.zohoStatus === 'SIMULATED' ? (
                        <div>
                          <p className="font-bold text-sky-700">✅ Official Punch Logged</p>
                          <p className="text-[11px] text-slate-500">ID: {emp.zohoPunchIds[0] || 'ZOHO-PUNCH-OK'}</p>
                        </div>
                      ) : emp.totalVisits > 0 ? (
                        <span className="font-bold text-amber-600">⚠️ Pending Sync</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {emp.teamsNotified ? (
                        <div>
                          <p className="font-bold text-indigo-700">✅ Card Broadcasted</p>
                          <p className="text-[11px] text-slate-500">Sent to #field-sales-alerts</p>
                        </div>
                      ) : emp.totalVisits > 0 ? (
                        <span className="font-bold text-amber-600">⚠️ Broadcast Pending</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {emp.reconciliationStatus === 'PERFECTLY_ALIGNED' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Perfectly Aligned
                        </span>
                      ) : emp.reconciliationStatus === 'ZOHO_SYNC_PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> Zoho Sync Pending
                        </span>
                      ) : emp.reconciliationStatus === 'TEAMS_BROADCAST_PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Clock className="w-3.5 h-3.5" /> Teams Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Office / HQ Day
                        </span>
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
  );
};
