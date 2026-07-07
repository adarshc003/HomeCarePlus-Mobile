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

interface Props {
  packageAmount: number;
  addOnAmount: number;
  subtotal: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  selectedOffer?: any;
  onRemoveCoupon: () => void;
}

const PriceSummaryCard = ({
  packageAmount,
  addOnAmount,
  subtotal,
  originalAmount,
  discountAmount,
  finalAmount,
  selectedOffer,
  onRemoveCoupon,
}: Props) => {

  const language = useLanguageStore(
    state => state.language,
  );

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        {t('paymentSummary', language)}
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>
          {t('package', language)}
        </Text>
        <Text style={styles.value}>
          {t('currency', language)} {packageAmount.toFixed(2)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>
          {t('addOns', language)}
        </Text>
        <Text style={styles.value}>
          {t('currency', language)} {addOnAmount.toFixed(2)}
        </Text>
      </View>

      {subtotal > packageAmount && (
        <View style={styles.row}>
          <Text style={styles.label}>
            {t('subtotal', language)}
          </Text>
          <Text style={styles.value}>
            {t('currency', language)} {subtotal.toFixed(2)}
          </Text>
        </View>
      )}

      {selectedOffer && (
        <>
          <View style={styles.row}>
            <Text style={styles.discountLabel}>
              {t('coupon', language)} ({selectedOffer.couponCode})
            </Text>
            <Text style={styles.discountValue}>
              - {t('currency', language)}{' '}
              {discountAmount.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity onPress={onRemoveCoupon}>
            <Text style={styles.remove}>
              {t('removeCoupon', language)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.savedText}>
            {t('youSaved', language)} {t('currency', language)}{' '}
            {discountAmount} 🎉
          </Text>
        </>
      )}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          {t('totalPayable', language)}
        </Text>
        <Text style={styles.total}>
          {t('currency', language)} {finalAmount.toFixed(2)}
        </Text>
      </View>

    </View>
  );
};

export default PriceSummaryCard;

const styles = StyleSheet.create({

  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
  },

  title: {
    fontSize: 18,
    color: '#111827',
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
    color: '#111827',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

  discountLabel: {
    color: '#16A34A',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },

  discountValue: {
    color: '#16A34A',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },

  remove: {
    color: '#2563EB',
    marginBottom: 14,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
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
  },

  totalLabel: {
    fontSize: 20,
    color: '#111827',
    fontFamily: Fonts.bold,
  },

  total: {
    fontSize: 28,
    color: '#2563EB',
    fontFamily: Fonts.bold,
  },

  savedText: {
    color: '#16A34A',
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    marginBottom: 12,
  },
});
