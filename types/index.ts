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

