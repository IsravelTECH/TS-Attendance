export type UserRole = 'SALES_DIRECTOR' | 'AREA_SALES_MANAGER' | 'SALES_EXECUTIVE' | 'FIELD_AGENT';

export type VisitStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FLAGGED_LOCATION' | 'CANCELLED';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  territory: string;
  designation: string;
  joiningDate: string;
  isActive: boolean;
  zohoErecno?: string;
}

export interface ClientSchool {
  id: string;
  schoolCode: string;
  schoolName: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  category: 'K-12' | 'CBSE' | 'ICSE' | 'INTERNATIONAL';
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  distanceMeters?: number;
  isInside?: boolean;
}

export interface SchoolVisit {
  id: string;
  employeeId: string;
  schoolId: string;
  visitDate: string;
  
  // Check-In
  checkInTime: string;
  checkInLat: number;
  checkInLng: number;
  checkInDistanceMeters: number;
  checkInPhoto: string;
  checkInNotes?: string;
  
  // Check-Out
  checkOutTime?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutDistanceMeters?: number;
  checkOutPhoto?: string;
  visitOutcome?: string;
  followUpDate?: string;
  
  durationMinutes?: number;
  status: VisitStatus;
  isInsideGeofence: boolean;

  // Zoho People & Microsoft Teams
  zohoSyncStatus?: 'SYNCED' | 'PENDING' | 'FAILED' | 'SIMULATED';
  zohoPunchId?: string;
  zohoSyncedAt?: string;
  zohoSyncError?: string;
  zohoFirstIn?: string;
  zohoLastOut?: string;
  zohoLocation?: string;
  zohoWorkingHours?: string;
  teamsNotified?: boolean;
  teamsNotifiedAt?: string;
  
  // Enriched
  salesRepName?: string;
  salesRepCode?: string;
  salesRepTerritory?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolContactPerson?: string;
  schoolPhone?: string;
}

export interface IntegrationStatus {
  service: string;
  enabled: boolean;
  configured: boolean;
  mode: string;
  accountsUrl?: string;
  apiUrl?: string;
  hasCachedToken?: boolean;
}

export interface IntegrationsOverview {
  success: boolean;
  timestamp: string;
  zoho: IntegrationStatus;
  teams: IntegrationStatus;
  metrics: {
    totalVisits: number;
    zohoSyncedCount: number;
    teamsNotifiedCount: number;
    pendingSyncCount: number;
  };
}

export interface FieldSummaryMetrics {
  totalVisitsToday: number;
  currentlyInMeeting: number;
  completedVisits: number;
  activeFieldExecutives: number;
  totalFieldSalesForce: number;
  averageMeetingDurationMinutes: number;
}

export interface SuperAdminKPI {
  totalWorkforce: number;
  activeExecutivesOnGround: number;
  totalVisitsScheduled: number;
  completedVisits: number;
  zohoPunchesRecorded: number;
  zohoSyncCompliancePct: number;
  teamsAlertsBroadcasted: number;
  teamsBroadcastCompliancePct: number;
  dualPhotoVerificationCompliancePct: number;
  totalFieldHoursLogged: string;
}

export interface SuperAdminEmployeeRow {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  role: UserRole;
  territory: string;
  designation: string;
  totalVisits: number;
  completedVisits: number;
  firstCheckIn: string | null;
  lastCheckOut: string | null;
  totalFieldMinutes: number;
  zohoStatus: 'SYNCED' | 'SIMULATED' | 'FAILED' | 'PENDING' | 'NOT_APPLICABLE';
  zohoPunchIds: string[];
  teamsNotified: boolean;
  reconciliationStatus: 'PERFECTLY_ALIGNED' | 'ZOHO_SYNC_PENDING' | 'TEAMS_BROADCAST_PENDING' | 'OFFICE_OR_LEAVE';
  visits: Array<SchoolVisit & { schoolName: string }>;
}

export interface TeamsActivityFeedItem {
  visitId: string;
  employeeName: string;
  schoolName: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  teamsNotified: boolean;
  teamsNotifiedAt: string;
  isInsideGeofence: boolean;
  checkInDistanceMeters: number;
  outcome?: string;
}

export interface SuperAdminOverview {
  success: boolean;
  date: string;
  kpi: SuperAdminKPI;
  zohoSystem: IntegrationStatus;
  teamsSystem: IntegrationStatus;
  employeeLedger: SuperAdminEmployeeRow[];
  teamsActivityFeed: TeamsActivityFeedItem[];
}

export interface ZohoLivePunchRecord {
  employeeEmail: string;
  fullName: string;
  erecno: string;
  date: string;
  firstIn: string | null;
  lastOut: string | null;
  totalHours: string;
  workingHours: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  lateIn: string;
  earlyOut: string;
  firstInLocation: string | null;
  lastOutLocation: string | null;
  firstInCoords: { lat: number; lng: number } | null;
  lastOutCoords: { lat: number; lng: number } | null;
  status: 'PRESENT' | 'ABSENT' | 'IN_PROGRESS';
}

export interface ZohoLiveAttendanceResponse {
  success: boolean;
  date: string;
  totalEmployees: number;
  presentCount: number;
  inProgressCount: number;
  absentCount: number;
  records: ZohoLivePunchRecord[];
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
  ratePerKm: number;
  totalAllowanceClaim: number;
  source: 'TEAMS_CHAT' | 'DIRECT_UPLOAD' | 'WEBHOOK';
  status: 'ANALYZED' | 'VERIFIED' | 'FLAGGED';
  notes?: string;
  createdAt: string;
}
