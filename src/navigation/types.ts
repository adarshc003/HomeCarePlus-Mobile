export type RootStackParamList = {
  Splash: undefined;

  Home: undefined;

  // navigation.navigate('Login') (no params, e.g. from HomeHeader) and
  // navigation.navigate('Login', {redirectTo: '...'}) (e.g. from
  // AddressScreen/ScheduleScreen when an unauthenticated user reaches a
  // login-gated step) are both real call sites — undefined here didn't
  // reflect either the optional or the object-param shape actually in use.
  Login: {redirectTo?: string} | undefined;

  Otp: {
    phone: string;
    confirmation: any;
    redirectTo?: string;
  };

  ServiceDetails: {
    service: any;
  };

  AddOn: undefined;

  Address: undefined;

  Schedule: undefined;

  BookingSummary: undefined;

  // Real call site: BookingSummaryScreen.handleConfirmBooking().
  Payment: {
    appliedOffer?: any;
    originalAmount?: number;
    discountAmount?: number;
    finalAmount?: number;
  } | undefined;

  // Real call sites: PaymentScreen's ONLINE/COD completion paths.
  BookingSuccess: {
    paymentMethod?: string;
    paymentStatus?: string;
  } | undefined;

  MyBookings: undefined;

  BookingDetails: {
    bookingNumber: string;
  };

  Profile: undefined;

  Language: undefined;

  Notifications: undefined;

  PrivacyPolicy: undefined;

  HelpSupport: undefined;
};