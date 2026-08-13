import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';

import {useServiceStore} from '../../store/serviceStore';
import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';
import {Fonts} from '../../constants/fonts';
import {useTheme} from '../../hooks/useTheme';
import {getLocalizedText} from '../../utils/getLocalizedText';
import Skeleton from '../../components/skeleton/Skeleton';

// Mirrors the real card's shape (image block + meta chips + title + two
// description lines + button) so swapping skeleton for real content never
// shifts layout.
const FeaturedCardSkeleton = ({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) => (
  <View style={styles.card}>
    <Skeleton height={280} borderRadius={0} />
    <View style={styles.cardBody}>
      <View style={styles.metaRow}>
        <Skeleton width={70} height={24} borderRadius={50} />
        <Skeleton width={90} height={24} borderRadius={50} />
        <Skeleton width={80} height={24} borderRadius={50} />
      </View>
      <Skeleton width="70%" height={20} borderRadius={6} style={{marginBottom: 10}} />
      <Skeleton width="100%" height={14} borderRadius={6} style={{marginBottom: 6}} />
      <Skeleton width="55%" height={14} borderRadius={6} style={{marginBottom: 16}} />
      <Skeleton width="100%" height={48} borderRadius={16} />
    </View>
  </View>
);


const getServiceMeta = (
  categoryCode = '',
) => {

  switch (categoryCode) {

    case 'cleaning':
      return [
        {icon: 'time-outline',             labelKey: 'meta_cleaning_duration'},
        {icon: 'people-outline',           labelKey: 'meta_cleaning_staff'},
        {icon: 'shield-checkmark-outline', labelKey: 'meta_insured'},
      ];

    case 'ac_service':
      return [
        {icon: 'time-outline',     labelKey: 'meta_ac_duration'},
        {icon: 'construct-outline',labelKey: 'meta_certified_tech'},
        {icon: 'refresh-outline',  labelKey: 'meta_warranty'},
      ];

    case 'plumbing':
      return [
        {icon: 'time-outline',           labelKey: 'meta_plumbing_duration'},
        {icon: 'document-text-outline',  labelKey: 'meta_licensed'},
        {icon: 'alert-circle-outline',   labelKey: 'meta_emergency'},
      ];

    case 'electrical':
      return [
        {icon: 'time-outline',             labelKey: 'meta_electrical_duration'},
        {icon: 'flash-outline',            labelKey: 'meta_certified'},
        {icon: 'shield-checkmark-outline', labelKey: 'meta_insured'},
      ];

    case 'pest_control':
      return [
        {icon: 'time-outline',              labelKey: 'meta_pest_duration'},
        {icon: 'shield-checkmark-outline',  labelKey: 'meta_safe_treatment'},
        {icon: 'checkmark-circle-outline',  labelKey: 'meta_guaranteed'},
      ];

    default:
      return [
        {icon: 'time-outline', labelKey: 'meta_default_duration'},
      ];
  }

};

const getServiceIcon = (
  categoryCode = '',
) => {

  switch (categoryCode) {

    case 'cleaning':
      return 'sparkles-outline';

    case 'ac_service':
      return 'snow-outline';

    case 'plumbing':
      return 'water-outline';

    case 'electrical':
      return 'flash-outline';

    case 'pest_control':
      return 'shield-checkmark-outline';

    default:
      return 'home-outline';

  }

};

const FeaturedSection = ({navigation}: any) => {
  const services = useServiceStore(state => state.filteredServices);
  const servicesLoading = useServiceStore(state => state.loading);
  const servicesError = useServiceStore(state => state.error);
  const loadServices = useServiceStore(state => state.loadServices);
  const language = useLanguageStore(state => state.language);

  const {colors, isDark} = useTheme();
  const styles = createStyles(colors);

  const showSkeleton = servicesLoading && services.length === 0;

  // services.length === 0 alone is ambiguous — it's also true while a
  // category/search filter genuinely matches nothing, or while the list is
  // genuinely empty. servicesError distinguishes "the request failed" so
  // this doesn't silently render an empty section either way.
  const showError =
    !showSkeleton && servicesError && services.length === 0;

  return (
    <View style={styles.section}>

      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{t('services', language)}</Text>
        <View style={styles.countBadge}>
          <Ionicons name="list-outline" size={13} color={colors.primary} />
          {showSkeleton ? (
            <Skeleton width={60} height={12} borderRadius={6} />
          ) : (
            <Text style={styles.countText}>
              {services.length} {t('available', language)}
            </Text>
          )}
        </View>
      </View>

      {/* ── Cards ── */}
      {showSkeleton && (
        <>
          <FeaturedCardSkeleton styles={styles} />
          <FeaturedCardSkeleton styles={styles} />
        </>
      )}

      {showError && (
        <TouchableOpacity
          style={styles.errorCard}
          activeOpacity={0.85}
          onPress={() => loadServices()}>
          <Ionicons name="cloud-offline-outline" size={26} color={colors.textSecondary} />
          <Text style={styles.errorText}>
            {t('failedToLoadServices', language)}
          </Text>
          <View style={styles.retryBtn}>
            <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>{t('retry', language)}</Text>
          </View>
        </TouchableOpacity>
      )}

      {!showSkeleton && !showError && services.map((service: any) => {

const serviceName =
  getLocalizedText(
    service.name,
    language,
  );

const serviceDescription =
  getLocalizedText(
    service.description,
    language,
  );

const categoryName =
  getLocalizedText(
    service.category?.name,
    language,
  );

const meta =
  getServiceMeta(
    service.category?.code,
  );

const icon =
  getServiceIcon(
    service.category?.code,
  );

        return (
          <TouchableOpacity
            key={service.id}
            style={styles.card}
            activeOpacity={0.96}
            onPress={() => navigation.navigate('ServiceDetails', {service})}>

            {/* Separate wrapper for the rounded/clipped content, apart from
                the outer shadow — combining borderRadius + overflow:'hidden'
                + elevation on the same Android view is what let a hairline
                sliver of the raw image show through at the image/body seam
                on some cards; splitting the shadow layer from the clip
                layer removes that seam without changing how the card looks. */}
            <View style={styles.cardInner}>

            {/* IMAGE BLOCK */}
            <View style={styles.imageBlock}>
<ImageBackground
  source={{
    uri:
      service.image ||
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200',
  }}
  style={styles.image}
  imageStyle={styles.imageStyle}
>
                {/* Top badges row */}
                <View style={styles.topBadgesRow}>
                  {/* Category badge — dark glass, always readable */}
                  <View style={styles.catBadge}>
                    <Ionicons name={icon} size={13} color="#FFFFFF" />
                    <Text style={styles.catBadgeText}>
                      {categoryName || t('homeCare', language)}
                    </Text>
                  </View>

                  {/* A real per-service rating/review count is not
                      available from the API today — a fabricated "4.9 ·
                      320 reviews" badge previously rendered identically on
                      every card regardless of actual service. Removed
                      rather than show data that isn't real; re-add once a
                      real rating field exists. */}
                </View>

                {/* Fade gradient — blends image into the card body below.
                    Same shape/stops in both themes; only the target color
                    changes to match the card surface underneath it. */}
                <LinearGradient
                  colors={
                    isDark
                      ? [
                          'transparent',
                          'rgba(30,41,59,0.0)',
                          'rgba(30,41,59,0.62)',
                          'rgba(30,41,59,0.97)',
                          colors.card,
                        ]
                      : [
                          'transparent',
                          'rgba(255,255,255,0.0)',
                          'rgba(255,255,255,0.62)',
                          'rgba(255,255,255,0.97)',
                          colors.card,
                        ]
                  }
                  locations={[0, 0.15, 0.48, 0.72, 1]}
                  style={styles.fadeGradient}>

                  {/* Title + price inside the bright fade area */}
                  <Text numberOfLines={2} style={styles.cardTitle}>
                    {serviceName}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>
                      {t('startingFrom', language)}
                    </Text>
                    <Text style={styles.priceValue}>
                      {t('currency', language)} {service.startingPrice}
                    </Text>
                  </View>

                </LinearGradient>

              </ImageBackground>
            </View>

            {/* CARD BODY */}
            <View style={styles.cardBody}>

              {/* Meta chips */}
              <View style={styles.metaRow}>
                {meta.map((item, i) => (
                  <View key={i} style={styles.metaChip}>
                    <Ionicons name={item.icon as any} size={12} color={colors.textSecondary} />
                    <Text style={styles.metaChipText}>
                      {t(item.labelKey, language)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Description */}
              <Text numberOfLines={2} style={styles.cardDesc}>
                {serviceDescription}
              </Text>

              {/* Book button */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.bookButton}
                onPress={() =>
                  navigation.navigate(
                    'ServiceDetails',
                    {service},
                  )
                }>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.bookText}>
                  {t('bookNow', language)}
                </Text>
              </TouchableOpacity>

            </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default FeaturedSection;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  section: {
    marginTop: 34,
  },

  /* ── Header ── */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
  },
  countText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },

  /* ── Error state ── */
  errorCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },

  /* ── Card shell ──
     Shadow/elevation lives on the outer, unclipped view; borderRadius +
     overflow:'hidden' + background live on the inner `cardInner` wrapper.
     Combining all of these on one Android view is what caused a hairline
     sliver of the raw image to show through at the image/body seam on some
     cards — separating the shadow layer from the clip layer fixes that
     without changing how the card looks. */
  card: {
    backgroundColor: colors.card,
    borderRadius: 30,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: {width: 0, height: 10},
    elevation: 10,
  },
  cardInner: {
    backgroundColor: colors.card,
    borderRadius: 30,
    overflow: 'hidden',
  },

  /* ── Image block ── */
  imageBlock: {
    height: 280,
  },
  image: {
    flex: 1,
  },
  imageStyle: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  /* Top badges — both dark glass for consistent readability */
  topBadgesRow: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,23,42,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 50,
  },
  catBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.2,
  },
  /* Fade gradient — image dissolves into white card body */
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontFamily: Fonts.bold,
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  priceValue: {
    color: colors.primary,
    fontSize: 22,
    fontFamily: Fonts.bold,
    letterSpacing: -0.4,
  },

  /* ── Card body ── */
  cardBody: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },

  metaRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 50,
  },
  metaChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.medium,
  },

  cardDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 22,
    fontFamily: Fonts.regular,
    marginBottom: 16,
  },

  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
  },
  bookText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.1,
  },
});
