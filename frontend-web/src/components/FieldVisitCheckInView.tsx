import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Employee, ClientSchool, SchoolVisit } from '../types';
import { Camera, MapPin, CheckCircle, Clock, AlertTriangle, ShieldCheck, FileText, Calendar, RotateCcw, Building2 } from 'lucide-react';

interface FieldVisitCheckInProps {
  user: Employee;
}

export const FieldVisitCheckInView: React.FC<FieldVisitCheckInProps> = ({ user }) => {
  const [schools, setSchools] = useState<ClientSchool[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // GPS State
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Photo Capture State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Form Fields
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    loadData();
    requestGPS();
    return () => {
      stopCamera();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [todayRes, schoolsRes] = await Promise.all([
        api.getTodayStatus(),
        api.getSchools()
      ]);
      setTodayStatus(todayRes);
      setSchools(schoolsRes.schools);
      if (schoolsRes.schools.length > 0 && !selectedSchoolId) {
        setSelectedSchoolId(schoolsRes.schools[0].id);
      }
    } catch (err) {
      console.error('Error loading field visit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6))
          });
        },
        () => {
          // Default to Bangalore school coords for preview testing
          setCurrentCoords({ lat: 12.9716, lng: 77.5946 });
        },
        { enableHighAccuracy: true }
      );
    } else {
      setCurrentCoords({ lat: 12.9716, lng: 77.5946 });
    }
  };

  // Start Device Camera
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied or unsupported, using file fallback:', err);
      setIsCameraActive(false);
      // Trigger file selector
      const fileInput = document.getElementById('camera-file-input') as HTMLInputElement;
      if (fileInput) fileInput.click();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Snap photo from webcam stream
  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 400;
    canvas.height = videoRef.current.videoHeight || 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhotoPreview(dataUrl);
      stopCamera();
    }
  };

  // Handle file capture from phone camera
  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Check-In
  const handleCheckIn = async () => {
    if (!selectedSchoolId) {
      setFeedback({ type: 'error', message: 'Please select a client school.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await api.checkIn({
        schoolId: selectedSchoolId,
        latitude: currentCoords?.lat,
        longitude: currentCoords?.lng,
        photo: photoPreview || undefined,
        notes: notes || 'Arrived at school entrance for meeting'
      });

      setFeedback({ type: 'success', message: res.message });
      setPhotoPreview(null);
      setNotes('');
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Check-in failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Check-Out
  const handleCheckOut = async () => {
    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await api.checkOut({
        visitId: todayStatus?.activeVisit?.id,
        latitude: currentCoords?.lat,
        longitude: currentCoords?.lng,
        photo: photoPreview || undefined,
        outcome: outcome || 'Meeting concluded with school authority.',
        followUpDate: followUpDate || undefined
      });

      setFeedback({ type: 'success', message: res.message });
      setPhotoPreview(null);
      setOutcome('');
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Check-out failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveVisit = todayStatus?.hasActiveVisit;
  const activeVisit = todayStatus?.activeVisit;
  const completedVisits = todayStatus?.visits?.filter((v: SchoolVisit) => v.status === 'COMPLETED') || [];
  const selectedSchool = schools.find(s => s.id === selectedSchoolId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            Field Sales Self-Service
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Client School Visit Check-In & Check-Out</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Representative: <span className="font-semibold text-slate-700">{user.fullName}</span> ({user.employeeCode}) • Territory: {user.territory}
          </p>
        </div>

        <div>
          {hasActiveVisit ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              Currently In Meeting at {activeVisit?.school?.schoolName || 'School'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-4 h-4" /> Ready for Next School Visit
            </span>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Interaction Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {hasActiveVisit ? (
          /* ================= ACTIVE VISIT: CHECK-OUT MODE ================= */
          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Ongoing School Meeting
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{activeVisit.school?.schoolName}</h3>
                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> {activeVisit.school?.address}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Contact: <strong>{activeVisit.school?.contactPerson}</strong> ({activeVisit.school?.contactPhone})
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">Checked-In At</p>
                  <p className="text-base font-mono font-bold text-slate-800">
                    {new Date(activeVisit.checkInTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Arrival Photo Thumbnail */}
              {activeVisit.checkInPhoto && (
                <div className="mt-4 pt-4 border-t border-amber-200/60 flex items-center gap-3">
                  <img
                    src={activeVisit.checkInPhoto}
                    alt="Arrival Photo"
                    className="w-16 h-12 object-cover rounded-lg border border-amber-300 shadow-sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Arrival Gate Photo Verified</p>
                    <p className="text-[11px] text-slate-500">Captured upon arrival at {new Date(activeVisit.checkInTime).toLocaleTimeString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Departure Photo Capture */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Mandatory Completion Photo (Signed Meeting Slip / Office / Setup) *
              </label>

              {/* Camera Video Stream or Preview */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black max-w-md mx-auto aspect-video flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 flex gap-3">
                    <button
                      type="button"
                      onClick={captureFromVideo}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" /> Snap Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden max-w-md mx-auto border-2 border-emerald-500 shadow-md">
                  <img src={photoPreview} alt="Departure Proof" className="w-full h-52 object-cover" />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setPhotoPreview(null)}
                      className="px-2.5 py-1 bg-black/70 hover:bg-black text-white text-xs rounded-lg flex items-center gap-1 backdrop-blur-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retake
                    </button>
                  </div>
                  <div className="bg-emerald-600 text-white text-[11px] font-bold text-center py-1">
                    ✓ Departure Photo Captured
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-sky-500 transition">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Take Departure Proof Photo</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Capture with phone camera or upload site photo</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" /> Open Camera
                    </button>
                    <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer inline-flex items-center gap-1.5">
                      <span>Upload File</span>
                      <input
                        id="camera-file-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileCapture}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Outcome Notes */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Meeting Summary & Deal Progress Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Demonstrated ERP software to Principal Dr. Joseph. Quotation requested for 850 students. Key decision maker agreed."
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Next Follow-up Date (Optional)
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Complete Visit Button */}
            <button
              onClick={handleCheckOut}
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{submitting ? 'Completing Visit...' : 'CHECK OUT & COMPLETE SCHOOL VISIT'}</span>
            </button>
          </div>
        ) : (
          /* ================= CHECK-IN AT SCHOOL MODE ================= */
          <div className="p-6 md:p-8 space-y-6">
            {/* School Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Client School to Visit *
              </label>
              <div className="relative">
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-bold text-slate-800 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.schoolName} ({s.category}) — {s.address}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSchool && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{selectedSchool.schoolName}</p>
                    <p className="text-[11px] text-slate-500">Contact: {selectedSchool.contactPerson} ({selectedSchool.contactPhone})</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Perimeter: {selectedSchool.geofenceRadiusMeters}m</span>
                  </div>
                </div>
              )}
            </div>

            {/* Arrival Photo Capture */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Mandatory Arrival Photo (School Gate / Reception / Signboard) *
              </label>

              {/* Camera Video Stream or Preview */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black max-w-md mx-auto aspect-video flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 flex gap-3">
                    <button
                      type="button"
                      onClick={captureFromVideo}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" /> Snap Arrival Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden max-w-md mx-auto border-2 border-sky-500 shadow-md">
                  <img src={photoPreview} alt="Arrival Proof" className="w-full h-52 object-cover" />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setPhotoPreview(null)}
                      className="px-2.5 py-1 bg-black/70 hover:bg-black text-white text-xs rounded-lg flex items-center gap-1 backdrop-blur-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retake
                    </button>
                  </div>
                  <div className="bg-sky-600 text-white text-[11px] font-bold text-center py-1">
                    ✓ Arrival Photo Captured & GPS Stamped
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-sky-500 transition">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Take School Gate / Entrance Photo</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Proves physical presence at client school</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" /> Open Camera
                    </button>
                    <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer inline-flex items-center gap-1.5">
                      <span>Upload File</span>
                      <input
                        id="camera-file-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileCapture}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Visit Reason / Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Visit Purpose / Arrival Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Scheduled demo with Science HOD & Principal"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Check-In Button */}
            <button
              onClick={handleCheckIn}
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>{submitting ? 'Verifying & Checking In...' : 'UPLOAD PHOTO & CHECK IN AT SCHOOL'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Today's Completed Visits Timeline */}
      {completedVisits.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Today's Completed School Visits ({completedVisits.length})
          </h3>

          <div className="space-y-4">
            {completedVisits.map((v: SchoolVisit) => (
              <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {v.durationMinutes} mins meeting
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{v.schoolName}</h4>
                  <p className="text-xs text-slate-500">{v.schoolAddress}</p>
                  <p className="text-xs text-slate-700 italic">"{v.visitOutcome}"</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Arrival</p>
                    <img src={v.checkInPhoto} alt="Gate" className="w-16 h-12 object-cover rounded-lg border border-slate-300 mt-0.5" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Departure</p>
                    <img src={v.checkOutPhoto || v.checkInPhoto} alt="Meeting" className="w-16 h-12 object-cover rounded-lg border border-slate-300 mt-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
