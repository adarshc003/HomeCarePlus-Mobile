import React, {
  useState,
  useRef,
  useEffect,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';

import {useBookingStore} from '../../store/bookingStore';

import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import {getLocalizedText} from '../../utils/getLocalizedText';

import LinearGradient from 'react-native-linear-gradient';

import Ionicons from '@react-native-vector-icons/ionicons';

import {useAppDataStore} from '../../store/appDataStore';

import {useOfferStore} from '../../store/offerStore';

const FEATURES = [
  'verifiedProfessionals',
  'sameDayService',
  'qualityAssured',
  'securePayments',
] as const;

const FEATURE_ICONS = [
  'shield-checkmark-outline',
  'flash-outline',
  'ribbon-outline',
  'lock-closed-outline',
];

const ServiceDetailsScreen = ({
  navigation,
  route,
}: any) => {
  const {service} = route.params;

  const cachedPackages = useAppDataStore(
    state => state.packages[service.id],
  );

  const scrollY = useRef(new Animated.Value(0)).current;

  const imageTranslate = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -80],
    extrapolate: 'clamp',
  });

  const [options, setOptions] = useState<any[]>([]);

const bookingSelectedPackage =
  useBookingStore(
    state => state.selectedPackage,
  );

const [selectedOption, setSelectedOption] =
  useState<any>(bookingSelectedPackage);

    useEffect(() => {
    if (cachedPackages) {
      setOptions(cachedPackages);
    }
  }, [cachedPackages]);

  useEffect(() => {
  if (bookingSelectedPackage) {
    setSelectedOption(
      bookingSelectedPackage,
    );
  }
}, [bookingSelectedPackage]);
  const setSelectedService = useBookingStore(
    state => state.setSelectedService,
  );

  const setSelectedPackage = useBookingStore(
    state => state.setSelectedPackage,
  );

  const language = useLanguageStore(
    state => state.language,
  );

  const {colors, isDark} = useTheme();
  const styles = createStyles(colors);

  const serviceName = getLocalizedText(service?.name, language);

  const serviceDescription = getLocalizedText(
    service?.description,
    language,
  );

const clearOffer = useOfferStore(
  state => state.clearOffer,
);

  const clearOffers = useAppDataStore(
  state => state.clearOffers,
);

const clearBooking =
  useBookingStore(
    state => state.clearBooking,
  );

  const handleBack = () => {

  clearBooking();

  clearOffer();

  clearOffers();

  navigation.goBack();

};

useEffect(() => {

  const unsubscribe =
    navigation.addListener(
      'beforeRemove',
      (event: any) => {

        const action =
          event.data.action;

        if (
          action.type === 'GO_BACK' &&
          navigation.isFocused()
        ) {

          clearBooking();

          clearOffer();

          clearOffers();

        }

      },
    );

  return unsubscribe;

}, [navigation]);

  const handleBookNow = () => {
    if (!selectedOption) {
      return;
    }

    setSelectedService(service);
    setSelectedPackage(selectedOption);
    clearOffer();
    clearOffers();
    navigation.navigate('AddOn');
  };

  const lowestPrice = options.length
    ? Math.min(...options.map(p => p.offerPrice))
    : 0;

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        style={styles.container}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: true},
        )}>

        {/* ── Hero banner ── */}
        <View style={styles.bannerContainer}>
          <Animated.Image
            resizeMode="cover"
            source={{
              uri:
                service.image ||
                'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200',
            }}
            style={[
              styles.banner,
              {transform: [{translateY: imageTranslate}]},
            ]}
          />

          <View style={styles.darkOverlay} />

          <LinearGradient
            colors={
              isDark
                ? [
                    'transparent',
                    'rgba(15,23,42,0.15)',
                    'rgba(15,23,42,0.4)',
                    'rgba(15,23,42,0.8)',
                    colors.background,
                  ]
                : [
                    'transparent',
                    'rgba(248,250,252,0.15)',
                    'rgba(248,250,252,0.4)',
                    'rgba(248,250,252,0.8)',
                    colors.background,
                  ]
            }
            style={styles.gradientFade}
          />

          {/* Floating header row */}
          <View style={styles.floatingInfo}>
            <View style={styles.leftTopRow}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.8}
                onPress={handleBack}>
                <Ionicons
                  name={
                    language === 'ar'
                      ? 'chevron-forward'
                      : 'chevron-back'
                  }
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <View style={styles.badge}>
                <Ionicons
                  name="star"
                  size={12}
                  color="#FCD34D"
                />
                <Text style={styles.badgeText}>
                  4.8 {t('rating', language)}
                </Text>
              </View>
            </View>

            <View style={styles.badge}>
              <Ionicons
                name="time-outline"
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.badgeText}>
                {t('averageTime', language)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>

          {/* Title + starting price */}
          <Text style={styles.title}>
            {serviceName}
          </Text>

          <View style={styles.pricingRow}>
            <Text style={styles.startingText}>
              {t('startingFrom', language)}
            </Text>
            <Text style={styles.price}>
              {t('currency', language)} {lowestPrice}
            </Text>
          </View>

          <Text style={styles.description}>
            {serviceDescription}
          </Text>

          {/* Features card */}
          <View style={styles.featuresCard}>
           <Text style={styles.featureCardTitle}>
  {t('whyChooseUs', language)}
</Text>
            <View style={styles.featuresGrid}>
              {FEATURES.map((key, i) => (
                <View key={key} style={styles.featureItem}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons
                      name={FEATURE_ICONS[i] as any}
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.feature}>
                    {t(key, language)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Package heading */}
          <Text style={styles.optionHeading}>
            {t('chooseServiceOption', language)}
          </Text>

          {/* Package cards */}
          {options.map(option => {
            const isSelected =
              selectedOption?.id === option.id;

            const savings =
              option.originalPrice - option.offerPrice;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.selectedOption,
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedOption(option)}>

                {/* Card top row */}
                <View style={styles.optionTopRow}>
                  <Text style={[
                    styles.optionTitle,
                    isSelected && styles.optionTitleSelected,
                  ]}>
                    {getLocalizedText(option.name, language)}
                  </Text>

                  <View style={[
                    styles.checkBadge,
                    isSelected && styles.checkBadgeSelected,
                  ]}>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </View>

                {/* Pricing row */}
                <View style={styles.optionPriceRow}>
                  <Text style={styles.strikePrice}>
                    {t('currency', language)} {option.originalPrice}
                  </Text>
                  <Text style={[
                    styles.optionPrice,
                    isSelected && styles.optionPriceSelected,
                  ]}>
                    {t('currency', language)} {option.offerPrice}
                  </Text>
                  {savings > 0 && (
                    <View style={styles.savingsPill}>
<Text style={styles.savingsText}>
  {t('save', language)} {savings}
</Text>
                    </View>
                  )}
                </View>

                {/* Meta row: duration + staff */}
                <View style={styles.optionMetaRow}>
                  <View style={styles.optionMeta}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.optionMetaText}>
                      {getLocalizedText(option.duration, language)}
                    </Text>
                  </View>

                  <View style={styles.optionMeta}>
                    <Ionicons
                      name="people-outline"
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.optionMetaText}>
                      {option.staffCount}{' '}
                      {t('professionals', language)}
                    </Text>
                  </View>
                </View>

                {/* Includes list */}
                {option.includes?.length > 0 && (
                  <View style={styles.includesList}>
                    {option.includes.map(
                      (item: any, index: number) => (
                        <View
                          key={index}
                          style={styles.includesItem}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={
                              isSelected ? colors.primary : '#22C55E'
                            }
                          />
                          <Text style={styles.includesText}>
                            {getLocalizedText(item, language)}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                )}

              </TouchableOpacity>
            );
          })}

        </View>
      </Animated.ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomLabel}>
            {t('selectedPackage', language)}
          </Text>
          <Text style={styles.bottomPrice}>
            {selectedOption
              ? `${t('currency', language)} ${selectedOption.offerPrice}`
              : t('choosePackage', language)}
          </Text>
        </View>

        <TouchableOpacity
          disabled={!selectedOption}
          style={[
            styles.floatingButton,
            !selectedOption && styles.floatingButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleBookNow}>
          <Text style={styles.floatingButtonText}>
            {t('continue', language)}
          </Text>
          <Ionicons
            name={
              language === 'ar'
                ? 'arrow-back'
                : 'arrow-forward'
            }
            size={18}
            color="#FFFFFF"
            style={styles.buttonArrow}
          />
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default ServiceDetailsScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  root: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Banner ────────────────────────────────────────────────────────────────
  bannerContainer: {
    position: 'relative',
  },

  banner: {
    width: '100%',
    height: 500,
  },

  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },

  gradientFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 420,
  },

  floatingInfo: {
    position: 'absolute',
    top: 55,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  leftTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(8,8,8,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(8,8,8,0.42)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  badgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    marginTop: -220,
    paddingHorizontal: 20,
    paddingBottom: 140,
    zIndex: 50,
  },

  title: {
    fontSize: 36,
    lineHeight: 42,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -1,
  },

  pricingRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },

  startingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: Fonts.medium,
  },

  price: {
    fontSize: 32,
    color: colors.primary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
  },

  description: {
    marginTop: 14,
    color: '#475569',
    lineHeight: 24,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },

  // ── Features card ─────────────────────────────────────────────────────────
  featuresCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
    elevation: 3,
  },

  featureCardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.1,
  },

  featuresGrid: {
    gap: 10,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  feature: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },

  // ── Option heading ────────────────────────────────────────────────────────
  optionHeading: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: colors.textPrimary,
    marginTop: 28,
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  // ── Option cards ──────────────────────────────────────────────────────────
  optionCard: {
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
    elevation: 3,
  },

  selectedOption: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selectedCardBackground,
  },

  optionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
    marginRight: 10,
  },

  optionTitleSelected: {
    color: colors.primary,
  },

  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  optionPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  strikePrice: {
    textDecorationLine: 'line-through',
    color: colors.textHint,
    fontFamily: Fonts.regular,
    fontSize: 13,
  },

  optionPrice: {
    color: colors.primary,
    fontFamily: Fonts.bold,
    fontSize: 17,
  },

  optionPriceSelected: {
    color: colors.primary,
  },

  savingsPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },

  savingsText: {
    color: '#16A34A',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },

  optionMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },

  optionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  optionMetaText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },

  includesList: {
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  includesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  includesText: {
    color: '#475569',
    fontSize: 13,
    fontFamily: Fonts.medium,
    flex: 1,
  },

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: colors.card,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#1E293B',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 8},
    elevation: 16,
  },

  bottomLeft: {
    flex: 1,
    marginRight: 12,
  },

  bottomLabel: {
    color: colors.textHint,
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  bottomPrice: {
    marginTop: 4,
    fontSize: 18,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
  },

  floatingButton: {
    backgroundColor: colors.primary,
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 8,
  },

  floatingButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },

  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },

  buttonArrow: {
    marginLeft: 6,
  },
});
