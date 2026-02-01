
import { Mechanic, IssueType } from './types';

export const MOCK_MECHANICS: Mechanic[] = [
  {
    id: 'm1',
    name: 'John Miller',
    phone: '+1 555-0101',
    rating: 4.8,
    location: { lat: 34.0522, lng: -118.2437 },
    vehicle: 'Yellow Tow Truck (ABC-123)',
    isAvailable: true
  },
  {
    id: 'm2',
    name: 'Sarah Chen',
    phone: '+1 555-0102',
    rating: 4.9,
    location: { lat: 34.0622, lng: -118.2537 },
    vehicle: 'Silver Service Van (XYZ-789)',
    isAvailable: true
  },
  {
    id: 'm3',
    name: 'Mike Ross',
    phone: '+1 555-0103',
    rating: 4.7,
    location: { lat: 34.0422, lng: -118.2337 },
    vehicle: 'Black Rapid Response (RAP-001)',
    isAvailable: false
  }
];

export const ISSUE_CONFIG = {
  [IssueType.ENGINE_FAILURE]: { label: 'Engine Failure', icon: 'fa-engine-warning', color: 'text-red-600' },
  [IssueType.TYRE_PUNCTURE]: { label: 'Flat Tyre', icon: 'fa-tire', color: 'text-orange-500' },
  [IssueType.BATTERY_ISSUE]: { label: 'Dead Battery', icon: 'fa-battery-bolt', color: 'text-yellow-600' },
  [IssueType.ACCIDENT]: { label: 'Accident', icon: 'fa-car-burst', color: 'text-red-700' },
  [IssueType.GENERAL_ASSISTANCE]: { label: 'General Help', icon: 'fa-info-circle', color: 'text-blue-600' },
  [IssueType.UNKNOWN]: { label: 'Analyzing...', icon: 'fa-spinner', color: 'text-gray-400' },
};
