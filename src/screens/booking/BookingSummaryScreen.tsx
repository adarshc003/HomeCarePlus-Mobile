import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import {useBookingStore}
from '../../store/bookingStore';

import {useLanguageStore}
from '../../store/languageStore';

import {t}
from '../../i18n';

import {Fonts}
from '../../constants/fonts';

import {getLocalizedText}
from '../../utils/getLocalizedText';

import {
  applyOffer,
  getEligibleOffers,
} from '../../services/offerService';

import {useAppDataStore}
from '../../store/appDataStore';

import {
  useOfferStore,
} from '../../store/offerStore';

import AvailableOffersCard
from '../../components/offers/AvailableOffersCard';

import CouponBottomSheet
from '../../components/offers/CouponBottomSheet';

import PriceSummaryCard
from '../../components/offers/PriceSummaryCard';


const BookingSummaryScreen = ({
  navigation,
}: any) => {
  const [loading] =
    useState(false);

  const [
    offerModalVisible,
    setOfferModalVisible,
  ] = useState(false);

  const language =
    useLanguageStore(
      state => state.language,
    );

  const cachedOffers =
    useAppDataStore(
      state => state.offers,
    );

  const setCachedOffers =
    useAppDataStore(
      state => state.setOffers,
    );

  const offersLoading =
    useAppDataStore(
      state => state.offersLoading,
    );

  const setOffersLoading =
    useAppDataStore(
      state => state.setOffersLoading,
    );

  const {
    availableOffers,
    selectedOffer,
    originalAmount,
    discountAmount,
    finalAmount,
    setAvailableOffers,
    selectOffer,
    setPriceSummary,
    clearOffer,
  } = useOfferStore();

  const selectedService =
    useBookingStore(
      state => state.selectedService,
    );

  const selectedPackage =
    useBookingStore(
      state => state.selectedPackage,
    );

  const selectedAddOns =
    useBookingStore(
      state => state.selectedAddOns,
    );

  const address =
    useBookingStore(
      state => state.address,
    );

  const selectedDate =
    useBookingStore(
      state => state.selectedDate,
    );

  const selectedTimeSlot =
    useBookingStore(
      state => state.selectedTimeSlot,
    );

  const addOnTotal =
    selectedAddOns.reduce(
      (total, item) => total + item.price,
      0,
    );

  const packagePrice =
    selectedPackage?.offerPrice || 0;

  const totalAmount =
    packagePrice + addOnTotal;

  useEffect(() => {
    setAvailableOffers(cachedOffers);
  }, [cachedOffers]);

  useEffect(() => {
    if (selectedOffer) {
      return;
    }

    setPriceSummary(totalAmount, 0, totalAmount);
  }, [totalAmount, selectedOffer]);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    if (cachedOffers.length > 0 || !selectedService) {
      return;
    }

    try {
      setOffersLoading(true);

      const response = await getEligibleOffers(
        selectedService.id,
        totalAmount,
      );

      setCachedOffers(response.offers || []);
    } catch (error) {
      console.log('Offer Load Error', error);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleApplyOffer = async (offer: any) => {
    if (!selectedService) {
      return;
    }

    try {
      const response = await applyOffer({
        offerId: offer._id,
        serviceId: selectedService.id,
        bookingAmount: totalAmount,
      });

      selectOffer(response.offer);

      setPriceSummary(
        response.originalAmount,
        response.discountAmount,
        response.finalAmount,
      );

      setOfferModalVisible(false);
    } catch (error: any) {
      Alert.alert(
        t('coupon', language),
        error?.response?.data?.message ||
          t('unableToApplyCoupon', language),
      );
    }
  };

  const handleApplyCoupon = async (couponCode: string) => {
    if (!couponCode.trim() || !selectedService) {
      return;
    }

    try {
      const response = await applyOffer({
        couponCode,
        serviceId: selectedService.id,
        bookingAmount: totalAmount,
      });

      selectOffer(response.offer);

      setPriceSummary(
        response.originalAmount,
        response.discountAmount,
        response.finalAmount,
      );

      setOfferModalVisible(false);
    } catch (error: any) {
      Alert.alert(
        t('coupon', language),
        error?.response?.data?.message ||
          t('unableToApplyCoupon', language),
      );
    }
  };

  const handleConfirmBooking = () => {
    navigation.navigate('Payment', {
      appliedOffer: selectedOffer,
      originalAmount,
      discountAmount,
      finalAmount,
    });
  };

  const handleRemoveCoupon = () => {
    clearOffer();
    setPriceSummary(totalAmount, 0, totalAmount);
  };

  const packageAmount = selectedPackage?.offerPrice || 0;

  const addOnAmount = selectedAddOns.reduce(
    (total: number, item: any) => total + item.price,
    0,
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerContainer}>
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Text style={styles.backArrow}>
                ‹
              </Text>
            </TouchableOpacity>

            <Text style={styles.heading}>
              {t('Reviewbooking', language)}
            </Text>
          </View>

          <Text style={styles.headerSubtext}>
            {language === 'ar'
              ? selectedService?.name.ar
              : selectedService?.name.en}
          </Text>

          <Text style={styles.serviceSubTitle}>
            {t('confirmServiceDetailsSubtitle', language)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📋{' '}
            {t('serviceDetails', language)}
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              {t('service', language)}
            </Text>
            <Text style={styles.value}>
              {language === 'ar'
                ? selectedService?.name.ar
                : selectedService?.name.en}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              {t('option', language)}
            </Text>
            <Text style={styles.value}>
              {getLocalizedText(selectedPackage?.name, language)}
            </Text>
          </View>

          <Text style={[styles.label, {marginBottom: 8}]}>
            {t('address', language)}
          </Text>

          <View style={styles.addressCard}>
            <Text style={styles.addressIcon}>
              📍
            </Text>
            <Text style={styles.addressText}>
              {address}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              {t('date', language)}
            </Text>
            <Text style={styles.value}>
              {selectedDate}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              {t('time', language)}
            </Text>
            <Text style={styles.value}>
              {selectedTimeSlot}
            </Text>
          </View>

          <Text style={[styles.label, {marginBottom: 10}]}>
            {t('addons', language)}
          </Text>

          <View style={styles.addonContainer}>
            {selectedAddOns.length > 0 ? (
              selectedAddOns.map(item => (
                <View key={item.id} style={styles.addonChip}>
                  <Text style={styles.addonChipText}>
                    {getLocalizedText(item.name, language)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.smallText}>
                {t('noAddOns', language)}
              </Text>
            )}
          </View>
        </View>

        {offersLoading && cachedOffers.length === 0 && (
          <Text style={{textAlign: 'center', marginVertical: 16, fontFamily: Fonts.medium}}>
            {t('loadingOffers', language)}
          </Text>
        )}

        <AvailableOffersCard
          offers={availableOffers}
          selectedOffer={selectedOffer}
          onViewAll={() => setOfferModalVisible(true)}
          onApply={handleApplyOffer}
          onRemove={handleRemoveCoupon}
        />

        <PriceSummaryCard
          packageAmount={packageAmount}
          addOnAmount={addOnAmount}
          subtotal={packageAmount + addOnAmount}
          originalAmount={originalAmount}
          discountAmount={discountAmount}
          finalAmount={finalAmount}
          selectedOffer={selectedOffer}
          onRemoveCoupon={handleRemoveCoupon}
        />

      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleConfirmBooking}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {t('continueToPayment', language)}
          </Text>
        </TouchableOpacity>
      </View>

      <CouponBottomSheet
        visible={offerModalVisible}
        offers={availableOffers}
        selectedOffer={selectedOffer}
        onClose={() => setOfferModalVisible(false)}
        onApply={handleApplyOffer}
        onApplyCoupon={handleApplyCoupon}
        onRemove={handleRemoveCoupon}
      />

    </View>
  );
};

export default BookingSummaryScreen;

const styles =
  StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#F8FAFC',
  paddingTop: 18,
},
heading: {
  flex: 1,
  fontSize: 28,
  color: '#0F172A',
  fontFamily: Fonts.bold,
  letterSpacing: -1,
},

card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
  borderWidth: 1,
  borderColor: '#EEF2F7',
  shadowColor: '#0F172A',
  shadowOpacity: 0.04,
  shadowRadius: 14,
  shadowOffset: {width: 0, height: 8},
  elevation: 4,
},

    cardTitle: {
      fontSize: 18,
      color: '#0F172A',
      marginBottom: 18,
      fontFamily: Fonts.bold,
    },

    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
    },

    label: {
      color: '#64748B',
      fontSize: 14,
      fontFamily: Fonts.medium,
    },

    value: {
      color: '#0F172A',
      fontSize: 14,
      fontFamily: Fonts.semiBold,
    },

    smallText: {
      fontSize: 13,
      color: '#64748B',
      fontFamily: Fonts.medium,
    },

    divider: {
      height: 1,
      backgroundColor: '#E2E8F0',
      marginVertical: 14,
    },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  totalLabel: {
    fontSize: 20,
    color: '#0F172A',
    fontFamily: Fonts.bold,
  },

  total: {
    fontSize: 30,
    color: '#2563EB',
    fontFamily: Fonts.bold,
    letterSpacing: -1,
  },

  totalHint: {
    marginTop: 4,
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },

    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      letterSpacing: 0.3,
      fontFamily: Fonts.semiBold,
    },

    addressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      padding: 14,
      borderRadius: 16,
      marginTop: 8,
      marginBottom: 14,
    },

  addressIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  addressText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts.medium,
  },

  addonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },

  addonChip: {
    backgroundColor: '#EEF4FF',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },

  addonChipText: {
    color: '#2563EB',
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },

  headerContainer: {
    marginTop: 25,
    marginBottom: 30,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  backArrow: {
    fontSize: 28,
    color: '#0F172A',
    fontFamily: Fonts.semiBold,
    lineHeight: 28,
    includeFontPadding: false,
  },

  headerTag: {
    color: '#2563EB',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
  },

  headerSubtext: {
    marginTop: 12,
    marginLeft: 25,
    color: '#0F172A',
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },

  totalContainer: {
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 6,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },

  bottomContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 23,
    backgroundColor: 'transparent',
  },

  button: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },

  serviceSubTitle: {
    marginTop: 4,
    marginLeft: 25,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts.medium,
  },
  });
