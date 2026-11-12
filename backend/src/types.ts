export type UserRole = 'SALES_DIRECTOR' | 'AREA_SALES_MANAGER' | 'SALES_EXECUTIVE' | 'FIELD_AGENT';

export type VisitStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FLAGGED_LOCATION' | 'CANCELLED';

export type ZohoSyncStatus = 'SYNCED' | 'PENDING' | 'FAILED' | 'SIMULATED';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  territory: string; // e.g. "Bangalore South - School District"
  designation: string;
  joiningDate: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  zohoErecno?: string;
}

export interface ClientSchool {
  id: string;
  schoolCode: string;
  schoolName: string;
  address: string;
  contactPerson: string; // e.g. "Dr. Aruna (Principal)"
  contactPhone: string;
  contactEmail: string;
  category: 'K-12' | 'CBSE' | 'ICSE' | 'INTERNATIONAL';
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number; // e.g. 200m
}

export interface SchoolVisit {
  id: string;
  employeeId: string;
  schoolId: string;
  visitDate: string; // YYYY-MM-DD
  
  // Check-In Details
  checkInTime: string; // ISO
  checkInLat: number;
  checkInLng: number;
  checkInDistanceMeters: number;
  checkInPhoto: string; // Base64 data URL or photo URL
  checkInNotes?: string;
  
  // Check-Out Details
  checkOutTime?: string; // ISO
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutDistanceMeters?: number;
  checkOutPhoto?: string; // Base64 data URL or photo URL
  visitOutcome?: string; // e.g. "Met Principal. Demo scheduled for Friday."
  followUpDate?: string; // YYYY-MM-DD
  
  // Operational Metrics
  durationMinutes?: number;
  status: VisitStatus;
  isInsideGeofence: boolean;
  createdAt: string;

  // Zoho People & Teams Integration Tracking
  zohoSyncStatus?: ZohoSyncStatus;
  zohoPunchId?: string;
  zohoSyncedAt?: string;
  zohoSyncError?: string;
  zohoFirstIn?: string;
  zohoLastOut?: string;
  zohoLocation?: string;
  zohoWorkingHours?: string;
  teamsNotified?: boolean;
  teamsNotifiedAt?: string;
}

export interface DailyVisitSummary {
  date: string;
  totalVisits: number;
  inProgressVisits: number;
  completedVisits: number;
  activeExecutivesCount: number;
  averageDurationMinutes: number;
}

export interface BikeOdometerRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  date: string;
  bikeNumberPlatePhoto: string;
  detectedPlateNumber: string;
  plateConfidence: number;
  startOdometerPhoto?: string;
  startKm?: number;
  startTime?: string;
  endOdometerPhoto?: string;
  endKm?: number;
  endTime?: string;
  totalKmTraveled?: number;
  ratePerKm: number; // e.g. 3.5 (INR)
  totalAllowanceClaim: number;
  source: 'TEAMS_CHAT' | 'DIRECT_UPLOAD' | 'WEBHOOK';
  status: 'ANALYZED' | 'VERIFIED' | 'FLAGGED';
  notes?: string;
  createdAt: string;
}
