import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import {Fonts} from '../../constants/fonts';
import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';
import Icon from '@react-native-vector-icons/ionicons';

interface OfferCardProps {
  offer: any;

  onApply: (
    offer: any,
  ) => void;

  onRemove?: () => void;

  applied?: boolean;

  isLast?: boolean;
}

const OfferCard = ({
  offer,
  onApply,
  onRemove,
  applied = false,
  isLast = false,
}: OfferCardProps) => {
  const language =
    useLanguageStore(
      state => state.language,
    );

  const isPercentage =
    offer.discountType === 'PERCENTAGE';

  return (
    <View
      style={[
        styles.container,
        applied && styles.containerApplied,
        isLast && styles.containerLast,
      ]}>

      {/* Applied glow border */}
      {applied && (
        <View style={styles.appliedBorderTop} />
      )}

      <View style={styles.topRow}>

        {/* Gift icon blob */}
        <View style={[
          styles.iconWrap,
          applied && styles.iconWrapApplied,
        ]}>
          <Text style={styles.icon}>🎁</Text>
        </View>

        {/* Code badge + discount pill */}
        <View style={styles.badgeRow}>
          <View style={[
            styles.codeBadge,
            applied && styles.codeBadgeApplied,
          ]}>
            <Icon
              name="pricetag-outline"
              size={11}
              color={applied ? '#2563EB' : '#16A34A'}
            />
            <Text style={[
              styles.code,
              applied && styles.codeApplied,
            ]}>
              {offer.couponCode}
            </Text>
          </View>

          <View style={[
            styles.discountPill,
            applied && styles.discountPillApplied,
          ]}>
            <Text style={[
              styles.discountPillText,
              applied && styles.discountPillTextApplied,
            ]}>
              {isPercentage
                ? `${offer.discountValue}% ${t('off', language)}`
                : `${t('currency', language)} ${offer.discountValue} ${t('off', language)}`}
            </Text>
          </View>
        </View>

      </View>

      {/* Title + description */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>
          {language === 'ar'
            ? offer.title.ar
            : offer.title.en}
        </Text>

        <Text style={styles.description}>
          {language === 'ar'
            ? offer.description.ar
            : offer.description.en}
        </Text>
      </View>

      {/* Apply / Remove button */}
      <TouchableOpacity
        style={[
          styles.button,
          applied && styles.appliedButton,
        ]}
        activeOpacity={0.75}
        onPress={() => {
          if (applied) {
            onRemove?.();
          } else {
            onApply(offer);
          }
        }}>
        {applied && (
          <Icon
            name="checkmark-circle"
            size={15}
            color="#2563EB"
            style={styles.buttonIcon}
          />
        )}
        <Text
          style={[
            styles.buttonText,
            applied && styles.appliedText,
          ]}>
          {applied
            ? t('remove', language)
            : t('apply', language)}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default OfferCard;

const styles = StyleSheet.create({

  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  containerApplied: {
    backgroundColor: '#FAFBFF',
    borderColor: '#2563EB',
  },

  containerLast: {
    marginBottom: 0,
  },

  appliedBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#2563EB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF9EC',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  iconWrapApplied: {
    backgroundColor: '#EEF2FF',
  },

  icon: {
    fontSize: 20,
  },

  badgeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },

  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },

  codeBadgeApplied: {
    backgroundColor: '#EEF2FF',
  },

  code: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#16A34A',
    letterSpacing: 0.3,
  },

  codeApplied: {
    color: '#2563EB',
  },

  discountPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },

  discountPillApplied: {
    backgroundColor: '#EEF2FF',
  },

  discountPillText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: '#EA580C',
  },

  discountPillTextApplied: {
    color: '#2563EB',
  },

  textBlock: {
    marginBottom: 12,
  },

  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
  },

  description: {
    marginTop: 3,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2563EB',
  },

  appliedButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7CEFF',
  },

  buttonIcon: {
    marginRight: 5,
  },

  buttonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 13,
  },

  appliedText: {
    color: '#2563EB',
  },

});
