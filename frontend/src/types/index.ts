export type OrderCategory = 'food' | 'print' | 'notes' | 'ride' | 'others';
export type OrderStatus =
  | 'CREATED'
  | 'BROADCASTED'
  | 'ACCEPTED'
  | 'BID_SELECTED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';
export type OrderMode = 'fixed' | 'bidding';
export type OrderUrgency = 'normal' | 'asap';

export interface Location {
  type: 'Point';
  coordinates: [number, number];
  address?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  hostel?: string;
  phone?: string;
  role: 'student' | 'admin';
  isAvailable: boolean;
  isBanned?: boolean;
  rating: number;
  totalRatings: number;
  completedOrders: number;
  reliabilityScore: number;
  walletBalance: number;
  location?: Location;
  createdAt: string;
}

export interface Order {
  _id: string;
  userId: User;
  category: OrderCategory;
  description: string;
  budget?: number;
  mode: OrderMode;
  status: OrderStatus;
  urgency: OrderUrgency;
  location: Location;
  assignedTo?: User | null;
  bids?: Bid[];
  finalPrice?: number;
  isPriorityBoosted: boolean;
  statusHistory: { status: string; timestamp: string; note?: string }[];
  completedAt?: string;
  cancelReason?: string;
  isReviewedByCustomer: boolean;
  isReviewedByProvider: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  _id: string;
  orderId: string;
  userId: User;
  price: number;
  message?: string;
  estimatedTime?: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Review {
  _id: string;
  fromUser: User;
  toUser: User | string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  orderId: string;
  senderId: User;
  content: string;
  type: 'text' | 'system';
  readBy: string[];
  createdAt: string;
}

export interface WalletTransaction {
  _id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  orderId?: string;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'new_order' | 'new_bid' | 'order_accepted' | 'bid_accepted' | 'status_update' | 'new_message';
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const CATEGORY_META: Record<
  OrderCategory,
  { label: string; icon: string; color: string; bg: string }
> = {
  food: { label: 'Food & Tiffin', icon: '🍱', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  print: { label: 'Printouts', icon: '🖨️', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  notes: { label: 'Notes', icon: '📝', color: 'text-green-400', bg: 'bg-green-500/10' },
  ride: { label: 'Ride Share', icon: '🛵', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  others: { label: 'Others', icon: '📦', color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

export const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  CREATED: { label: 'Created', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  BROADCASTED: { label: 'Looking for provider', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ACCEPTED: { label: 'Accepted', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  BID_SELECTED: { label: 'Provider selected', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  DELIVERED: { label: 'Delivered', color: 'text-teal-400', bg: 'bg-teal-500/10' },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10' },
};
