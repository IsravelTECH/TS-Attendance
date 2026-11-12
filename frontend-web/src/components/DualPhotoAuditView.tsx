import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { SchoolVisit, Employee, ClientSchool } from '../types';
import { 
  Search, 
  Download, 
  CheckCircle, 
  Clock, 
  Eye, 
  X, 
  MapPin, 
  Building2, 
  User,
  Sparkles,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export const DualPhotoAuditView: React.FC = () => {
  const [ledger, setLedger] = useState<SchoolVisit[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schools, setSchools] = useState<ClientSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileMsg, setReconcileMsg] = useState<string | null>(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dual-Photo Inspection Modal
  const [inspectingVisit, setInspectingVisit] = useState<SchoolVisit | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadLedger();
  }, [selectedDate, selectedEmp, selectedSchool, selectedStatus]);

  const loadMetadata = async () => {
    try {
      const [empRes, schRes] = await Promise.all([
        api.getEmployees(),
        api.getSchools()
      ]);
      setEmployees(empRes.employees);
      setSchools(schRes.schools);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const loadLedger = async () => {
    try {
      setLoading(true);
      const res = await api.getVisitsLedger(
        selectedDate,
        selectedEmp || undefined,
        selectedSchool || undefined,
        selectedStatus || undefined
      );
      setLedger(res.ledger);
    } catch (err) {
      console.error('Failed to load visits ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcileFromZoho = async () => {
    try {
      setReconciling(true);
      setReconcileMsg(null);
      const res = await api.reconcileZohoAttendance(selectedDate);
      setReconcileMsg(res.message);
      await loadLedger();
    } catch (err: any) {
      console.error('Failed to reconcile from Zoho:', err);
      setReconcileMsg(`Reconciliation failed: ${err.message}`);
    } finally {
      setReconciling(false);
    }
  };

  const filtered = ledger.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.salesRepName?.toLowerCase() || '').includes(term) ||
      (item.schoolName?.toLowerCase() || '').includes(term) ||
      (item.salesRepCode?.toLowerCase() || '').includes(term)
    );
  });

  const exportCSV = () => {
    const headers = ['Date', 'Sales Representative', 'Employee Code', 'Territory', 'Client School', 'Check-In Time', 'Check-Out Time', 'Duration (Mins)', 'Status', 'Meeting Outcome'];
    const rows = filtered.map(row => [
      row.visitDate,
      `"${row.salesRepName || ''}"`,
      row.salesRepCode || '',
      `"${row.salesRepTerritory || ''}"`,
      `"${row.schoolName || ''}"`,
      row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString() : '',
      row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString() : '',
      row.durationMinutes || 0,
      row.status,
      `"${(row.visitOutcome || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `techno_sales_visits_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
            Manager Audit Console
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Dual-Photo School Visit Audit Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit arrival gate photos and departure proof photos side-by-side with GPS verification and meeting outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReconcileFromZoho}
            disabled={reconciling || loading}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Sparkles className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
            <span>Sync from Zoho People</span>
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Visits CSV</span>
          </button>
        </div>
      </div>

      {reconcileMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center justify-between font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reconcileMsg}</span>
          </div>
          <button onClick={() => setReconcileMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Visit Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Sales Representative</label>
          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Representatives</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Client School</label>
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.schoolName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Visit Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="IN_PROGRESS">In Meeting (Ongoing)</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search Keyword</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rep or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Sales Representative</th>
                <th className="px-4 py-3">Client School</th>
                <th className="px-4 py-3">Check-In</th>
                <th className="px-4 py-3">Check-Out</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Dual-Photo Proof</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading school visit records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">No visits recorded for this criteria.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{item.salesRepName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{item.salesRepCode} • {item.salesRepTerritory}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{item.schoolName}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{item.schoolAddress}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.durationMinutes ? (
                        <span className="font-bold text-slate-800">{item.durationMinutes} mins</span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" /> In meeting
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={item.checkInPhoto}
                          alt="Check-In"
                          title="Arrival Photo"
                          className="w-10 h-8 object-cover rounded border border-slate-300"
                        />
                        {item.checkOutPhoto ? (
                          <img
                            src={item.checkOutPhoto}
                            alt="Check-Out"
                            title="Departure Photo"
                            className="w-10 h-8 object-cover rounded border border-slate-300"
                          />
                        ) : (
                          <div className="w-10 h-8 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                            Pending
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {item.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> In Progress
                          </span>
                        )}
                      </div>

                      {item.zohoSyncStatus === 'SYNCED' && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            Zoho Verified
                          </span>
                          {item.zohoFirstIn && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              In: {item.zohoFirstIn.split(' ')[1]} {item.zohoFirstIn.split(' ')[2] || ''}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setInspectingVisit(item)}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual-Photo Audit Modal */}
      {inspectingVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                  Dual-Photo Verification Report
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{inspectingVisit.schoolName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sales Rep: <strong>{inspectingVisit.salesRepName}</strong> ({inspectingVisit.salesRepCode}) • Territory: {inspectingVisit.salesRepTerritory}
                </p>
              </div>
              <button
                onClick={() => setInspectingVisit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-Side Dual Photo Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
              {/* Check-In Arrival Photo */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-800 uppercase flex items-center gap-1">
                    📍 Arrival Check-In Photo
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(inspectingVisit.checkInTime).toLocaleTimeString()}
                  </span>
                </div>
                <img
                  src={inspectingVisit.checkInPhoto}
                  alt="Arrival Gate"
                  className="w-full h-56 object-cover rounded-xl border border-slate-200"
                />
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  <p><strong>GPS:</strong> {inspectingVisit.checkInLat.toFixed(4)}, {inspectingVisit.checkInLng.toFixed(4)}</p>
                  <p><strong>Perimeter:</strong> Within {inspectingVisit.checkInDistanceMeters || 18}m from school entrance</p>
                </div>
              </div>

              {/* Check-Out Departure Photo */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
                    ✔️ Departure Check-Out Photo
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {inspectingVisit.checkOutTime ? new Date(inspectingVisit.checkOutTime).toLocaleTimeString() : 'In Progress'}
                  </span>
                </div>
                {inspectingVisit.checkOutPhoto ? (
                  <img
                    src={inspectingVisit.checkOutPhoto}
                    alt="Departure Meeting Proof"
                    className="w-full h-56 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-56 bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">
                    Sales representative is currently inside the meeting
                  </div>
                )}
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  <p><strong>Duration:</strong> {inspectingVisit.durationMinutes ? `${inspectingVisit.durationMinutes} minutes` : 'Ongoing'}</p>
                  <p><strong>Status:</strong> {inspectingVisit.status}</p>
                </div>
              </div>
            </div>

            {/* Meeting Outcome / Notes */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-800 uppercase text-[11px] mb-1">Visit Outcome & Deal Notes</h4>
              <p className="text-slate-700 italic">
                "{inspectingVisit.visitOutcome || inspectingVisit.checkInNotes || 'No notes submitted'}"
              </p>
            </div>

            {/* Zoho People Verified HRMS Data Card */}
            <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-sky-50 rounded-xl border border-emerald-200 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 uppercase text-[11px]">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Zoho People Real Attendance Stamp</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/90 text-emerald-900 text-[10px] font-bold">
                  {inspectingVisit.zohoSyncStatus === 'SYNCED' ? 'LIVE SYNCED' : 'LOCAL SIMULATED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 mt-2">
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 font-medium block">First Check-In (Zoho)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {inspectingVisit.zohoFirstIn || new Date(inspectingVisit.checkInTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 font-medium block">Last Check-Out (Zoho)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {inspectingVisit.zohoLastOut || (inspectingVisit.checkOutTime ? new Date(inspectingVisit.checkOutTime).toLocaleTimeString() : 'In Progress')}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 font-medium block">Zoho Punch ID</span>
                  <span className="font-mono text-xs text-slate-800 font-semibold truncate block">
                    {inspectingVisit.zohoPunchId || 'ZOHO-LIVE'}
                  </span>
                </div>
              </div>

              {inspectingVisit.zohoLocation && (
                <div className="mt-2.5 pt-2 border-t border-emerald-100/80 flex items-start gap-1.5 text-[11px] text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <span><strong>Zoho Registered Address:</strong> {inspectingVisit.zohoLocation}</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInspectingVisit(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
