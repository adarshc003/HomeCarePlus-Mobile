import React,{
  useState,
  useEffect,
  useRef,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Linking,
} from 'react-native';

import {createBooking} from '../../services/bookingService';

import {useBookingStore} from '../../store/bookingStore';
import {useOfferStore} from '../../store/offerStore';
import {useAuthStore} from '../../store/authStore';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import Ionicons from '@react-native-vector-icons/ionicons';

import {updateEmail} from '../../services/userService';

import InAppBrowser from 'react-native-inappbrowser-reborn';

import {
  createTamaraCheckout,
  verifyTamaraPayment,
  createTelrCheckout,
  verifyTelrPayment,
} from '../../services/paymentService';

import {waitForPushRegistration} from '../../services/notificationService';

const PaymentScreen = ({
  navigation,
}: any) => {
  const [loading, setLoading] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('tamara');

  const PAYMENT_PROVIDERS = [
    {
      id: 'tamara',
      name: 'Tamara',
      icon: 'card-outline' as const,
      enabled: true,
    },
    {
      // ERP's payment_provider Selection stores this gateway as 'teller'
      // (hcp_booking.py) — the id here must match that exactly even though
      // the customer-facing name is "Telr".
      id: 'teller',
      name: 'Telr',
      icon: 'card-outline' as const,
      enabled: true,
    },
    {
      id: 'tabby',
      name: 'Tabby',
      icon: 'card-outline' as const,
      enabled: false,
    },
  ];

const bookingIdRef =
  useRef<string | null>(null);

const bookingNumberRef =
  useRef<string | null>(null);

  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);

  const selectedService = useBookingStore(state => state.selectedService);
  const selectedPackage = useBookingStore(state => state.selectedPackage);
  const selectedAddOns = useBookingStore(state => state.selectedAddOns);
  const address = useBookingStore(state => state.address);
  const latitude = useBookingStore(state => state.latitude);
  const selectedDate = useBookingStore(
  state => state.selectedDate,
);

const selectedTimeSlot = useBookingStore(
  state => state.selectedTimeSlot,
);

const selectedSlotStartHour = useBookingStore(
  state => state.selectedSlotStartHour,
);
  const longitude = useBookingStore(state => state.longitude);

  const selectedOffer = useOfferStore(state => state.selectedOffer);
  const originalAmount = useOfferStore(state => state.originalAmount);
  const discountAmount = useOfferStore(state => state.discountAmount);
  const finalAmount = useOfferStore(state => state.finalAmount);

  const language = useLanguageStore(state => state.language);

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const addOnTotal = selectedAddOns.reduce(
    (total, item) => total + item.price,
    0,
  );

  const totalAmount = (selectedPackage?.offerPrice || 0) + addOnTotal;

  const displayAmount = finalAmount > 0 ? finalAmount : totalAmount;

  // ── Single payload builder ─────────────────────────────────────────────────
  const buildBookingPayload = (
  method: 'COD' | 'ONLINE',
  provider?: string,
) => {

  if (!selectedService) {
    throw new Error('Service not selected');
  }

  // Combine the selected calendar date with the selected slot's start hour
  // into one real point in time, built in the DEVICE'S LOCAL timezone (no
  // hardcoded offset) and converted to UTC — previously bookingDate carried
  // no time-of-day at all, so ERP always stored midnight.
  const [year, month, day] = selectedDate.split('-').map(Number);

  const combinedBookingDate = new Date(
    year,
    (month || 1) - 1,
    day || 1,
    selectedSlotStartHour ?? 0,
    0,
    0,
    0,
  ).toISOString();

  return {
    customer: user?._id,
    service: selectedService.id,
    package: selectedPackage?.id,
    addOns: selectedAddOns.map(item => item.id),
    address: {
      fullAddress: address,
      latitude,
      longitude,
    },
    bookingDate: combinedBookingDate,

timeSlot: selectedTimeSlot,
    totalAmount: originalAmount > 0 ? originalAmount : totalAmount,
    paymentMethod: method,
    paymentProvider: method === 'ONLINE' ? provider : undefined,
    appliedOffer: selectedOffer?._id,
    originalAmount: originalAmount > 0 ? originalAmount : totalAmount,
    discountAmount,
    finalAmount: finalAmount > 0 ? finalAmount : totalAmount,
};

};

  // ── Start Tamara checkout after email is confirmed ─────────────────────────
  const startTamaraPayment = async () => {
    if (loading) {
      return;
    }
    if (!selectedService) {
      return;
    }

    try {
      setLoading(true);

      await waitForPushRegistration();

      const bookingResponse = await createBooking(
        buildBookingPayload('ONLINE', selectedProvider),
      );

      const booking = bookingResponse.booking;

      bookingIdRef.current =
  booking.id;

bookingNumberRef.current =
  booking.bookingNumber;

      const checkoutResponse = await createTamaraCheckout(booking.id);

      const checkoutUrl = checkoutResponse.checkoutUrl;

const available =
  await InAppBrowser.isAvailable();

if (available) {

  await InAppBrowser.openAuth(
    checkoutUrl,
    'homecareplus://payment',
    {
      dismissButtonStyle: 'close',
      showTitle: true,
      enableUrlBarHiding: true,
      enableDefaultShare: false,
    },
  );

} else {

  await Linking.openURL(
    checkoutUrl,
  );

}

const verify =
  await verifyTamaraPayment(
    booking.id,
  );

if (verify.paymentStatus === 'paid') {

  navigation.replace(
    'BookingSuccess',
    {
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
    },
  );

} else {

navigation.replace(
  'BookingDetails',
  {
    bookingNumber: bookingNumberRef.current,
  },
);

}
} catch (error: any) {

  console.log(error);

  if (
    bookingIdRef.current
  ) {

    try {

      const verify =
        await verifyTamaraPayment(
          bookingIdRef.current,
        );

      if (
        verify.paymentStatus ===
        'paid'
      ) {

        navigation.replace(
          'BookingSuccess',
          {
            paymentMethod:
              'ONLINE',
            paymentStatus:
              'PAID',
          },
        );

      } else {

navigation.replace(
  'BookingDetails',
  {
    bookingNumber: bookingNumberRef.current,
  },
);

      }

      return;

    } catch (e) {

navigation.replace(
  'BookingDetails',
  {
    bookingNumber: bookingNumberRef.current,
  },
);

      return;

    }

  }

  Alert.alert(
    'Payment Error',
    'Unable to start payment.',
  );

} finally {

  setLoading(false);

}
  };

  // ── Start Telr checkout ─────────────────────────────────────────────────────
  const startTelrPayment = async () => {
    if (loading) {
      return;
    }
    if (!selectedService) {
      return;
    }

    try {
      setLoading(true);

      await waitForPushRegistration();

      const bookingResponse = await createBooking(
        buildBookingPayload('ONLINE', 'teller'),
      );

      const booking = bookingResponse.booking;

      bookingIdRef.current = booking.id;
      bookingNumberRef.current = booking.bookingNumber;

      // Checkout creation is isolated from the outer catch below: that
      // catch's fallback (re-verify, then fall back to BookingDetails) is
      // meant for a failure AFTER a checkout session already exists — e.g.
      // the browser was opened but verification hit a network hiccup. If
      // checkout creation itself never succeeded there is nothing to verify
      // yet, and silently falling back there just hides the real error
      // (e.g. a gateway rejecting the request) behind a blank navigation.
      let checkoutResponse;

      try {
        checkoutResponse = await createTelrCheckout(booking.id);
      } catch (checkoutError: any) {
        console.log(checkoutError);

        Alert.alert(
          'Payment Error',
          checkoutError?.response?.data?.message ||
            'Unable to start Telr checkout.',
        );

        navigation.replace('BookingDetails', {
          bookingNumber: bookingNumberRef.current,
        });

        return;
      }

      const checkoutUrl = checkoutResponse.checkoutUrl;

      const available = await InAppBrowser.isAvailable();

      if (available) {
        await InAppBrowser.openAuth(
          checkoutUrl,
          'homecareplus://payment',
          {
            dismissButtonStyle: 'close',
            showTitle: true,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
          },
        );
      } else {
        await Linking.openURL(checkoutUrl);
      }

      const verify = await verifyTelrPayment(booking.id);

      if (verify.paymentStatus === 'paid') {
        navigation.replace('BookingSuccess', {
          paymentMethod: 'ONLINE',
          paymentStatus: 'PAID',
        });
      } else {
        navigation.replace('BookingDetails', {
          bookingNumber: bookingNumberRef.current,
        });
      }
    } catch (error: any) {
      console.log(error);

      if (bookingIdRef.current) {
        try {
          const verify = await verifyTelrPayment(bookingIdRef.current);

          if (verify.paymentStatus === 'paid') {
            navigation.replace('BookingSuccess', {
              paymentMethod: 'ONLINE',
              paymentStatus: 'PAID',
            });
          } else {
            navigation.replace('BookingDetails', {
              bookingNumber: bookingNumberRef.current,
            });
          }

          return;
        } catch (e) {
          navigation.replace('BookingDetails', {
            bookingNumber: bookingNumberRef.current,
          });

          return;
        }
      }

      Alert.alert(
        'Payment Error',
        'Unable to start payment.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Save email, update if changed, then proceed ────────────────────────────
const saveEmail = async () => {

  if (loading) {
    return;
  }
    const trimmedEmail = email.trim();

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(trimmedEmail)) {

Alert.alert(
  t('invalidEmail', language),
);

  return;

}

    // Set before the first await so a second tap on "Continue" (fired
    // during the updateEmail round trip, before startTamaraPayment has a
    // chance to set its own loading flag) is blocked by the guard above.
    setLoading(true);

    try {
      if (trimmedEmail !== user?.email) {
        const response = await updateEmail(trimmedEmail);
        updateUser(response.user);
      }

      setEmailModalVisible(false);

      await startTamaraPayment();
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        'Payment Error',
        error?.response?.data?.message || 'Unable to update email.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Main payment entry point ───────────────────────────────────────────────
 const handlePayment = async () => {

  if (loading) {
    return;
  }
    if (!selectedService) {
      return;
    }

    if (paymentMethod === 'ONLINE') {
      setProviderModalVisible(true);
      return;
    }

    // COD path
    try {
      setLoading(true);

      await waitForPushRegistration();

      await createBooking(buildBookingPayload('COD'));

      navigation.replace('BookingSuccess', {
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
      });
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        'Booking Error',
        error?.response?.data?.message || 'Unable to confirm booking.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* ── Header ── */}
        <View style={styles.headerContainer}>
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}>
              <Ionicons
                name={
                  language === 'ar'
                    ? 'chevron-forward'
                    : 'chevron-back'
                }
                size={22}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.headerTextBlock}>
              <Text style={styles.heading}>
                {t('payment', language) ||
                  (language === 'ar' ? 'الدفع' : 'Payment')}
              </Text>
              <Text style={styles.subHeading}>
                {t('selectPaymentMethod', language)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Amount Summary Card ── */}
        <View style={styles.amountCard}>

          <View style={styles.amountCardHeader}>
            <Ionicons
              name="receipt-outline"
              size={16}
              color="#64748B"
            />
            <Text style={styles.amountLabel}>
              {t('paymentSummary', language)}
            </Text>
          </View>

          <Text style={styles.bigAmount}>
            {t('currency', language)} {displayAmount}
          </Text>

          <View style={styles.amountDivider} />

          <View style={styles.lineItems}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {t('serviceTotal', language)}
              </Text>
              <Text style={styles.priceValue}>
                {t('currency', language)}{' '}
                {originalAmount > 0 ? originalAmount : totalAmount}
              </Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.priceRow}>
                <View style={styles.discountLabelWrap}>
                  <Ionicons
                    name="pricetag-outline"
                    size={13}
                    color="#22C55E"
                  />
                  <Text style={styles.discountLabel}>
                    {t('discount', language)}
                  </Text>
                </View>
                <Text style={styles.discountValue}>
                  − {t('currency', language)} {discountAmount}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {t('totalPayable', language)}
              </Text>
              <Text style={styles.totalValue}>
                {t('currency', language)} {displayAmount}
              </Text>
            </View>
          </View>

          <View style={styles.secureBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color="#22C55E"
            />
            <Text style={styles.secureText}>
              {t('securePayment', language)}
            </Text>
          </View>

        </View>

        {/* ── Payment Methods ── */}
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>
            {t('selectPaymentMethod', language)}
          </Text>

          {/* Online */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              paymentMethod === 'ONLINE' && styles.selectedMethod,
            ]}
            onPress={() => setPaymentMethod('ONLINE')}
            activeOpacity={0.8}>

            <View style={styles.methodRow}>
              <View style={[
                styles.methodIconWrap,
                paymentMethod === 'ONLINE' && styles.methodIconWrapSelected,
              ]}>
                <Ionicons
                  name="card-outline"
                  size={22}
                  color={paymentMethod === 'ONLINE' ? colors.primary : colors.textSecondary}
                />
              </View>

              <View style={styles.methodTextBlock}>
                <Text style={[
                  styles.methodTitle,
                  paymentMethod === 'ONLINE' && styles.methodTitleSelected,
                ]}>
                  {t('payOnline', language)}
                </Text>
                <Text style={styles.methodDesc}>
                  {t('onlinePaymentDesc', language)}
                </Text>
              </View>

              <View style={[
                styles.radioOuter,
                paymentMethod === 'ONLINE' && styles.radioOuterSelected,
              ]}>
                {paymentMethod === 'ONLINE' && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>

          </TouchableOpacity>

          {/* COD */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              paymentMethod === 'COD' && styles.selectedMethod,
            ]}
            onPress={() => setPaymentMethod('COD')}
            activeOpacity={0.8}>

            <View style={styles.methodRow}>
              <View style={[
                styles.methodIconWrap,
                paymentMethod === 'COD' && styles.methodIconWrapSelected,
              ]}>
                <Ionicons
                  name="cash-outline"
                  size={22}
                  color={paymentMethod === 'COD' ? colors.primary : colors.textSecondary}
                />
              </View>

              <View style={styles.methodTextBlock}>
                <Text style={[
                  styles.methodTitle,
                  paymentMethod === 'COD' && styles.methodTitleSelected,
                ]}>
                  {t('cashOnDelivery', language)}
                </Text>
                <Text style={styles.methodDesc}>
                  {t('cashOnDeliveryDesc', language)}
                </Text>
              </View>

              <View style={[
                styles.radioOuter,
                paymentMethod === 'COD' && styles.radioOuterSelected,
              ]}>
                {paymentMethod === 'COD' && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>

          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.85}>
          {!loading && (
            <Ionicons
              name={
                paymentMethod === 'COD'
                  ? 'checkmark-circle-outline'
                  : 'lock-closed-outline'
              }
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
          )}
          <Text style={styles.buttonText}>
            {loading
              ? t('processing', language)
              : paymentMethod === 'COD'
              ? t('confirmBooking', language)
              : t('payNow', language)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Payment Provider Modal (bottom sheet) ── */}
      <Modal
        visible={providerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProviderModalVisible(false)}>

        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setProviderModalVisible(false)}>

          <TouchableOpacity
            activeOpacity={1}
            style={styles.sheetCard}
            onPress={() => {}}>

            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>
              {t('choosePaymentProvider', language)}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {t('choosePaymentProviderDesc', language)}
            </Text>

            <View style={styles.providerList}>
              {PAYMENT_PROVIDERS.map(provider => {
                const isSelected = selectedProvider === provider.id;

                return (
                  <TouchableOpacity
                    key={provider.id}
                    style={[
                      styles.providerRow,
                      isSelected && styles.providerRowSelected,
                      !provider.enabled && styles.providerRowDisabled,
                    ]}
                    activeOpacity={provider.enabled ? 0.8 : 1}
                    disabled={!provider.enabled || loading}
                    onPress={() => setSelectedProvider(provider.id)}>

                    <View style={[
                      styles.providerIconWrap,
                      isSelected && styles.providerIconWrapSelected,
                    ]}>
                      <Ionicons
                        name={provider.icon}
                        size={20}
                        color={
                          !provider.enabled
                            ? '#CBD5E1'
                            : isSelected
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </View>

                    <Text style={[
                      styles.providerName,
                      !provider.enabled && styles.providerNameDisabled,
                    ]}>
                      {provider.name}
                    </Text>

                    {provider.enabled ? (
                      <View style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}>
                        {isSelected && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    ) : (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>
                          {t('comingSoon', language)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.sheetContinueButton,
                loading && styles.buttonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={loading}
              onPress={() => {
                setProviderModalVisible(false);

                if (selectedProvider === 'tamara') {
                  setEmail(user?.email || '');
                  setEmailModalVisible(true);
                } else if (selectedProvider === 'teller') {
                  startTelrPayment();
                }
              }}>
              <Text style={styles.sheetContinueText}>
                {t('continue', language)}
              </Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Email Modal ── */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="fade">

        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: 24,
          }}>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 20,
            }}>

<Text
  style={{
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: colors.textPrimary,
    marginBottom: 15,
  }}>
  {t('emailRequired', language)}
</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('enterEmail', language)}
              placeholderTextColor={colors.textHint}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 14,
                color: colors.textPrimary,
                fontFamily: Fonts.regular,
              }}
            />

            <TouchableOpacity
              onPress={saveEmail}
              disabled={loading}
              style={{
                backgroundColor: colors.primary,
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                opacity: loading ? 0.6 : 1,
              }}>

<Text
  style={{
    color: '#fff',
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
  }}>
  {t('continue', language)}
</Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>
  );
};

export default PaymentScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 120,
  },

  // ── Header ──────────────────────────────
  headerContainer: {
    marginBottom: 24,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  headerTextBlock: {
    flex: 1,
  },

  heading: {
    fontSize: 26,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
  },

  subHeading: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },

  // ── Amount Card ──────────────────────────
  amountCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },

  amountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },

  amountLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.medium,
  },

  bigAmount: {
    fontSize: 38,
    color: colors.primary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
    marginBottom: 16,
  },

  amountDivider: {
    height: 1,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 16,
  },

  lineItems: {
    gap: 10,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: Fonts.regular,
  },

  priceValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
  },

  discountLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  discountLabel: {
    fontSize: 14,
    color: '#22C55E',
    fontFamily: Fonts.medium,
  },

  discountValue: {
    fontSize: 14,
    color: '#22C55E',
    fontFamily: Fonts.bold,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  totalLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
  },

  totalValue: {
    fontSize: 18,
    color: colors.primary,
    fontFamily: Fonts.bold,
  },

  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'center',
  },

  secureText: {
    color: '#22C55E',
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },

  // ── Payment Methods ──────────────────────
  paymentCard: {
    marginBottom: 30,
  },

  paymentTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 14,
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },

  methodCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },

  selectedMethod: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selectedCardBackground,
  },

  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },

  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  methodIconWrapSelected: {
    backgroundColor: `${colors.primary}1A`,
  },

  methodTextBlock: {
    flex: 1,
  },

  methodTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
  },

  methodTitleSelected: {
    color: colors.primary,
  },

  methodDesc: {
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  radioOuterSelected: {
    borderColor: colors.primary,
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  // ── Payment Provider Sheet ───────────────
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },

  sheetCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 18,
  },

  sheetTitle: {
    fontSize: 19,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  sheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: 20,
  },

  providerList: {
    gap: 10,
    marginBottom: 22,
  },

  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },

  providerRowSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selectedCardBackground,
  },

  providerRowDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.divider,
  },

  providerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  providerIconWrapSelected: {
    backgroundColor: `${colors.primary}1A`,
  },

  providerName: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
  },

  providerNameDisabled: {
    color: colors.textHint,
  },

  comingSoonBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  comingSoonText: {
    fontSize: 11,
    color: colors.textHint,
    fontFamily: Fonts.semiBold,
  },

  sheetContinueButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 5},
    elevation: 6,
  },

  sheetContinueText: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.2,
    fontFamily: Fonts.semiBold,
  },

  // ── Bottom CTA ───────────────────────────
  bottomContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
  },

  button: {
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonIcon: {
    marginRight: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.2,
    fontFamily: Fonts.semiBold,
  },
});
