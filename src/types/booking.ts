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
    label?: string;
    fullAddress: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    landmark?: string;
    notes?: string;
  };

  bookingContactName?: string;

  bookingContactPhone?: string;

  timeSlot?: string;

  // Item 3 (ERP): broadcast/acceptance-timeout tracking
  broadcastedAt?: string;

  expiresAt?: string;

  cancellationReason?: string;

  // Immutable copy of service/package/add-on names + prices at booking
  // time — always prefer this over the live service/package/addOns
  // relations when displaying a historical booking.
  priceSnapshot?: {
    serviceName?: {en?: string; ar?: string};
    packageName?: {en?: string; ar?: string} | null;
    packagePrice?: number | null;
    addOns?: Array<{
      id: string;
      nameEn: string;
      nameAr: string;
      price: number;
      durationEn?: string;
      durationAr?: string;
    }>;
    originalAmount?: number;
    discountAmount?: number;
    finalAmount?: number;
    taxAmount?: number;
  };

  technician?: any;

  createdAt?: string;

  completedAt?: string;

  reviewSubmitted?: boolean;

  rating?: number;

  review?: string;
}
