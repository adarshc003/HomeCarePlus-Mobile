export interface Booking {
  id?: string;

  _id?: string;

  bookingNumber: string;

  service?: any;

  status: string;

  customer?: string;

  package?: any;

  addOns?: any[];

  qrToken?: string;

  qrVerified?: boolean;

  bookingDate: string;

  totalAmount?: number;

  finalAmount?: number;

  originalAmount?: number;

  discountAmount?: number;

  paymentMethod: string;

  paymentStatus: string;

  paidAt?: string;

  address?: {
    fullAddress: string;
    latitude?: number;
    longitude?: number;
  };

  technician?: any;

  createdAt?: string;

  completedAt?: string;

  reviewSubmitted?: boolean;

  rating?: number;

  review?: string;
}
