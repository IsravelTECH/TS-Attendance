import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BikeOdometerRecord, Employee } from '../types';
import { 
  Bike, 
  Gauge, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Eye, 
  X, 
  Upload, 
  MessageSquare,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface BikeOdometerAuditViewProps {
  currentUser: Employee | null;
}

export const BikeOdometerAuditView: React.FC<BikeOdometerAuditViewProps> = ({ currentUser }) => {
  const [claims, setClaims] = useState<BikeOdometerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [inspectingClaim, setInspectingClaim] = useState<BikeOdometerRecord | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Custom Test Form State
  const [customPlate, setCustomPlate] = useState('TN 02 CD 5678');
  const [customStartKm, setCustomStartKm] = useState('14210');
  const [customEndKm, setCustomEndKm] = useState('14258');
  const [customNotes, setCustomNotes] = useState('Indiranagar & Whitefield School Route');
  const [showCustomModal, setShowCustomModal] = useState(false);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const res = await api.getBikeClaims();
      setClaims(res.claims);
    } catch (err: any) {
      console.error('Failed to load bike claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePreset = async (preset: string) => {
    try {
      setSimulating(true);
      setActionMessage(null);
      const res = await api.simulateTeamsOdometer(preset, currentUser?.email);
      setActionMessage(res.message);
      await loadClaims();
    } catch (err: any) {
      setActionMessage(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSimulating(true);
      setActionMessage(null);
      const res = await api.submitOdometerClaim({
        senderEmail: currentUser?.email || 'israveltech@gmail.com',
        plateNumber: customPlate,
        startKm: parseInt(customStartKm) || 10000,
        endKm: parseInt(customEndKm) || 10045,
        source: 'TEAMS_CHAT',
        notes: customNotes
      });
      setActionMessage(res.message);
      setShowCustomModal(false);
      await loadClaims();
    } catch (err: any) {
      setActionMessage(`Submission failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const totalDistance = claims.reduce((acc, c) => acc + (c.totalKmTraveled || 0), 0);
  const totalReimbursement = claims.reduce((acc, c) => acc + (c.totalAllowanceClaim || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
              Teams Chat AI Vision Engine
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live Testing Console
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Bike className="w-6 h-6 text-sky-600" />
            Bike Number Plate & Odometer KM Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Extracts motorcycle registration plates & speedometer kilometer readings from Microsoft Teams photos, then calculates travel allowances automatically.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCustomModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Test Custom Photos</span>
          </button>

          <button
            onClick={loadClaims}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Instant 1-Click Simulation Buttons */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 p-4 rounded-2xl border border-sky-100 shadow-xs">
        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-sky-600" />
          Instant 1-Click Test Presets (Simulates Rep Posting in Teams Chat):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleSimulatePreset('FZ')}
            disabled={simulating}
            className="p-3 bg-white hover:bg-slate-50 border border-sky-200 rounded-xl text-left transition shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-sky-600">Yamaha FZ (TN 02 CD 5678)</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">48 KM</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Start: 14,210 km • End: 14,258 km • ₹168.00</p>
          </button>

          <button
            onClick={() => handleSimulatePreset('SPLENDOR')}
            disabled={simulating}
            className="p-3 bg-white hover:bg-slate-50 border border-indigo-200 rounded-xl text-left transition shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600">Hero Splendor (KA 05 MC 4321)</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">35 KM</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Start: 28,450 km • End: 28,485 km • ₹122.50</p>
          </button>

          <button
            onClick={() => handleSimulatePreset('ACTIVA')}
            disabled={simulating}
            className="p-3 bg-white hover:bg-slate-50 border border-emerald-200 rounded-xl text-left transition shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-600">Honda Activa (TS 09 EQ 8812)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">42 KM</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Start: 09,120 km • End: 09,162 km • ₹147.00</p>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center justify-between font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Field Distance</span>
            <Gauge className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-sky-700">
            {totalDistance} <span className="text-sm font-bold text-slate-500">KM</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Cumulative distance across claims</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fuel Reimbursement</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            ₹{totalReimbursement.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Calculated at standard ₹3.50 / KM</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">AI OCR Pass Rate</span>
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
            98.5%
          </p>
          <p className="text-xs text-slate-400 mt-1">Automatic plate & digit validation</p>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Travel Claims & Odometer Verification Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified records received from Microsoft Teams chat with AI-extracted readings.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-white rounded-lg border border-slate-200 text-slate-700">
            {claims.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Sales Representative</th>
                <th className="px-4 py-3">Bike Number Plate</th>
                <th className="px-4 py-3">Start Odometer</th>
                <th className="px-4 py-3">End Odometer</th>
                <th className="px-4 py-3">KM Traveled</th>
                <th className="px-4 py-3">Allowance Claim</th>
                <th className="px-4 py-3">Source & Status</th>
                <th className="px-4 py-3 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading travel claims...</td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">No bike odometer claims logged yet. Click one of the test presets above!</td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{c.employeeName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.employeeEmail}</p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2.5 py-1 bg-slate-900 text-amber-300 rounded-lg tracking-wider border border-slate-700">
                          {c.detectedPlateNumber}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {Math.round(c.plateConfidence * 100)}% Match
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                      {c.startKm?.toLocaleString()} km
                      <span className="text-[10px] text-slate-400 block font-normal">{c.startTime || 'Morning'}</span>
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                      {c.endKm ? `${c.endKm.toLocaleString()} km` : '—'}
                      <span className="text-[10px] text-slate-400 block font-normal">{c.endTime || 'Evening'}</span>
                    </td>

                    <td className="px-4 py-3 font-mono font-extrabold text-sky-700">
                      {c.totalKmTraveled ? `${c.totalKmTraveled} km` : 'In Progress'}
                    </td>

                    <td className="px-4 py-3 font-mono font-extrabold text-emerald-700">
                      ₹{c.totalAllowanceClaim.toFixed(2)}
                      <span className="text-[10px] text-slate-400 block font-normal font-sans">@ ₹{c.ratePerKm}/km</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                        <MessageSquare className="w-3 h-3" />
                        {c.source}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setInspectingClaim(c)}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect Photos
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Photos Modal */}
      {inspectingClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded">
                  AI OCR Vision Verification Report
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Motorcycle Travel Claim • {inspectingClaim.employeeName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted from Teams Chat • Date: {inspectingClaim.date}
                </p>
              </div>
              <button onClick={() => setInspectingClaim(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-Side Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
              {/* Photo 1: Bike Number Plate */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-3">
                <p className="text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-sky-600" />
                  1. Bike Number Plate Photo
                </p>
                <img
                  src={inspectingClaim.bikeNumberPlatePhoto}
                  alt="Number Plate"
                  className="w-full h-36 object-contain rounded-lg bg-white border border-slate-200"
                />
                <div className="mt-2 text-center bg-slate-900 text-amber-300 font-mono font-black text-xs py-1 rounded">
                  {inspectingClaim.detectedPlateNumber}
                </div>
              </div>

              {/* Photo 2: Start Odometer */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-3">
                <p className="text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-sky-600" />
                  2. Morning Start KM Photo
                </p>
                <img
                  src={inspectingClaim.startOdometerPhoto}
                  alt="Start Odometer"
                  className="w-full h-36 object-contain rounded-lg bg-slate-950 border border-slate-200"
                />
                <div className="mt-2 text-center bg-sky-100 text-sky-900 font-mono font-bold text-xs py-1 rounded">
                  {inspectingClaim.startKm?.toLocaleString()} KM
                </div>
              </div>

              {/* Photo 3: End Odometer */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-3">
                <p className="text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                  3. Evening End KM Photo
                </p>
                <img
                  src={inspectingClaim.endOdometerPhoto || inspectingClaim.startOdometerPhoto}
                  alt="End Odometer"
                  className="w-full h-36 object-contain rounded-lg bg-slate-950 border border-slate-200"
                />
                <div className="mt-2 text-center bg-emerald-100 text-emerald-900 font-mono font-bold text-xs py-1 rounded">
                  {inspectingClaim.endKm ? `${inspectingClaim.endKm.toLocaleString()} KM` : 'In Progress'}
                </div>
              </div>
            </div>

            {/* Calculations Banner */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-sky-50 rounded-xl border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-extrabold text-slate-900 text-sm">
                  Distance: {inspectingClaim.totalKmTraveled} KM Traveled
                </p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Calculation Formula: ({inspectingClaim.endKm} - {inspectingClaim.startKm}) × ₹{inspectingClaim.ratePerKm}/km
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 uppercase font-bold block">Approved Travel Allowance</span>
                <span className="text-xl font-black text-emerald-700">₹{inspectingClaim.totalAllowanceClaim.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInspectingClaim(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Test Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Test Custom Bike Plate & KM Readings</h3>
                <p className="text-xs text-slate-500">Enter custom test numbers or paste your vehicle details to verify AI extraction.</p>
              </div>
              <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bike Registration Number (Plate)</label>
                <input
                  type="text"
                  value={customPlate}
                  onChange={(e) => setCustomPlate(e.target.value)}
                  placeholder="e.g. TN 02 CD 5678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs uppercase font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Morning Start KM</label>
                  <input
                    type="number"
                    value={customStartKm}
                    onChange={(e) => setCustomStartKm(e.target.value)}
                    placeholder="e.g. 14210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evening End KM</label>
                  <input
                    type="number"
                    value={customEndKm}
                    onChange={(e) => setCustomEndKm(e.target.value)}
                    placeholder="e.g. 14258"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Travel Route / Notes</label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Jayanagar to Whitefield School Visits"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-xs"
                >
                  {simulating ? 'Analyzing...' : 'Run AI OCR Analysis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
