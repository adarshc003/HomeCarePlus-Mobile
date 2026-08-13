import React, {useMemo, useState} from 'react';

import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import {Fonts} from '../../constants/fonts';
import {useTheme} from '../../hooks/useTheme';
import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';
import OfferCard from './OfferCard';

import Ionicons from '@react-native-vector-icons/ionicons';

interface Props {
  visible: boolean;
  offers: any[];
  selectedOffer?: any;
  onClose: () => void;
  onApply: (offer: any) => void;
  onApplyCoupon: (couponCode: string) => void;
  onRemove?: () => void;
  applying?: boolean;
}

const CouponBottomSheet = ({
  visible,
  offers,
  selectedOffer,
  onClose,
  onApply,
  onApplyCoupon,
  onRemove,
  applying = false,
}: Props) => {

  const language = useLanguageStore(
    state => state.language,
  );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const [search, setSearch] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  const filteredOffers = useMemo(() => {
    if (!search.trim()) {
      return offers;
    }

    const keyword = search.toLowerCase();

    return offers.filter(offer => {
      const title =
        language === 'ar'
          ? offer.title.ar
          : offer.title.en;

      const description =
        language === 'ar'
          ? offer.description.ar
          : offer.description.en;

      return (
        offer.couponCode.toLowerCase().includes(keyword) ||
        title.toLowerCase().includes(keyword) ||
        description.toLowerCase().includes(keyword)
      );
    });
  }, [offers, search, language]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent>

      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>

          {/* ── Handle ── */}
          <View style={styles.handle} />

          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Ionicons
                  name="pricetag"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={styles.title}>
                  {t('offersAndCoupons', language)}
                </Text>
                <Text style={styles.subtitle}>
                  {t('offersAndCouponsSubtitle', language)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.7}
              onPress={onClose}>
              <Ionicons
                name="close"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* ── Coupon input row ── */}
          <View style={styles.couponRow}>
            <View style={[
              styles.inputWrap,
              inputFocused && styles.inputWrapFocused,
            ]}>
              <Ionicons
                name="ticket-outline"
                size={17}
                color={inputFocused ? colors.primary : colors.textHint}
              />
              <TextInput
                value={search}
                onChangeText={setSearch}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={t('enterCouponCode', language)}
                placeholderTextColor="#CBD5E1"
                style={styles.input}
                autoCapitalize="characters"
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  activeOpacity={0.7}>
                  <Ionicons
                    name="close-circle"
                    size={17}
                    color="#CBD5E1"
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.applyBtn,
                (!search.trim() || applying) && styles.applyBtnDisabled,
              ]}
              disabled={!search.trim() || applying}
              activeOpacity={0.85}
              onPress={() => onApplyCoupon(search.trim())}>
              {applying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.applyBtnText}>
                  {t('apply', language)}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Section title ── */}
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleAccent} />
            <Text style={styles.sectionTitle}>
              {t('availableOffers', language)}
            </Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>
                {filteredOffers.length}
              </Text>
            </View>
          </View>

          {/* ── Offers list ── */}
          <FlatList
            data={filteredOffers}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons
                    name="search-outline"
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {t('noMatchingOffers', language)}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {t('tryDifferentCode', language)}
                </Text>
              </View>
            }
            renderItem={({item, index}) => (
              <OfferCard
                offer={item}
                onApply={onApply}
                onRemove={onRemove}
                applied={selectedOffer?._id === item._id}
                isLast={index === filteredOffers.length - 1}
                applying={applying}
              />
            )}
          />

        </View>

      </View>

    </Modal>
  );
};

export default CouponBottomSheet;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 0,
    maxHeight: '85%',
  },

  // ── Handle ────────────────────────────────
  handle: {
    width: 44,
    height: 4,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // ── Header ────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },

  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  subtitle: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },

  // ── Coupon input row ──────────────────────
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },

  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },

  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },

  input: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
    letterSpacing: 0.8,
    paddingVertical: 0,
  },

  applyBtn: {
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 5,
  },

  applyBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },

  applyBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 14,
  },

  // ── Section title ─────────────────────────
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  sectionTitleAccent: {
    width: 4,
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
    letterSpacing: -0.1,
  },

  sectionCountBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 20,
  },

  sectionCountText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },

  // ── List ──────────────────────────────────
  listContent: {
    paddingBottom: 32,
  },

  // ── Empty state ───────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 36,
  },

  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 5,
  },

  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.textHint,
  },
});
