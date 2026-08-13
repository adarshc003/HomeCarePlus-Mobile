import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import {Fonts} from '../../constants/fonts';
import {useTheme} from '../../hooks/useTheme';
import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';
import OfferCard from './OfferCard';

interface Props {
  offers: any[];

  onViewAll: () => void;

  onApply: (offer: any) => void;

  onRemove?: () => void;

  selectedOffer?: any;

  applying?: boolean;
}

const AvailableOffersCard = ({
  offers,
  onViewAll,
  onApply,
  onRemove,
  selectedOffer,
  applying = false,
}: Props) => {

  const language =
    useLanguageStore(
      state => state.language,
    );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  if (offers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>

        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <View style={styles.titleAccent} />
            <Text style={styles.title}>
              {t('availableOffers', language)}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {offers.length}
              </Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            {t('availableOffersSubtitle', language)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={onViewAll}
          activeOpacity={0.7}>
          <Text style={styles.viewAll}>
            {t('viewAll', language)}
          </Text>
          <Text style={styles.viewAllArrow}>
            {language === 'ar' ? '←' : '→'}
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.divider} />

      {offers
        .slice(0, 2)
        .map((offer, index) => (
          <OfferCard
            key={offer._id}
            offer={offer}
            onApply={onApply}
            onRemove={onRemove}
            applied={
              selectedOffer?._id ===
              offer._id
            }
            isLast={index === Math.min(offers.length, 2) - 1}
            applying={applying}
          />
        ))}

    </View>
  );
};

export default AvailableOffersCard;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  container: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginTop: 18,
    elevation: 3,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  headerLeft: {
    flex: 1,
    marginRight: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  titleAccent: {
    width: 4,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  title: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },

  countText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  viewAll: {
    fontFamily: Fonts.semiBold,
    color: colors.primary,
    fontSize: 13,
  },

  viewAllArrow: {
    fontFamily: Fonts.semiBold,
    color: colors.primary,
    fontSize: 13,
  },

  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: 14,
  },

});
