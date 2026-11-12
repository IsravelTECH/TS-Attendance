import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { IntegrationsOverview, SchoolVisit } from '../types';
import { RefreshCw, CheckCircle2, AlertTriangle, Send, ShieldCheck, ExternalLink, Zap } from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const [status, setStatus] = useState<IntegrationsOverview | null>(null);
  const [visits, setVisits] = useState<SchoolVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingZoho, setTestingZoho] = useState(false);
  const [testingTeams, setTestingTeams] = useState(false);
  const [zohoTestResult, setZohoTestResult] = useState<any>(null);
  const [teamsTestResult, setTeamsTestResult] = useState<any>(null);
  const [syncingVisitId, setSyncingVisitId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, ledgerRes] = await Promise.all([
        api.getIntegrationsStatus(),
        api.getVisitsLedger()
      ]);
      setStatus(statusRes);
      setVisits(ledgerRes.ledger);
    } catch (err) {
      console.error('Failed to load integrations status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestZoho = async () => {
    try {
      setTestingZoho(true);
      setZohoTestResult(null);
      const res = await api.testZohoConnection();
      setZohoTestResult(res);
      await loadData();
    } catch (err: any) {
      setZohoTestResult({ success: false, message: err.message });
    } finally {
      setTestingZoho(false);
    }
  };

  const handleTestTeams = async () => {
    try {
      setTestingTeams(true);
      setTeamsTestResult(null);
      const res = await api.testTeamsAlert();
      setTeamsTestResult(res);
      await loadData();
    } catch (err: any) {
      setTeamsTestResult({ success: false, message: err.message });
    } finally {
      setTestingTeams(false);
    }
  };

  const handleManualSync = async (visitId: string) => {
    try {
      setSyncingVisitId(visitId);
      await api.syncVisitToZoho(visitId);
      await loadData();
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setSyncingVisitId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-sky-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>HRMS & Unified Collaboration Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Zoho People & Microsoft Teams Integration
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Synchronize field sales arrivals and dual-photo verified visits into official Zoho People daily attendance sheets, and push live visit cards to Microsoft Teams channels.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="self-start md:self-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zoho People Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg border border-red-100">
                  Z
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Zoho People HRMS</h3>
                  <p className="text-xs text-slate-500">Official Attendance & Payroll Engine</p>
                </div>
              </div>
              {status?.zoho.configured ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Live OAuth 2.0
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sandbox / Simulated
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              When a sales representative completes an arrival check-in with gate photo or departure with meeting notes, an attendance record is dispatched to <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded">POST /people/api/attendance</code>.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 font-mono text-slate-600 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Region:</span>
                <span className="font-semibold text-slate-800">{status?.zoho.accountsUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">API Endpoint:</span>
                <span className="font-semibold text-slate-800">{status?.zoho.apiUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attendance Sync:</span>
                <span className="text-emerald-700 font-bold">{status?.metrics.zohoSyncedCount || 0} visits synced</span>
              </div>
            </div>

            {zohoTestResult && (
              <div className={`p-3 rounded-xl text-xs mb-4 border ${zohoTestResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                <p className="font-bold">{zohoTestResult.success ? '✅ Test Handshake Successful' : '❌ Test Handshake Failed'}</p>
                <p className="mt-0.5">{zohoTestResult.message}</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <a
              href="https://api-console.zoho.in/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-500 hover:text-sky-600 flex items-center gap-1 transition"
            >
              <span>Zoho API Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleTestZoho}
              disabled={testingZoho}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              {testingZoho ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Test Zoho Handshake</span>
            </button>
          </div>
        </div>

        {/* Microsoft Teams Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100">
                  T
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Microsoft Teams</h3>
                  <p className="text-xs text-slate-500">Real-Time Channel Activity Cards</p>
                </div>
              </div>
              {status?.teams.configured ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Webhook Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  <AlertTriangle className="w-3.5 h-3.5" /> Simulation Mode
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Posts rich Adaptive Cards into your designated sales operations channel whenever an executive arrives at a client school, displaying the rep's name, school details, GPS distance, and photo proof.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 font-mono text-slate-600 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Card Format:</span>
                <span className="font-semibold text-slate-800">Office 365 Connector / Adaptive Card</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Channel Alerts:</span>
                <span className="text-indigo-700 font-bold">{status?.metrics.teamsNotifiedCount || 0} alerts broadcasted</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Webhook Status:</span>
                <span className="text-slate-700">{status?.teams.configured ? 'Configured in .env' : 'Ready for TEAMS_WEBHOOK_URL'}</span>
              </div>
            </div>

            {teamsTestResult && (
              <div className={`p-3 rounded-xl text-xs mb-4 border ${teamsTestResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                <p className="font-bold">{teamsTestResult.success ? '✅ Teams Card Sent' : '❌ Delivery Failed'}</p>
                <p className="mt-0.5">{teamsTestResult.message}</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Channel Alerts Enabled</span>
            <button
              onClick={handleTestTeams}
              disabled={testingTeams}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              {testingTeams ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Test Teams Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Synchronization Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Field Visit Attendance Sync Ledger</h3>
            <p className="text-xs text-slate-500">Live synchronization state between client school visits, Zoho People attendance, and Microsoft Teams.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-full self-start">
            Total Visits: {visits.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Sales Executive</th>
                <th className="px-4 py-3">Client School</th>
                <th className="px-4 py-3">Check-In Time</th>
                <th className="px-4 py-3">Check-Out Time</th>
                <th className="px-4 py-3">Zoho People Sync</th>
                <th className="px-4 py-3">MS Teams Alert</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No visits recorded yet.</td>
                </tr>
              ) : (
                visits.map((v) => {
                  const isSyncing = syncingVisitId === v.id;
                  const isSynced = v.zohoSyncStatus === 'SYNCED' || v.zohoSyncStatus === 'SIMULATED';

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {v.salesRepName || v.employeeId}
                        <p className="text-[11px] text-slate-400 font-normal">{v.salesRepTerritory}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{v.schoolName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{v.schoolAddress}</p>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {v.checkOutTime ? new Date(v.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Meeting'}
                      </td>
                      <td className="px-4 py-3">
                        {isSynced ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {v.zohoSyncStatus === 'SIMULATED' ? 'Synced (Sim)' : 'Synced'}
                          </span>
                        ) : v.zohoSyncStatus === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                            Pending
                          </span>
                        )}
                        {v.zohoPunchId && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.zohoPunchId}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {v.teamsNotified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            🔔 Alerted
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleManualSync(v.id)}
                          disabled={isSyncing}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition inline-flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>Sync Zoho</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
