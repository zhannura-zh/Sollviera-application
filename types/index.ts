export type Language = 'EN' | 'RU';

export type ShiftStatus = 'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED';

export type CleanerRole = 'CLEANER' | 'SENIOR_CLEANER' | 'SUPERVISOR' | 'TECHNICIAN' | 'WAITER';

export interface CleanerProfile {
  id: string;
  badgeId: string;
  fullName: string;
  fullNameRu: string;
  email: string;
  avatarUrl: string;
  role: CleanerRole;
  floorAssigned: string;
  currentShift: {
    shiftNumber: string;
    date: string;
    startTime: string;
    status: ShiftStatus;
    roomsCompleted: number;
    roomsTotal: number;
    avgTimePerRoom: string; // e.g. "22 min"
  };
  supervisor: {
    name: string;
    phone: string;
    role: string;
    avatarUrl: string;
  };
}

export interface ShiftHistoryItem {
  id: string;
  shiftNumber: string;
  date: string;
  hoursWorked: string;
  roomsCleaned: number;
  qualityScore: number; // e.g., 98 for 98%
  notes?: string;
  notesRu?: string;
}

export interface SupervisorMessage {
  id: string;
  timestamp: string;
  category: 'LINEN' | 'MAINTENANCE' | 'INSPECTION' | 'URGENT';
  roomNumber?: string;
  message: string;
  status: 'SENT' | 'RECEIVED' | 'RESOLVED';
}

export type RoomStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'PROBLEM' | 'VERIFIED';
export type CleaningType = 'CHECKOUT' | 'STAYOVER' | 'DEEP_CLEAN' | 'AFTER_MAINTENANCE';
export type RoomPriority = 'VIP' | 'URGENT' | 'NORMAL';

export type ChecklistZone = 'BEDROOM' | 'BATHROOM' | 'MINIBAR' | 'BALCONY' | 'OTHER';

export interface RoomCheckitem {
  id: string;
  textEn: string;
  textRu: string;
  done: boolean;
  zone: ChecklistZone;
  photoUrl?: string;
  comment?: string;
  isOptional?: boolean;
}

export interface HotelRoom {
  id: string;
  physicalRoomId?: string;
  roomNumber: string;
  floor: number;
  category: string;
  status: RoomStatus;
  cleaningType: CleaningType;
  priority: RoomPriority;
  checkoutTime: string;
  checkinTime: string;
  adults: number;
  children: number;
  deadline: string;
  isOverdue?: boolean;
  notesEn?: string;
  notesRu?: string;
  checklist: RoomCheckitem[];
  startTime?: string;
  endTime?: string;
  assignedTo?: string;
}

// Rejected-inspection log — session-local only (there's no persisted "rejected" state on
// the backend distinct from a plain PENDING room; see rejectRoomInspection in app-store.tsx).
export interface RejectedInspection {
  id: string;
  roomId: string;
  roomNumber: string;
  note: string;
  timestamp: string;
  assignedTo?: string;
}

// Backed by the real /parking/spots and /parking/tickets endpoints (see checkInVehicle/
// checkOutVehicle and mapParkingSpot/mapParkingSession in app-store.tsx). ParkingSession
// maps a ticket with status "OPEN" — the API has no separate checked-in boolean.
export interface ParkingSpot {
  id: string;
  code: string;
  zone: string;
}

export interface ParkingSession {
  id: string;
  spotId: string;
  plate: string;
  guestName: string;
  note?: string;
  checkedInAt: string;
}

export interface StaffMember {
  id: string;
  fullName: string;
  department?: string;
  roleCode?: string;
  phone?: string;
  shiftStatus?: string;
  isActive: boolean;
}

export type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'FURNITURE' | 'APPLIANCES' | 'CLEANLINESS' | 'OTHER';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MaintenanceStatus = 'CREATED' | 'IN_PROGRESS' | 'RESOLVED';

export interface MaintenanceRequest {
  id: string;
  roomNumber: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
  descriptionRu?: string;
  descriptionEn?: string;
  audioUrl?: string;
  photoUrl?: string;
  blocksCleaning: boolean;
  status: MaintenanceStatus;
  timestamp: string;
  isGuestDamage?: boolean;
  guestDamageType?: string;
  repairCost?: number;
  repairComment?: string;
  costCalculated?: boolean;
  comments?: string[];
  materials?: { id: string; nameEn: string; nameRu: string; qty: number }[];
  photosBefore?: string[];
  photosAfter?: string[];
  steps?: MaintenanceStep[];
  floor?: number;
  roomCategory?: string;
  startedAt?: string;
  reportedBy?: string;
  assignedToName?: string;
}

export interface MaintenanceStep {
  id: string;
  textRu: string;
  textEn: string;
  done: boolean;
}

export type PartCategory = 'PLUMBING' | 'ELECTRICAL' | 'CONSUMABLES';

export interface PartItem {
  id: string;
  nameEn: string;
  nameRu: string;
  code: string;
  category: PartCategory;
  currentStock: number;
  normStock: number;
  orderQty: number;
}

export interface PartOrder {
  id: string;
  titleEn: string;
  titleRu: string;
  subEn: string;
  subRu: string;
  status: string;
  createdAt: string;
}

export interface SupplyItem {
  id: string;
  nameEn: string;
  nameRu: string;
  category: 'LINEN' | 'TOWELS' | 'AMENITIES' | 'CLEANING' | 'MINIBAR';
  trolleyQty: number;
  neededQty: number;
  unit: string;
  requestedQty: number;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  messageEn: string;
  messageRu: string;
  category: 'NEW_ROOM' | 'URGENT' | 'SYSTEM' | 'SUPERVISOR';
  isRead: boolean;
  subtitleEn?: string;
  subtitleRu?: string;
}
