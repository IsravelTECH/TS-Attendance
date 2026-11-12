import { Router, Response } from 'express';
import { db } from '../data/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { calculateDistanceMeters } from '../services/geofence.service';
import { ClientSchool } from '../types';

const router = Router();

// Get all client schools
router.get('/', authenticate, (_req, res: Response) => {
  res.json({
    success: true,
    schools: db.getSchools()
  });
});

// Get nearby schools based on sales rep's current GPS coordinates
router.get('/nearby', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { latitude, longitude } = req.query;

  const schools = db.getSchools();
  if (!latitude || !longitude) {
    res.json({ success: true, schools });
    return;
  }

  const userLat = Number(latitude);
  const userLng = Number(longitude);

  const enriched = schools.map(s => {
    const distanceMeters = Math.round(calculateDistanceMeters(userLat, userLng, s.latitude, s.longitude));
    const isInside = distanceMeters <= s.geofenceRadiusMeters;
    return {
      ...s,
      distanceMeters,
      isInside
    };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);

  res.json({
    success: true,
    userLocation: { latitude: userLat, longitude: userLng },
    schools: enriched
  });
});

// Add new client school to directory
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { schoolName, address, contactPerson, contactPhone, contactEmail, category, latitude, longitude, geofenceRadiusMeters } = req.body;

  if (!schoolName || !latitude || !longitude) {
    res.status(400).json({ success: false, message: 'schoolName, latitude, and longitude are required.' });
    return;
  }

  const newSchool: ClientSchool = {
    id: `sch-${Date.now()}`,
    schoolCode: `SCH-BLR-${Date.now().toString().slice(-3)}`,
    schoolName,
    address: address || '',
    contactPerson: contactPerson || 'Principal / Administrator',
    contactPhone: contactPhone || '',
    contactEmail: contactEmail || '',
    category: category || 'CBSE',
    latitude: Number(latitude),
    longitude: Number(longitude),
    geofenceRadiusMeters: Number(geofenceRadiusMeters) || 200
  };

  const created = db.createSchool(newSchool);

  res.json({
    success: true,
    message: 'Client school added to visit directory.',
    school: created
  });
});

export default router;
