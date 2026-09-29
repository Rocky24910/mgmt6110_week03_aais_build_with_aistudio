export type HealthStatus = 'Normal' | 'Warning' | 'Critical' | 'Flagged';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueCategory =
  | 'pH Spike (Alkaline Drift)'
  | 'pH Drop (Acidic Drift)'
  | 'EC Nutrient Depletion'
  | 'EC Salt Concentration'
  | 'Doser Pump Failure'
  | 'Water Temp Anomaly'
  | 'Dissolved Oxygen Depletion'
  | 'Sensor Drift / Desync'
  | 'Root Zone Drainage Block'
  | 'Lighting Schedule Misalignment';

export interface TrendReading {
  time: string;
  pH: number;
  ec: number;
  temp: number;
}

export interface BayFlag {
  flagId: string;
  flaggedAt: string;
  technicianName: string;
  category: IssueCategory;
  priority: PriorityLevel;
  notes: string;
  actionRequired: string;
  assignedTeam: string;
  resolved: boolean;
}

export interface BayDraft {
  category: IssueCategory;
  priority: PriorityLevel;
  notes: string;
  actionRequired: string;
  assignedTeam: string;
  isDirty?: boolean;
}

export interface HydroBay {
  id: string; // e.g. "BAY-01"
  name: string;
  cropType: string;
  cropVariety: string;
  growthStage: string;
  plantedDate: string;
  harvestEta: string;
  
  // Real-time sensor metrics
  pH: number;
  targetPhMin: number;
  targetPhMax: number;
  
  ec: number; // in mS/cm
  targetEcMin: number;
  targetEcMax: number;
  
  waterTemp: number; // in °C
  targetTempMin: number;
  targetTempMax: number;
  
  dissolvedOxygen: number; // in mg/L
  waterLevelPct: number; // Reservoir water level %
  flowRateLpm: number; // Liters per minute
  
  severity?: 'Normal' | 'Warning' | 'Critical';
  status: HealthStatus;
  statusMessage: string;
  lastUpdated: string;
  
  // Telemetry & Logs
  trendHistory: TrendReading[];
  activeFlag?: BayFlag | null;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  technician: string;
  actionType: 'FLAG_CREATED' | 'FLAG_UPDATED' | 'FLAG_RESOLVED' | 'SYSTEM_ALERT' | 'HANDOVER_CONFIRMED' | 'CALIBRATION';
  bayId?: string;
  details: string;
}

export interface ShiftInfo {
  shiftId: string;
  shiftName: string;
  facilityName: string;
  facilityZone: string;
  outgoingLead: string;
  incomingTeam: string;
  shiftDate: string;
  shiftTimeWindow: string;
  isLocked: boolean;
  lockedAt?: string;
  confirmationAlertDispatched?: boolean;
}

export interface HandoverChecklistItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
}
