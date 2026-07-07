import {create} from 'zustand';

export interface Offer {
  _id: string;

  title: {
    en: string;
    ar: string;
  };

  description: {
    en: string;
    ar: string;
  };

  couponCode: string;

  discountType: string;

  discountValue: number;

  discount: number;
}

interface OfferState {
  availableOffers: Offer[];

  selectedOffer: Offer | null;

  couponCode: string;

  originalAmount: number;

  discountAmount: number;

  finalAmount: number;

  loading: boolean;

  setAvailableOffers: (
    offers: Offer[],
  ) => void;

  selectOffer: (
    offer: Offer | null,
  ) => void;

  setCouponCode: (
    code: string,
  ) => void;

  setPriceSummary: (
    original: number,
    discount: number,
    finalAmount: number,
  ) => void;

  setLoading: (
    value: boolean,
  ) => void;

  clearOffer: () => void;
}

export const useOfferStore =
  create<OfferState>(set => ({

    availableOffers: [],

    selectedOffer: null,

    couponCode: '',

    originalAmount: 0,

    discountAmount: 0,

    finalAmount: 0,

    loading: false,

    setAvailableOffers: offers =>
      set({
        availableOffers: offers,
      }),

    selectOffer: offer =>
      set({
        selectedOffer: offer,
      }),

    setCouponCode: couponCode =>
      set({
        couponCode,
      }),

    setPriceSummary: (
      originalAmount,
      discountAmount,
      finalAmount,
    ) =>
      set({
        originalAmount,
        discountAmount,
        finalAmount,
      }),

    setLoading: loading =>
      set({
        loading,
      }),

    clearOffer: () =>
      set({
        selectedOffer: null,

        couponCode: '',

        originalAmount: 0,

        discountAmount: 0,

        finalAmount: 0,
      }),

  }));