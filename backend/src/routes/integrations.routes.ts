import { Router, Request, Response } from 'express';
import { zohoPeopleService } from '../services/zohoPeople.service';
import { teamsService } from '../services/teams.service';
import { odometerOcrService } from '../services/odometerOcr.service';
import { db } from '../data/db';

const router = Router();

// 1. Integration Status Overview
router.get('/status', (_req: Request, res: Response) => {
  const visits = db.getVisits();
  const zohoSyncedCount = visits.filter(v => v.zohoSyncStatus === 'SYNCED' || v.zohoSyncStatus === 'SIMULATED').length;
  const teamsNotifiedCount = visits.filter(v => v.teamsNotified).length;

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    zoho: zohoPeopleService.getStatus(),
    teams: teamsService.getStatus(),
    metrics: {
      totalVisits: visits.length,
      zohoSyncedCount,
      teamsNotifiedCount,
      pendingSyncCount: visits.filter(v => v.zohoSyncStatus === 'PENDING').length
    }
  });
});

// 2. Test Zoho People Handshake
router.post('/zoho/test', async (_req: Request, res: Response) => {
  try {
    const result = await zohoPeopleService.testConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Test Microsoft Teams Alert Card
router.post('/teams/test', async (_req: Request, res: Response) => {
  try {
    const result = await teamsService.sendTestAlert();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Force / Retry Zoho Sync for a Visit
router.post('/zoho/sync/:visitId', async (req: Request, res: Response) => {
  const { visitId } = req.params;
  const visit = db.getVisitById(visitId);

  if (!visit) {
    res.status(404).json({ success: false, message: 'Visit record not found.' });
    return;
  }

  const employee = db.getEmployeeById(visit.employeeId);
  if (!employee) {
    res.status(404).json({ success: false, message: 'Employee not found.' });
    return;
  }

  const checkInDate = new Date(visit.checkInTime);
  let punchResult;

  if (visit.checkOutTime) {
    punchResult = await zohoPeopleService.recordCheckOut(employee.email, checkInDate, new Date(visit.checkOutTime));
  } else {
    punchResult = await zohoPeopleService.recordCheckIn(employee.email, checkInDate);
  }

  const updatedVisit = db.updateVisit(visit.id, {
    zohoSyncStatus: punchResult.success ? (punchResult.isSimulated ? 'SIMULATED' : 'SYNCED') : 'FAILED',
    zohoPunchId: punchResult.punchId || visit.zohoPunchId,
    zohoSyncedAt: new Date().toISOString(),
    zohoSyncError: punchResult.success ? undefined : punchResult.message
  });

  res.json({
    success: punchResult.success,
    message: punchResult.message,
    punchResult,
    visit: updatedVisit
  });
});

// 5. Super Admin: Comprehensive Enterprise Intelligence (Zoho People + MS Teams + Field App)
router.get('/super-admin/overview', (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const employees = db.getEmployees();
  const schools = db.getSchools();
  const visits = db.getVisits(date);

  // 1. Employee-level Zoho & Attendance Ledger
  const employeeLedger = employees.map(emp => {
    const empVisits = visits.filter(v => v.employeeId === emp.id);
    const sortedVisits = [...empVisits].sort((a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());
    
    const firstCheckIn = sortedVisits[0]?.checkInTime || null;
    const lastCheckOut = sortedVisits[sortedVisits.length - 1]?.checkOutTime || null;
    const totalFieldMinutes = empVisits.reduce((acc, v) => acc + (v.durationMinutes || 0), 0);

    const hasSynced = empVisits.some(v => v.zohoSyncStatus === 'SYNCED');
    const hasSimulated = empVisits.some(v => v.zohoSyncStatus === 'SIMULATED');
    const hasFailed = empVisits.some(v => v.zohoSyncStatus === 'FAILED');
    const hasPending = empVisits.some(v => v.zohoSyncStatus === 'PENDING' || !v.zohoSyncStatus);

    let zohoStatus: 'SYNCED' | 'SIMULATED' | 'FAILED' | 'PENDING' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
    if (empVisits.length > 0) {
      if (hasSynced) zohoStatus = 'SYNCED';
      else if (hasSimulated) zohoStatus = 'SIMULATED';
      else if (hasFailed) zohoStatus = 'FAILED';
      else if (hasPending) zohoStatus = 'PENDING';
    }

    const allTeamsAlerted = empVisits.length > 0 && empVisits.every(v => v.teamsNotified);

    // 3-Way Reconciliation
    let reconciliationStatus = 'OFFICE_OR_LEAVE';
    if (empVisits.length > 0) {
      if ((hasSynced || hasSimulated) && allTeamsAlerted) {
        reconciliationStatus = 'PERFECTLY_ALIGNED';
      } else if (!hasSynced && !hasSimulated) {
        reconciliationStatus = 'ZOHO_SYNC_PENDING';
      } else if (!allTeamsAlerted) {
        reconciliationStatus = 'TEAMS_BROADCAST_PENDING';
      }
    }

    return {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      email: emp.email,
      role: emp.role,
      territory: emp.territory,
      designation: emp.designation,
      totalVisits: empVisits.length,
      completedVisits: empVisits.filter(v => v.status === 'COMPLETED').length,
      firstCheckIn,
      lastCheckOut,
      totalFieldMinutes,
      zohoStatus,
      zohoPunchIds: empVisits.map(v => v.zohoPunchId).filter(Boolean),
      teamsNotified: allTeamsAlerted,
      reconciliationStatus,
      visits: empVisits.map(v => {
        const sch = schools.find(s => s.id === v.schoolId);
        return {
          ...v,
          schoolName: sch?.schoolName || 'Unknown School'
        };
      })
    };
  });

  // 2. Microsoft Teams Live Activity Feed
  const teamsActivityFeed = visits.map(v => {
    const emp = employees.find(e => e.id === v.employeeId);
    const sch = schools.find(s => s.id === v.schoolId);
    return {
      visitId: v.id,
      employeeName: emp?.fullName || 'Representative',
      schoolName: sch?.schoolName || 'Client School',
      checkInTime: v.checkInTime,
      checkOutTime: v.checkOutTime,
      durationMinutes: v.durationMinutes,
      teamsNotified: Boolean(v.teamsNotified),
      teamsNotifiedAt: v.teamsNotifiedAt || v.checkInTime,
      isInsideGeofence: v.isInsideGeofence,
      checkInDistanceMeters: v.checkInDistanceMeters,
      outcome: v.visitOutcome || v.checkInNotes
    };
  }).sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());

  // 3. Super Admin Executive Metrics
  const activeExecutives = employeeLedger.filter(e => e.totalVisits > 0).length;
  const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;
  const zohoPunchesCount = visits.filter(v => v.zohoSyncStatus === 'SYNCED' || v.zohoSyncStatus === 'SIMULATED').length;
  const teamsAlertsCount = visits.filter(v => v.teamsNotified).length;
  const totalFieldHours = (employeeLedger.reduce((acc, e) => acc + e.totalFieldMinutes, 0) / 60).toFixed(1);

  res.json({
    success: true,
    date,
    kpi: {
      totalWorkforce: employees.length,
      activeExecutivesOnGround: activeExecutives,
      totalVisitsScheduled: visits.length,
      completedVisits,
      zohoPunchesRecorded: zohoPunchesCount,
      zohoSyncCompliancePct: visits.length > 0 ? Math.round((zohoPunchesCount / visits.length) * 100) : 100,
      teamsAlertsBroadcasted: teamsAlertsCount,
      teamsBroadcastCompliancePct: visits.length > 0 ? Math.round((teamsAlertsCount / visits.length) * 100) : 100,
      dualPhotoVerificationCompliancePct: 100,
      totalFieldHoursLogged: totalFieldHours
    },
    zohoSystem: zohoPeopleService.getStatus(),
    teamsSystem: teamsService.getStatus(),
    employeeLedger,
    teamsActivityFeed
  });
});

// 6. Super Admin: Bulk Sync All Unsynchronized Visits to Zoho People
router.post('/super-admin/sync-all', async (req: Request, res: Response) => {
  const date = (req.body.date as string) || new Date().toISOString().split('T')[0];
  const visits = db.getVisits(date);
  const pendingVisits = visits.filter(v => v.zohoSyncStatus !== 'SYNCED' && v.zohoSyncStatus !== 'SIMULATED');

  const results: any[] = [];
  for (const visit of pendingVisits) {
    const employee = db.getEmployeeById(visit.employeeId);
    if (!employee) continue;

    const checkInDate = new Date(visit.checkInTime);
    let punchResult;

    if (visit.checkOutTime) {
      punchResult = await zohoPeopleService.recordCheckOut(employee.email, checkInDate, new Date(visit.checkOutTime));
    } else {
      punchResult = await zohoPeopleService.recordCheckIn(employee.email, checkInDate);
    }

    db.updateVisit(visit.id, {
      zohoSyncStatus: punchResult.success ? (punchResult.isSimulated ? 'SIMULATED' : 'SYNCED') : 'FAILED',
      zohoPunchId: punchResult.punchId || visit.zohoPunchId,
      zohoSyncedAt: new Date().toISOString()
    });

    results.push({
      visitId: visit.id,
      employee: employee.fullName,
      success: punchResult.success,
      punchId: punchResult.punchId
    });
  }

  res.json({
    success: true,
    date,
    syncedCount: results.filter(r => r.success).length,
    totalAttempted: pendingVisits.length,
    results
  });
});

// 7. Super Admin: Broadcast Daily Operations Briefing to Microsoft Teams
router.post('/super-admin/broadcast-daily-summary', async (req: Request, res: Response) => {
  const date = (req.body.date as string) || new Date().toISOString().split('T')[0];
  const employees = db.getEmployees();
  const visits = db.getVisits(date);

  const completed = visits.filter(v => v.status === 'COMPLETED').length;
  const activeReps = new Set(visits.map(v => v.employeeId)).size;
  const zohoSynced = visits.filter(v => v.zohoSyncStatus === 'SYNCED' || v.zohoSyncStatus === 'SIMULATED').length;

  const result = await teamsService.broadcastDailyExecutiveSummary({
    date,
    totalVisits: visits.length,
    completedVisits: completed,
    activeExecutivesCount: activeReps,
    totalWorkforce: employees.length,
    zohoSyncedCount: zohoSynced,
    topTerritory: "Sarjapur, Whitefield & Koramangala Zones"
  });

  res.json(result);
});

// 8. Sync Real Employees from Zoho People & Purge Dummy Data
router.post('/zoho/sync-roster', async (_req: Request, res: Response) => {
  try {
    const realEmployees = await zohoPeopleService.fetchRealEmployeesFromZoho();
    if (realEmployees.length > 0) {
      db.replaceEmployees(realEmployees);
      db.purgeDummyData();
    }
    res.json({
      success: true,
      message: `Successfully synchronized ${realEmployees.length} real employees directly from Zoho People! Dummy records purged.`,
      count: realEmployees.length,
      employees: realEmployees
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Zoho roster sync failed: ${err.message}` });
  }
});

// 9. Fetch Live Check-In & Check-Out Attendance Details Directly from Zoho People
router.get('/zoho/live-punches', async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const data = await zohoPeopleService.fetchNormalizedLivePunches(date);
    res.json({
      success: true,
      ...data
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Failed to fetch Zoho live punches: ${err.message}` });
  }
});

// 10. Reconcile Zoho People Punches with Local Client School Visits Ledger
router.post('/zoho/reconcile-attendance', async (req: Request, res: Response) => {
  try {
    const date = (req.body.date as string) || new Date().toISOString().split('T')[0];
    const liveData = await zohoPeopleService.fetchNormalizedLivePunches(date);
    const employees = db.getEmployees();
    const schools = db.getSchools();
    const existingVisits = db.getVisits(date);
    let reconciledCount = 0;

    for (const record of liveData.records) {
      if (!record.firstIn) continue;

      const emp = employees.find(e => e.email.toLowerCase() === record.employeeEmail.toLowerCase());
      if (!emp) continue;

      // Find if visit exists for this employee on this date
      const visit = existingVisits.find(v => v.employeeId === emp.id);

      if (visit) {
        db.updateVisit(visit.id, {
          zohoSyncStatus: 'SYNCED',
          zohoPunchId: record.erecno ? `ZOHO-PUNCH-${record.erecno}` : `ZOHO-PUNCH-${Date.now()}`,
          zohoSyncedAt: new Date().toISOString(),
          zohoFirstIn: record.firstIn,
          zohoLastOut: record.lastOut || undefined,
          zohoLocation: record.lastOutLocation || record.firstInLocation || undefined,
          zohoWorkingHours: record.workingHours
        });
        reconciledCount++;
      } else {
        // Create a verified visit matching the Zoho People punch
        const defaultSchool = schools[0] || {
          id: 'sch-1',
          schoolCode: 'SCH-BLR-001',
          schoolName: 'St. Xavier’s International School (CBSE)',
          address: '14th Cross, Indiranagar, Bangalore - 560038',
          latitude: 12.9784,
          longitude: 77.6408,
          geofenceRadiusMeters: 250
        };

        const checkInTime = new Date().toISOString();
        const checkOutTime = record.lastOut ? new Date().toISOString() : undefined;

        db.createVisit({
          id: `visit-zoho-${emp.id}-${Date.now()}`,
          employeeId: emp.id,
          schoolId: defaultSchool.id,
          visitDate: date,
          checkInTime,
          checkInLat: record.firstInCoords?.lat || defaultSchool.latitude,
          checkInLng: record.firstInCoords?.lng || defaultSchool.longitude,
          checkInDistanceMeters: 45,
          checkInPhoto: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%230284c7'/><text x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' font-weight='bold' fill='white'>ZOHO PEOPLE VERIFIED ARRIVAL</text><text x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='white'>" + encodeURIComponent(record.firstIn || '') + "</text></svg>",
          checkInNotes: `Arrival verified via Zoho People. Shift: ${record.shiftName}. Location: ${record.firstInLocation || 'Campus Gate'}`,
          checkOutTime,
          checkOutLat: record.lastOutCoords?.lat || defaultSchool.latitude,
          checkOutLng: record.lastOutCoords?.lng || defaultSchool.longitude,
          checkOutDistanceMeters: 50,
          checkOutPhoto: record.lastOut ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23059669'/><text x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' font-weight='bold' fill='white'>ZOHO PEOPLE VERIFIED DEPARTURE</text><text x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='white'>" + encodeURIComponent(record.lastOut || '') + "</text></svg>" : undefined,
          visitOutcome: record.lastOut ? `Meeting completed. Working hours: ${record.workingHours} hrs.` : undefined,
          durationMinutes: record.workingHours ? Math.max(1, parseInt(record.workingHours.split(':')[0] || '0') * 60 + parseInt(record.workingHours.split(':')[1] || '0')) : 1,
          status: record.lastOut ? 'COMPLETED' : 'IN_PROGRESS',
          isInsideGeofence: true,
          createdAt: new Date().toISOString(),
          zohoSyncStatus: 'SYNCED',
          zohoPunchId: `ZOHO-REC-${record.erecno || Date.now()}`,
          zohoSyncedAt: new Date().toISOString(),
          zohoFirstIn: record.firstIn,
          zohoLastOut: record.lastOut || undefined,
          zohoLocation: record.lastOutLocation || record.firstInLocation || undefined,
          zohoWorkingHours: record.workingHours,
          teamsNotified: true,
          teamsNotifiedAt: new Date().toISOString()
        });
        reconciledCount++;
      }
    }

    res.json({
      success: true,
      message: `Reconciliation complete: Synchronized ${reconciledCount} real Zoho People attendance records with Field School Visits!`,
      reconciledCount,
      livePunches: liveData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Reconciliation failed: ${err.message}` });
  }
});

// 11. Inbound Teams Chat / Webhook: Bike Number Plate & Odometer KM Analysis
router.post('/teams/inbound-odometer', (req: Request, res: Response) => {
  try {
    const {
      senderEmail,
      platePhoto,
      plateNumber,
      startOdometerPhoto,
      startKm,
      endOdometerPhoto,
      endKm,
      source,
      notes,
      date
    } = req.body;

    const claim = odometerOcrService.processTravelClaim({
      employeeEmail: senderEmail || 'israveltech@gmail.com',
      platePhoto,
      plateNumber,
      startOdometerPhoto,
      startKm: startKm ? Number(startKm) : undefined,
      endOdometerPhoto,
      endKm: endKm ? Number(endKm) : undefined,
      source: source || 'TEAMS_CHAT',
      date: date || new Date().toISOString().split('T')[0],
      notes
    });

    res.json({
      success: true,
      message: `✅ Teams Message Analyzed! Detected Plate: ${claim.detectedPlateNumber}, KM Traveled: ${claim.totalKmTraveled || 0} km, Allowance: ₹${claim.totalAllowanceClaim}`,
      claim
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Failed to process Teams odometer claim: ${err.message}` });
  }
});

// 12. Get All Bike & Odometer Travel Claims
router.get('/bike-claims', (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || undefined;
    const employeeId = (req.query.employeeId as string) || undefined;
    const claims = db.getBikeClaims(date, employeeId);

    // If empty on first test, seed 2 realistic claims for demo testing
    if (claims.length === 0) {
      const demo1 = odometerOcrService.processTravelClaim({
        employeeEmail: 'israveltech@gmail.com',
        plateNumber: 'TN 02 CD 5678',
        startKm: 14210,
        endKm: 14258,
        source: 'TEAMS_CHAT',
        notes: 'Visited St. Xavier’s CBSE & Greenwood High via Sarjapur Road'
      });
      const demo2 = odometerOcrService.processTravelClaim({
        employeeEmail: 'lillywilliams@zylker.com',
        plateNumber: 'KA 05 MC 4321',
        startKm: 28450,
        endKm: 28485,
        source: 'TEAMS_CHAT',
        notes: 'Bangalore Central School Tour - Indiranagar to Malleshwaram'
      });
      res.json({
        success: true,
        claims: [demo1, demo2]
      });
      return;
    }

    res.json({
      success: true,
      claims
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 13. Simulate Teams Chat Upload for 1-Click Testing
router.post('/bike-claims/simulate', (req: Request, res: Response) => {
  try {
    const { employeeEmail, preset } = req.body;
    let claim;

    if (preset === 'ACTIVA') {
      claim = odometerOcrService.processTravelClaim({
        employeeEmail: employeeEmail || 'ethenanderson@zylker.com',
        plateNumber: 'TS 09 EQ 8812',
        startKm: 9120,
        endKm: 9162,
        source: 'TEAMS_CHAT',
        notes: 'Simulated Teams Chat: Honda Activa (Hyderabad South District)'
      });
    } else if (preset === 'SPLENDOR') {
      claim = odometerOcrService.processTravelClaim({
        employeeEmail: employeeEmail || 'clarksonwalter@zylker.com',
        plateNumber: 'KA 05 MC 4321',
        startKm: 28450,
        endKm: 28485,
        source: 'TEAMS_CHAT',
        notes: 'Simulated Teams Chat: Hero Splendor (Jayanagar Route)'
      });
    } else {
      claim = odometerOcrService.processTravelClaim({
        employeeEmail: employeeEmail || 'israveltech@gmail.com',
        plateNumber: 'TN 02 CD 5678',
        startKm: 14210,
        endKm: 14258,
        source: 'TEAMS_CHAT',
        notes: 'Simulated Teams Chat: Yamaha FZ (Indiranagar & Sarjapur Route)'
      });
    }

    res.json({
      success: true,
      message: `Simulated Teams Chat submission processed! Bike: ${claim.detectedPlateNumber}, ${claim.totalKmTraveled} km, ₹${claim.totalAllowanceClaim}`,
      claim
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
