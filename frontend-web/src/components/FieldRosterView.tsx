import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Employee } from '../types';
import { Search, Mail, Phone, MapPin, BadgeCheck, Briefcase, RefreshCw, CheckCircle2 } from 'lucide-react';

export const FieldRosterView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployees();
      setEmployees(res.employees);
    } catch (err) {
      console.error('Failed to load field sales roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromZoho = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await api.syncRosterFromZoho();
      setSyncMessage(`Synced ${res.count} real employees from Zoho People!`);
      await loadEmployees();
    } catch (err: any) {
      console.error('Failed to sync from Zoho:', err);
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const filtered = employees.filter(e =>
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.territory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
            Zoho People Connected Roster
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Field Sales Team & Territory Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real enterprise employees synced live from Zoho People HRMS.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleSyncFromZoho}
            disabled={syncing || loading}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync from Zoho People</span>
          </button>
          <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            {filtered.length} Real Reps
          </span>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by sales rep name, code, territory, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400">Loading sales roster...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400">No sales representatives found.</div>
        ) : (
          filtered.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-sky-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {rep.employeeCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{rep.fullName}</h3>
                    <p className="text-xs text-sky-700 font-semibold">{rep.designation}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {rep.role}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">Territory: {rep.territory}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{rep.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{rep.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Active Field Rep
                </span>
                <span className="text-slate-400">Since {rep.joiningDate}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
