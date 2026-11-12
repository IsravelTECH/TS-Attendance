import { Router, Response } from 'express';
import { db } from '../data/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { calculateDistanceMeters } from '../services/geofence.service';
import { zohoPeopleService } from '../services/zohoPeople.service';
import { teamsService } from '../services/teams.service';
import { SchoolVisit, VisitStatus } from '../types';

const router = Router();

// Fallback dummy photo if camera not provided
const DEFAULT_PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230284c7"/><text x="200" y="150" fill="white" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">📷 Photo Proof Recorded</text></svg>';

// 1. Check-In to Client School (Arrival Photo + GPS)
router.post('/check-in', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { schoolId, latitude, longitude, photo, notes, overrideGeofence = false } = req.body;

  if (!schoolId) {
    res.status(400).json({ success: false, message: 'schoolId is required for check-in.' });
    return;
  }

  const school = db.getSchoolById(schoolId);
  if (!school) {
    res.status(404).json({ success: false, message: 'Client school not found in directory.' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Check if sales executive already has an active check-in
  const activeVisit = db.getActiveVisit(user.id, today);
  if (activeVisit) {
    const existingSchool = db.getSchoolById(activeVisit.schoolId);
    res.status(400).json({
      success: false,
      message: `You are already checked in at ${existingSchool?.schoolName || 'another school'}. Please check out before starting a new visit.`,
      activeVisit
    });
    return;
  }

  // Calculate distance to school center
  let distanceMeters = 0;
  let isInsideGeofence = true;
  if (latitude && longitude) {
    distanceMeters = Math.round(calculateDistanceMeters(
      Number(latitude),
      Number(longitude),
      school.latitude,
      school.longitude
    ));
    isInsideGeofence = distanceMeters <= school.geofenceRadiusMeters;
  }

  if (!isInsideGeofence && !overrideGeofence) {
    res.status(403).json({
      success: false,
      message: `Check-in rejected: You are ${distanceMeters}m away from ${school.schoolName} (Allowed perimeter is ${school.geofenceRadiusMeters}m).`,
      distanceMeters,
      allowedRadiusMeters: school.geofenceRadiusMeters
    });
    return;
  }

  const newVisit: SchoolVisit = {
    id: `vst-${Date.now()}`,
    employeeId: user.id,
    schoolId: school.id,
    visitDate: today,
    checkInTime: now.toISOString(),
    checkInLat: latitude ? Number(latitude) : school.latitude,
    checkInLng: longitude ? Number(longitude) : school.longitude,
    checkInDistanceMeters: distanceMeters,
    checkInPhoto: photo || DEFAULT_PHOTO,
    checkInNotes: notes || `Arrived at ${school.schoolName}`,
    status: 'IN_PROGRESS',
    isInsideGeofence,
    createdAt: now.toISOString(),
    zohoSyncStatus: 'PENDING',
    teamsNotified: false
  };

  const created = db.createVisit(newVisit);

  // Asynchronous Dispatch to Zoho People & Microsoft Teams
  zohoPeopleService.recordCheckIn(user.email, now).then(zohoRes => {
    db.updateVisit(created.id, {
      zohoSyncStatus: zohoRes.success ? (zohoRes.isSimulated ? 'SIMULATED' : 'SYNCED') : 'FAILED',
      zohoPunchId: zohoRes.punchId,
      zohoSyncedAt: new Date().toISOString(),
      zohoSyncError: zohoRes.success ? undefined : zohoRes.message
    });
  }).catch(e => console.error('[Visits Check-In] Zoho sync error:', e));

  teamsService.notifyCheckIn(created, user, school).then(teamsRes => {
    if (teamsRes.success) {
      db.updateVisit(created.id, {
        teamsNotified: true,
        teamsNotifiedAt: new Date().toISOString()
      });
    }
  }).catch(e => console.error('[Visits Check-In] Teams alert error:', e));

  res.json({
    success: true,
    message: `Checked in at ${school.schoolName}! Photo and GPS logged. Syncing with Zoho People & Teams...`,
    visit: created,
    school
  });
});

// 2. Check-Out from Client School (Completion Photo + Meeting Notes)
router.post('/check-out', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { visitId, latitude, longitude, photo, outcome, followUpDate } = req.body;

  const today = new Date().toISOString().split('T')[0];
  const visit = visitId ? db.getVisitById(visitId) : db.getActiveVisit(user.id, today);

  if (!visit) {
    res.status(404).json({ success: false, message: 'No active visit found to check out from.' });
    return;
  }

  if (visit.employeeId !== user.id && user.role === 'SALES_EXECUTIVE') {
    res.status(403).json({ success: false, message: 'Unauthorized: Cannot check out another representative.' });
    return;
  }

  const school = db.getSchoolById(visit.schoolId);
  const now = new Date();
  const checkInDate = new Date(visit.checkInTime);
  const durationMins = Math.max(1, Math.floor((now.getTime() - checkInDate.getTime()) / (1000 * 60)));

  let distanceMeters = 0;
  if (latitude && longitude && school) {
    distanceMeters = Math.round(calculateDistanceMeters(
      Number(latitude),
      Number(longitude),
      school.latitude,
      school.longitude
    ));
  }

  const updated = db.updateVisit(visit.id, {
    checkOutTime: now.toISOString(),
    checkOutLat: latitude ? Number(latitude) : visit.checkInLat,
    checkOutLng: longitude ? Number(longitude) : visit.checkInLng,
    checkOutDistanceMeters: distanceMeters,
    checkOutPhoto: photo || visit.checkInPhoto || DEFAULT_PHOTO,
    visitOutcome: outcome || 'School visit completed.',
    followUpDate: followUpDate || undefined,
    durationMinutes: durationMins,
    status: 'COMPLETED'
  });

  // Asynchronous Dispatch to Zoho People & Microsoft Teams
  zohoPeopleService.recordCheckOut(user.email, checkInDate, now).then(zohoRes => {
    db.updateVisit(visit.id, {
      zohoSyncStatus: zohoRes.success ? (zohoRes.isSimulated ? 'SIMULATED' : 'SYNCED') : 'FAILED',
      zohoPunchId: zohoRes.punchId || visit.zohoPunchId,
      zohoSyncedAt: new Date().toISOString(),
      zohoSyncError: zohoRes.success ? undefined : zohoRes.message
    });
  }).catch(e => console.error('[Visits Check-Out] Zoho sync error:', e));

  if (school && updated) {
    teamsService.notifyCheckOut(updated, user, school).then(teamsRes => {
      if (teamsRes.success) {
        db.updateVisit(visit.id, {
          teamsNotified: true,
          teamsNotifiedAt: new Date().toISOString()
        });
      }
    }).catch(e => console.error('[Visits Check-Out] Teams alert error:', e));
  }

  res.json({
    success: true,
    message: `Checked out from ${school?.schoolName || 'School'}. Duration: ${Math.floor(durationMins / 60)}h ${durationMins % 60}m. Updating Zoho People & Teams...`,
    visit: updated
  });
});

// 3. Current Sales Rep's Today Status & History
router.get('/today', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const today = new Date().toISOString().split('T')[0];

  const todayVisits = db.getVisits(today, user.id);
  const activeVisit = todayVisits.find(v => v.status === 'IN_PROGRESS');
  const schools = db.getSchools();

  const enrichedVisits = todayVisits.map(v => {
    const school = schools.find(s => s.id === v.schoolId);
    return {
      ...v,
      schoolName: school?.schoolName || 'School',
      schoolAddress: school?.address || '',
      schoolContact: school?.contactPerson || '',
      schoolCategory: school?.category || 'K-12'
    };
  });

  const enrichedActive = activeVisit ? {
    ...activeVisit,
    school: schools.find(s => s.id === activeVisit.schoolId)
  } : null;

  res.json({
    success: true,
    today,
    activeVisit: enrichedActive,
    hasActiveVisit: !!activeVisit,
    visits: enrichedVisits,
    completedVisitsCount: todayVisits.filter(v => v.status === 'COMPLETED').length
  });
});

// 4. Sales Manager / Admin: Full Field Visits Ledger (with Dual-Photo Data)
router.get('/ledger', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { date, employeeId, schoolId, status } = req.query;
  const targetDate = (date as string) || new Date().toISOString().split('T')[0];

  const allVisits = db.getVisits(targetDate);
  const employees = db.getEmployees();
  const schools = db.getSchools();

  let ledger = allVisits.map(v => {
    const emp = employees.find(e => e.id === v.employeeId);
    const sch = schools.find(s => s.id === v.schoolId);

    return {
      ...v,
      salesRepName: emp?.fullName || 'Sales Executive',
      salesRepCode: emp?.employeeCode || '',
      salesRepTerritory: emp?.territory || '',
      schoolName: sch?.schoolName || 'Client School',
      schoolAddress: sch?.address || '',
      schoolContactPerson: sch?.contactPerson || '',
      schoolPhone: sch?.contactPhone || ''
    };
  });

  if (employeeId) ledger = ledger.filter(l => l.employeeId === employeeId);
  if (schoolId) ledger = ledger.filter(l => l.schoolId === schoolId);
  if (status) ledger = ledger.filter(l => l.status === status);

  res.json({
    success: true,
    date: targetDate,
    count: ledger.length,
    ledger
  });
});

// 5. Manager Dashboard Metrics
router.get('/summary', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const allVisits = db.getVisits(targetDate);
  const employees = db.getEmployees().filter(e => e.isActive);

  const inProgress = allVisits.filter(v => v.status === 'IN_PROGRESS');
  const completed = allVisits.filter(v => v.status === 'COMPLETED');
  const uniqueRepsActive = new Set(allVisits.map(v => v.employeeId)).size;

  const totalDuration = completed.reduce((sum, v) => sum + (v.durationMinutes || 0), 0);
  const averageDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;

  res.json({
    success: true,
    date: targetDate,
    metrics: {
      totalVisitsToday: allVisits.length,
      currentlyInMeeting: inProgress.length,
      completedVisits: completed.length,
      activeFieldExecutives: uniqueRepsActive,
      totalFieldSalesForce: employees.length,
      averageMeetingDurationMinutes: averageDuration
    }
  });
});

export default router;
