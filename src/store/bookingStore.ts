import {create} from 'zustand';
import {Booking} from '../types/booking';

import {Service} from '../types/service';

export type SelectedService = Service;

interface BookingState {
  selectedService: SelectedService | null;

  selectedPackage: any | null;

  selectedAddOns: any[];

  customerName: string;

  primaryPhone: string;

  secondaryPhone: string;

  address: string;

  latitude: number | null;

  longitude: number | null;

  selectedDate: string;

  selectedTimeSlot: string;

  selectedSlotStartHour: number | null;

  setSelectedService: (
    service: SelectedService,
  ) => void;

  setSelectedPackage: (
    pkg: any,
  ) => void;

  setSelectedAddOns: (
    addOns: any[],
  ) => void;

  setCustomerName: (
    name: string,
  ) => void;

  setPrimaryPhone: (
    phone: string,
  ) => void;

  setSecondaryPhone: (
    phone: string,
  ) => void;

  setAddress: (
    address: string,
  ) => void;

  setCoordinates: (
    latitude: number,
    longitude: number,
  ) => void;

  setSelectedDate: (
    date: string,
  ) => void;

  setSelectedTimeSlot: (
    slot: string,
  ) => void;

  setSelectedSlotStartHour: (
    hour: number | null,
  ) => void;

  clearBooking: () => void;

  bookings: Booking[];

setBookings: (
  bookings: Booking[],
) => void;

updateBooking: (
  booking: Booking,
) => void;
}

export const useBookingStore =
  create<BookingState>(set => ({
    selectedService: null,

    selectedPackage: null,

    selectedAddOns: [],

    customerName: '',

    primaryPhone: '',

    secondaryPhone: '',

    address: '',

    latitude: null,

    longitude: null,

    selectedDate: '',

    selectedTimeSlot: '',

    selectedSlotStartHour: null,

    bookings: [],

    setSelectedService: service =>
      set({
        selectedService: service,
      }),

    setSelectedPackage: pkg =>
      set({
        selectedPackage: pkg,
      }),

    setSelectedAddOns: addOns =>
      set({
        selectedAddOns: addOns,
      }),

    setCustomerName: name =>
      set({
        customerName: name,
      }),

    setPrimaryPhone: phone =>
      set({
        primaryPhone: phone,
      }),

    setSecondaryPhone: phone =>
      set({
        secondaryPhone: phone,
      }),

    setAddress: address =>
      set({
        address,
      }),

    setCoordinates: (
      latitude,
      longitude,
    ) =>
      set({
        latitude,
        longitude,
      }),

    setSelectedDate: date =>
      set({
        selectedDate: date,
      }),

    setSelectedTimeSlot: slot =>
      set({
        selectedTimeSlot: slot,
      }),

    setSelectedSlotStartHour: hour =>
      set({
        selectedSlotStartHour: hour,
      }),

      setBookings: bookings =>
  set({
    bookings,
  }),

updateBooking: booking =>
  set(state => ({
    bookings: state.bookings.map(item =>
      item.bookingNumber === booking.bookingNumber
        ? booking
        : item,
    ),
  })),

    clearBooking: () =>
      set({
        selectedService: null,

        selectedPackage: null,

        selectedAddOns: [],

        customerName: '',

        primaryPhone: '',

        secondaryPhone: '',

        address: '',

        latitude: null,

        longitude: null,

        selectedDate: '',

        selectedTimeSlot: '',

        selectedSlotStartHour: null,
      }),
  }));