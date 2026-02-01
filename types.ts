
export enum IssueType {
  ENGINE_FAILURE = 'ENGINE_FAILURE',
  TYRE_PUNCTURE = 'TYRE_PUNCTURE',
  BATTERY_ISSUE = 'BATTERY_ISSUE',
  ACCIDENT = 'ACCIDENT',
  GENERAL_ASSISTANCE = 'GENERAL_ASSISTANCE',
  UNKNOWN = 'UNKNOWN'
}

export enum RequestStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  CONFIRMING = 'CONFIRMING',
  REQUESTED = 'REQUESTED',
  ASSIGNED = 'ASSIGNED',
  ON_THE_WAY = 'ON_THE_WAY',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface ExtractionResult {
  issueType: IssueType;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  locationText?: string;
  isAccident: boolean;
}

export interface Mechanic {
  id: string;
  name: string;
  phone: string;
  rating: number;
  location: Location;
  vehicle: string;
  isAvailable: boolean;
}

export interface AssistanceRequest {
  id: string;
  userId: string;
  status: RequestStatus;
  issue: ExtractionResult;
  userLocation: Location;
  mechanic?: Mechanic;
  createdAt: number;
}
