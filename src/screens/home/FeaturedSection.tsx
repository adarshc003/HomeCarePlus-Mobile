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
import {getLocalizedText} from '../../utils/getLocalizedText';


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
  const language = useLanguageStore(state => state.language);

  return (
    <View style={styles.section}>

      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{t('services', language)}</Text>
        <View style={styles.countBadge}>
          <Ionicons name="list-outline" size={13} color="#2563EB" />
          <Text style={styles.countText}>
            {services.length} {t('available', language)}
          </Text>
        </View>
      </View>

      {/* ── Cards ── */}
      {services.map((service: any) => {

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

                  {/* Rating badge — dark glass */}
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={11} color="#FCD34D" />
                    <Text style={styles.ratingText}>
                      4.9 · 320
                    </Text>
                    <Text style={styles.ratingText}>
                      {t('reviews', language)}
                    </Text>
                  </View>
                </View>

                {/* Fade-to-white gradient — blends image into card */}
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(255,255,255,0.0)',
                    'rgba(255,255,255,0.62)',
                    'rgba(255,255,255,0.97)',
                    '#FFFFFF',
                  ]}
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
                    <Ionicons name={item.icon as any} size={12} color="#64748B" />
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
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default FeaturedSection;

const styles = StyleSheet.create({

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
    color: '#0F172A',
    fontFamily: Fonts.bold,
    letterSpacing: -0.6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
  },
  countText: {
    color: '#2563EB',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },

  /* ── Card shell ── */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: {width: 0, height: 10},
    elevation: 10,
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
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15,23,42,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
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
    color: '#0F172A',
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
    color: '#64748B',
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  priceValue: {
    color: '#1D4ED8',
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
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 50,
  },
  metaChipText: {
    color: '#334155',
    fontSize: 11,
    fontFamily: Fonts.medium,
  },

  cardDesc: {
    color: '#64748B',
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
    backgroundColor: '#1D4ED8',
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
