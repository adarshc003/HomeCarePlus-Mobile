import React, {
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  AppState,
  Linking,
  Modal,
  Image,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';

import {RootStackParamList} from '../../navigation/types';

import {Fonts} from '../../constants/fonts';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {getLocalizedText} from '../../utils/getLocalizedText';

import StatusBadge from '../../components/booking/StatusBadge';
import SectionCard from '../../components/booking/SectionCard';
import DetailRow from '../../components/booking/DetailRow';

import BookingTimeline from '../../components/booking/BookingTimeline';

import {getBookingById} from '../../services/bookingService';

import {
  createTamaraCheckout,
  verifyTamaraPayment,
} from '../../services/paymentService';

import {InAppBrowser} from 'react-native-inappbrowser-reborn';

import VerificationModal from '../../components/modal/VerificationModal';

import {useBookingStore} from '../../store/bookingStore';

import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  route: RouteProp<RootStackParamList, 'BookingDetails'>;
};

const BookingDetailsScreen = ({
  route,
  navigation,
}: any) => {

  const {bookingNumber} = route.params;

  const language = useLanguageStore(
    state => state.language,
  );

  const updateBooking = useBookingStore(
    state => state.updateBooking,
  );

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [retryLoading, setRetryLoading] = useState(false);

  const [showTechnicianModal, setShowTechnicianModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBooking();
    }, [bookingNumber]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        loadBooking();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadBooking();
    }, 20000);

    return () => {
      clearInterval(interval);
    };
  }, [bookingNumber]);

  const loadBooking = async () => {
    try {
      const response = await getBookingById(bookingNumber);

      setBooking(response.booking);
      updateBooking(response.booking);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooking();
    setRefreshing(false);
  };

  const retryPayment = async () => {

    try {

      setRetryLoading(true);

      const response =
        await createTamaraCheckout(
          booking.id,
        );

      const checkoutUrl =
        response.checkoutUrl;

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

        return;

      }

      await loadBooking();

      if (
        verify.paymentStatus === 'failed'
      ) {
        return;
      }

    } catch (error) {

      console.log(error);

    } finally {

      setRetryLoading(false);

    }

  };

  const getTechnicianInitials = (name?: string) => {
    if (!name) {
      return '?';
    }

    const parts = name.trim().split(' ').filter(Boolean);

    if (parts.length === 0) {
      return '?';
    }

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const callTechnician = (phone?: string) => {
    if (!phone) {
      return;
    }

    Linking.openURL(`tel:${phone}`);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color="#4757E7" />
          <Text style={styles.loaderText}>
            {t('loadingDetails', language)}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!booking) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <View style={styles.notFoundIconWrap}>
            <Ionicons
              name="document-outline"
              size={40}
              color="#4757E7"
            />
          </View>
          <Text style={styles.notFoundTitle}>
            {t('bookingNotFound', language)}
          </Text>
          <TouchableOpacity
            style={styles.notFoundBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Ionicons
              name={
                language === 'ar' ? 'arrow-forward' : 'arrow-back'
              }
              size={15}
              color="#4757E7"
            />
            <Text style={styles.notFoundBackText}>
              {t('goBack', language)}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = booking.paymentStatus === 'paid';
  const paymentStatusColor = isPaid ? '#22C55E' : '#F59E0B';
  const paymentStatusBg = isPaid ? '#F0FDF4' : '#FFFBEB';
  const paymentStatusBorder = isPaid ? '#BBF7D0' : '#FDE68A';

  const paymentMethodText =
    booking.paymentMethod === 'COD'
      ? t('cashOnDelivery', language)
      : booking.paymentProvider === 'tamara'
      ? 'Tamara'
      : t('onlinePayment', language);

  const paymentStatusText =
    booking.paymentStatus === 'paid'
      ? t('paid', language)
      : booking.paymentStatus === 'pending'
      ? t('pending', language)
      : booking.paymentStatus === 'failed'
      ? t('failed', language)
      : booking.paymentStatus;

  const formattedDate = new Date(
    booking.bookingDate,
  ).toLocaleDateString(
    language === 'ar' ? 'ar-SA' : 'en-US',
    {day: 'numeric', month: 'short', year: 'numeric'},
  );

  const bookingCreatedDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString(
        language === 'ar' ? 'ar-SA' : 'en-US',
        {day: 'numeric', month: 'short', year: 'numeric'},
      )
    : null;

  const paymentCompletedDate = booking.paidAt
    ? new Date(booking.paidAt).toLocaleDateString(
        language === 'ar' ? 'ar-SA' : 'en-US',
        {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'},
      )
    : null;

const hasCoordinates =
  booking.address?.latitude != null &&
  booking.address?.longitude != null;

  const openInMaps = () => {
    const lat = booking.address.latitude;
    const lng = booking.address.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  const serviceName = getLocalizedText(booking.service?.name, language);
  const packageName = getLocalizedText(booking.package?.name, language);
  const addOnNames = (booking.addOns || [])
    .map((item: any) => getLocalizedText(item?.name, language))
    .filter(Boolean);

  const showOriginalAmount =
    booking.originalAmount > 0 &&
    booking.originalAmount !== booking.finalAmount;
  const showDiscount = booking.discountAmount > 0;

  const technician = booking.technician;
  const technicianHasRating =
    !!technician?.rating && technician.rating > 0;
  const technicianHasExperience =
    !!technician?.experience && technician.experience > 0;
  const technicianHasLanguages =
    !!technician?.languages &&
    Array.isArray(technician.languages) &&
    technician.languages.length > 0;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4757E7"
            colors={['#4757E7']}
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Hero card ── */}
        <View style={styles.heroCard}>

          {/* Back button + service name */}
          <View style={styles.heroTop}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}>
              <Ionicons
                name={
                  language === 'ar'
                    ? 'chevron-forward'
                    : 'chevron-back'
                }
                size={22}
                color="#0F172A"
              />
            </TouchableOpacity>

            <View style={styles.heroTextBlock}>
              <Text style={styles.title} numberOfLines={2}>
                {serviceName}
              </Text>

              <View style={styles.bookingRow}>
                <View style={styles.bookingIdRow}>
                  <Ionicons
                    name="receipt-outline"
                    size={13}
                    color="#94A3B8"
                  />
                  <Text style={styles.bookingNo}>
                    #{booking.bookingNumber}
                  </Text>
                </View>

                <StatusBadge status={booking.status} />
              </View>
            </View>
          </View>

          {/* Stats strip */}
          <View style={styles.heroBottom}>
            <View style={styles.heroStat}>
              <View style={styles.heroStatIconWrap}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color="#4757E7"
                />
              </View>
              <View style={styles.heroStatTextBlock}>
                <Text style={styles.heroLabel}>
                  {t('serviceDate', language)}
                </Text>
                <Text style={styles.heroValue} numberOfLines={1}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStat}>
              <View style={[
                styles.heroStatIconWrap,
                {backgroundColor: paymentStatusBg},
              ]}>
                <Ionicons
                  name={
                    isPaid
                      ? 'checkmark-circle-outline'
                      : 'time-outline'
                  }
                  size={15}
                  color={paymentStatusColor}
                />
              </View>
              <View style={styles.heroStatTextBlock}>
                <Text style={styles.heroLabel}>
                  {t('payment', language)}
                </Text>
                <View style={[
                  styles.payStatusPill,
                  {
                    backgroundColor: paymentStatusBg,
                    borderColor: paymentStatusBorder,
                  },
                ]}>
                  <View style={[
                    styles.payStatusDot,
                    {backgroundColor: paymentStatusColor},
                  ]} />
                  <Text style={[
                    styles.payStatusText,
                    {color: paymentStatusColor},
                  ]}>
                    {paymentStatusText}
                  </Text>
                </View>
              </View>
            </View>
          </View>

        </View>

        {/* ── Booking progress / timeline ── */}
        <SectionCard title={t('bookingProgress', language)}>
          <BookingTimeline status={booking.status} />
        </SectionCard>

        {/* ── Service Details ── */}
        <SectionCard title={t('serviceDetails', language)}>

          <View style={styles.serviceHeaderRow}>
            <View style={styles.serviceIconWrap}>
              <Ionicons name="construct-outline" size={16} color="#4757E7" />
            </View>
            <View style={styles.serviceHeaderTextBlock}>
              <Text style={styles.serviceNameText} numberOfLines={2}>
                {serviceName}
              </Text>
              {packageName ? (
                <Text style={styles.servicePackageText} numberOfLines={1}>
                  {packageName}
                </Text>
              ) : null}
            </View>
          </View>

          {addOnNames.length > 0 && (
            <View style={styles.addOnsWrap}>
              <Text style={styles.addOnsLabel}>
                {t('addons', language)}
              </Text>
              <View style={styles.addOnsChipRow}>
                {addOnNames.map((name: string, index: number) => (
                  <View key={index} style={styles.addOnChip}>
                    <Ionicons name="add-circle-outline" size={12} color="#4757E7" />
                    <Text style={styles.addOnChipText} numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.amountDivider} />

          {showOriginalAmount && (
            <DetailRow
              label={t('originalAmount', language)}
              value={`${t('currency', language)} ${booking.originalAmount}`}
            />
          )}

          {showDiscount && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>
                {t('discount', language)}
              </Text>
              <Text style={styles.discountValue}>
                − {t('currency', language)} {booking.discountAmount}
              </Text>
            </View>
          )}

          <View style={styles.finalAmountRow}>
            <Text style={styles.finalAmountLabel}>
              {t('finalAmount', language)}
            </Text>
            <Text style={styles.finalAmountValue}>
              {t('currency', language)} {booking.finalAmount ?? booking.totalAmount}
            </Text>
          </View>

        </SectionCard>

        {/* ── Booking Information ── */}
        <SectionCard title={t('bookingInformation', language)}>

          <View style={styles.infoGrid}>

            <View style={styles.infoCell}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="receipt-outline" size={14} color="#4757E7" />
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>
                  {t('bookingNumber', language)}
                </Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  #{booking.bookingNumber}
                </Text>
              </View>
            </View>

            {bookingCreatedDate && (
              <View style={styles.infoCell}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="document-text-outline" size={14} color="#4757E7" />
                </View>
                <View style={styles.infoTextBlock}>
                  <Text style={styles.infoLabel}>
                    {t('bookingDate', language)}
                  </Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {bookingCreatedDate}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.infoCell}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="calendar-outline" size={14} color="#4757E7" />
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>
                  {t('serviceDate', language)}
                </Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            {booking.timeSlot && (
              <View style={styles.infoCell}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="time-outline" size={14} color="#4757E7" />
                </View>
                <View style={styles.infoTextBlock}>
                  <Text style={styles.infoLabel}>
                    {t('timeSlot', language)}
                  </Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {booking.timeSlot}
                  </Text>
                </View>
              </View>
            )}

          </View>

        </SectionCard>

        {/* ── Address ── */}
        <SectionCard title={t('address', language)}>
          <View style={styles.addressRow}>
            <View style={styles.addressIconWrap}>
              <Ionicons
                name="location"
                size={16}
                color="#4757E7"
              />
            </View>
            <Text style={styles.value}>
              {[booking.address?.fullAddress, booking.address?.city, booking.address?.region]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>

          {hasCoordinates && (
            <TouchableOpacity
              style={styles.mapsButton}
              activeOpacity={0.8}
              onPress={openInMaps}>
              <Ionicons name="navigate-outline" size={15} color="#4757E7" />
              <Text style={styles.mapsButtonText}>
                {t('openInMaps', language)}
              </Text>
            </TouchableOpacity>
          )}
        </SectionCard>

        {/* ── Partner ── */}
        <SectionCard title={t('partner', language)}>
          {technician ? (
            <>
              <TouchableOpacity
                style={styles.technicianCard}
                activeOpacity={0.85}
                onPress={() => setShowTechnicianModal(true)}>

                {technician.image ? (
                  <Image
                    source={{uri: technician.image}}
                    style={styles.technicianAvatarImage}
                  />
                ) : (
                  <View style={styles.technicianAvatarFallback}>
                    <Text style={styles.technicianAvatarInitials}>
                      {getTechnicianInitials(technician.name)}
                    </Text>
                  </View>
                )}

                <View style={styles.technicianCardTextBlock}>
                  <View style={styles.technicianNameRow}>
                    <Text style={styles.technicianNameText} numberOfLines={1}>
                      {technician.name || '-'}
                    </Text>
                    {technicianHasRating && (
                      <View style={styles.technicianRatingPill}>
                        <Ionicons name="star" size={11} color="#F59E0B" />
                        <Text style={styles.technicianRatingText}>
                          {technician.rating}
                        </Text>
                      </View>
                    )}
                  </View>

                  {technician.specialization ? (
                    <View style={styles.technicianMetaRow}>
                      <Ionicons name="construct-outline" size={12} color="#64748B" />
                      <Text style={styles.technicianMetaText} numberOfLines={1}>
                        {technician.specialization}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.technicianBadgeRow}>
                    {technicianHasExperience && (
                      <View style={styles.technicianBadge}>
                        <Ionicons name="time-outline" size={11} color="#4757E7" />
                        <Text style={styles.technicianBadgeText} numberOfLines={1}>
                          {technician.experience} {t('yearsExperience', language)}
                        </Text>
                      </View>
                    )}

                    {technicianHasLanguages && (
                      <View style={styles.technicianBadge}>
                        <Ionicons name="globe-outline" size={11} color="#4757E7" />
                        <Text style={styles.technicianBadgeText} numberOfLines={1}>
                          {technician.languages.join(' • ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons
                  name={
                    language === 'ar'
                      ? 'chevron-back-outline'
                      : 'chevron-forward-outline'
                  }
                  size={18}
                  color="#CBD5E1"
                />

              </TouchableOpacity>

              {technician.phone ? (
                <TouchableOpacity
                  style={styles.callTechnicianButton}
                  activeOpacity={0.85}
                  onPress={() => callTechnician(technician.phone)}>
                  <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.callTechnicianButtonText}>
                    {t('callTechnician', language)}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <View style={styles.technicianPlaceholder}>
              <View style={styles.technicianPlaceholderIconWrap}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" />
              </View>
              <Text style={styles.technicianPlaceholderText}>
                {t('technicianWillBeAssigned', language)}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* ── Payment ── */}
        <SectionCard title={t('payment', language)}>
          <DetailRow
            label={t('method', language)}
            value={paymentMethodText}
          />

          {showOriginalAmount && (
            <DetailRow
              label={t('originalAmount', language)}
              value={`${t('currency', language)} ${booking.originalAmount}`}
            />
          )}

          {showDiscount && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>
                {t('discount', language)}
              </Text>
              <Text style={styles.discountValue}>
                − {t('currency', language)} {booking.discountAmount}
              </Text>
            </View>
          )}

          <DetailRow
            label={t('finalAmount', language)}
            value={`${t('currency', language)} ${booking.finalAmount ?? booking.totalAmount}`}
          />

          <View style={styles.paymentStatusDetailRow}>
            <Text style={styles.label}>
              {t('status', language)}
            </Text>
            <View style={[
              styles.miniStatusPill,
              {backgroundColor: paymentStatusBg, borderColor: paymentStatusBorder},
            ]}>
              <View style={[styles.payStatusDot, {backgroundColor: paymentStatusColor}]} />
              <Text style={[styles.miniStatusText, {color: paymentStatusColor}]}>
                {paymentStatusText}
              </Text>
            </View>
          </View>

          {booking.paymentReference && (
            <DetailRow
              label={t('transactionReference', language)}
              value={booking.paymentReference}
            />
          )}

          {paymentCompletedDate && (
            <DetailRow
              label={t('paymentCompletedOn', language)}
              value={paymentCompletedDate}
            />
          )}

          {booking.paymentStatus === 'failed' && booking.paymentFailureReason && (
            <View style={styles.failureReasonBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
              <Text style={styles.failureReasonText}>
                {booking.paymentFailureReason}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* ── Retry / Continue Payment ── */}
        {booking.paymentMethod === 'ONLINE' &&
          booking.paymentProvider === 'tamara' &&
          booking.paymentStatus !== 'paid' &&
          booking.status === 'pending' && (

            <SectionCard title={t('payment', language)}>

              <View style={styles.retryWarningBox}>
                <View style={styles.retryWarningIconWrap}>
                  <Ionicons
                    name={
                      booking.paymentStatus === 'failed'
                        ? 'close-circle-outline'
                        : 'time-outline'
                    }
                    size={18}
                    color="#DC2626"
                  />
                </View>
                <View style={styles.retryWarningTextBlock}>
                  <Text style={styles.retryWarningTitle}>
                    {booking.paymentStatus === 'failed'
                      ? t('paymentFailed', language)
                      : t('paymentPending', language)}
                  </Text>
                  <Text style={styles.retryWarningSubtitle}>
                    {booking.paymentFailureReason ||
                      t('completePaymentToConfirm', language)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={retryPayment}
                disabled={retryLoading}
                activeOpacity={0.85}
                style={[
                  styles.retryButton,
                  retryLoading && styles.retryButtonDisabled,
                ]}>
                {retryLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={
                        booking.paymentStatus === 'failed'
                          ? 'refresh-outline'
                          : 'arrow-forward-circle-outline'
                      }
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.retryButtonText}>
                      {booking.paymentStatus === 'failed'
                        ? t('retryPayment', language)
                        : t('continuePayment', language)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

            </SectionCard>

        )}

        {/* ── Verification (assigned only) ── */}
        {[
          'assigned',
          'on_the_way',
          'in_progress',
        ].includes(booking.status) && (
          <SectionCard title={t('verification', language)}>
            <View style={styles.verificationInfoRow}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#64748B"
              />
              <Text style={styles.info}>
                {t('verificationInfo', language)}.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.qrButton}
              activeOpacity={0.85}
              onPress={() => setShowQR(true)}>
              <Ionicons
                name="qr-code-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.qrButtonText}>
                {t('showVerificationQR', language)}
              </Text>
            </TouchableOpacity>
          </SectionCard>
        )}

      </ScrollView>

      <VerificationModal
        visible={showQR}
        bookingId={booking?.id}
        qrToken={booking?.qrToken ?? ''}
        bookingNumber={booking?.bookingNumber ?? ''}
        status={booking?.status ?? 'pending'}
        reviewSubmitted={booking?.reviewSubmitted ?? false}
        onClose={() => setShowQR(false)}
        onReviewSubmitted={() => {
          loadBooking();
        }}
      />

      {/* ── Technician Detail Modal ── */}
      <Modal
        visible={showTechnicianModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTechnicianModal(false)}>
        <View style={styles.technicianModalOverlay}>
          <View style={styles.technicianModalCard}>

            <TouchableOpacity
              style={styles.technicianModalCloseBtn}
              activeOpacity={0.7}
              onPress={() => setShowTechnicianModal(false)}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </TouchableOpacity>

            {technician?.image ? (
              <Image
                source={{uri: technician.image}}
                style={styles.technicianModalAvatarImage}
              />
            ) : (
              <View style={styles.technicianModalAvatarFallback}>
                <Text style={styles.technicianModalAvatarInitials}>
                  {getTechnicianInitials(technician?.name)}
                </Text>
              </View>
            )}

            <Text style={styles.technicianModalName} numberOfLines={1}>
              {technician?.name || '-'}
            </Text>

            {technicianHasRating && (
              <View style={styles.technicianModalRatingPill}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.technicianModalRatingText}>
                  {technician.rating} {t('rating', language)}
                </Text>
              </View>
            )}

            <View style={styles.technicianModalDivider} />

            <View style={styles.technicianModalDetails}>

              {technician?.phone ? (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="call-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.phone}
                  </Text>
                </View>
              ) : null}

              {technician?.email ? (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="mail-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.email}
                  </Text>
                </View>
              ) : null}

              {technician?.specialization ? (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="construct-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.specialization}
                  </Text>
                </View>
              ) : null}

              {technicianHasExperience && (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="time-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.experience} {t('yearsExperience', language)}
                  </Text>
                </View>
              )}

              {technicianHasLanguages && (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="globe-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.languages.join(' • ')}
                  </Text>
                </View>
              )}

            </View>

            {technician?.phone ? (
              <TouchableOpacity
                style={styles.technicianModalCallButton}
                activeOpacity={0.85}
                onPress={() => callTechnician(technician.phone)}>
                <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                <Text style={styles.technicianModalCallButtonText}>
                  {t('callTechnician', language)}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.technicianModalCloseTextBtn}
              activeOpacity={0.7}
              onPress={() => setShowTechnicianModal(false)}>
              <Text style={styles.technicianModalCloseTextBtnText}>
                {t('close', language)}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default BookingDetailsScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  // ── Loader / Not-found ────────────────────────────────────────────────────
  loaderContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  loaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 44,
    paddingHorizontal: 48,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 6},
    elevation: 5,
  },

  loaderText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#64748B',
  },

  notFoundIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  notFoundTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
  },

  notFoundBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  notFoundBackText: {
    color: '#4757E7',
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  // ── Hero card ─────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },

  heroTextBlock: {
    flex: 1,
  },

  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
    lineHeight: 28,
  },

  bookingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bookingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  bookingNo: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },

  // ── Hero bottom stats strip ───────────────────────────────────────────────
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 16,
  },

  heroStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  heroStatTextBlock: {
    flex: 1,
  },

  heroStatIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },

  heroLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  heroValue: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

  payStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },

  payStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  payStatusText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },

  // ── Service Details ───────────────────────────────────────────────────────
  serviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },

  serviceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  serviceHeaderTextBlock: {
    flex: 1,
  },

  serviceNameText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: '#0F172A',
    lineHeight: 20,
  },

  servicePackageText: {
    marginTop: 3,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
  },

  addOnsWrap: {
    marginBottom: 14,
  },

  addOnsLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },

  addOnsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  addOnChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 200,
  },

  addOnChipText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#4757E7',
  },

  amountDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },

  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  discountLabel: {
    fontSize: 14,
    color: '#22C55E',
    fontFamily: Fonts.medium,
  },

  discountValue: {
    fontSize: 14,
    color: '#22C55E',
    fontFamily: Fonts.semiBold,
  },

  finalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  finalAmountLabel: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Fonts.semiBold,
  },

  finalAmountValue: {
    fontSize: 18,
    color: '#4757E7',
    fontFamily: Fonts.bold,
  },

  // ── Booking Information grid ──────────────────────────────────────────────
  infoGrid: {
    gap: 14,
  },

  infoCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  infoTextBlock: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#0F172A',
  },

  // ── Address ───────────────────────────────────────────────────────────────
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  addressIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  value: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Fonts.medium,
    lineHeight: 22,
  },

  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
    backgroundColor: '#EEF2FF',
    paddingVertical: 11,
    borderRadius: 12,
  },

  mapsButtonText: {
    color: '#4757E7',
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },

  // ── Technician card (Partner section) ───────────────────────────────────────
  technicianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  technicianAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
  },

  technicianAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4757E7',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  technicianAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.bold,
  },

  technicianCardTextBlock: {
    flex: 1,
    gap: 5,
  },

  technicianNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  technicianNameText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: '#0F172A',
    flexShrink: 1,
  },

  technicianRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },

  technicianRatingText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: '#B45309',
  },

  technicianMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  technicianMetaText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
    flexShrink: 1,
  },

  technicianBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },

  technicianBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    maxWidth: 180,
  },

  technicianBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#4757E7',
  },

  callTechnicianButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4757E7',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 12,
    shadowColor: '#4757E7',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },

  callTechnicianButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

  // ── Technician modal ─────────────────────────────────────────────────────
  technicianModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  technicianModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#020617',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 10},
    elevation: 12,
  },

  technicianModalCloseBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  technicianModalAvatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    marginBottom: 14,
  },

  technicianModalAvatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4757E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  technicianModalAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: Fonts.bold,
  },

  technicianModalName: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    marginBottom: 8,
  },

  technicianModalRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 6,
  },

  technicianModalRatingText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#B45309',
  },

  technicianModalDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },

  technicianModalDetails: {
    width: '100%',
    gap: 14,
    marginBottom: 18,
  },

  technicianModalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  technicianModalDetailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  technicianModalDetailText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#0F172A',
  },

  technicianModalCallButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4757E7',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 10,
    shadowColor: '#4757E7',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },

  technicianModalCallButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },

  technicianModalCloseTextBtn: {
    paddingVertical: 8,
  },

  technicianModalCloseTextBtnText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#64748B',
  },

  // ── Technician placeholder ─────────────────────────────────────────────────
  technicianPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
  },

  technicianPlaceholderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  technicianPlaceholderText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#64748B',
    lineHeight: 19,
  },

  // ── Payment card extras ────────────────────────────────────────────────────
  label: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: Fonts.medium,
  },

  paymentStatusDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  miniStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },

  miniStatusText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },

  failureReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },

  failureReasonText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#DC2626',
    lineHeight: 18,
  },

  // ── Retry payment ──────────────────────────────────────────────────────────
  retryWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },

  retryWarningIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  retryWarningTextBlock: {
    flex: 1,
  },

  retryWarningTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#DC2626',
    marginBottom: 3,
  },

  retryWarningSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748B',
    lineHeight: 18,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4757E7',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#4757E7',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },

  retryButtonDisabled: {
    opacity: 0.7,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },

  // ── Verification ──────────────────────────────────────────────────────────
  verificationInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },

  info: {
    flex: 1,
    color: '#64748B',
    lineHeight: 22,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },

  qrButton: {
    backgroundColor: '#4757E7',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#4757E7',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },

  qrButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});