import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import {getAddOns} from '../../services/serviceService';
import {useBookingStore} from '../../store/bookingStore';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import {getLocalizedText} from '../../utils/getLocalizedText';

import {useAppDataStore} from '../../store/appDataStore';

import Ionicons from '@react-native-vector-icons/ionicons';

import {getEligibleOffers} from '../../services/offerService';

import {useOfferStore} from '../../store/offerStore';

const AddOnScreen = ({navigation}: any) => {

  const [addOns, setAddOns] = useState<any[]>([]);
  const bookingSelectedAddOns =
  useBookingStore(
    state => state.selectedAddOns,
  );

const [selectedAddOns, setSelectedAddOns] =
  useState<any[]>(
    bookingSelectedAddOns,
  );

  const selectedService = useBookingStore(
    state => state.selectedService,
  );

  const selectedPackage = useBookingStore(
    state => state.selectedPackage,
  );

const cachedAddOns = useAppDataStore(
  state => state.addOns[selectedService?.id || ''],
);

const setOffers = useAppDataStore(
  state => state.setOffers,
);

const clearOffer = useOfferStore(
  state => state.clearOffer,
);

const clearOffers = useAppDataStore(
  state => state.clearOffers,
);

const setOffersLoading = useAppDataStore(
  state => state.setOffersLoading,
);

  const saveAddOns = useBookingStore(
    state => state.setSelectedAddOns,
  );

  const language = useLanguageStore(
    state => state.language,
  );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  useEffect(() => {
    if (cachedAddOns && cachedAddOns.length > 0) {
      setAddOns(cachedAddOns);
      return;
    }

    loadAddOns();
  }, [cachedAddOns]);

  const loadAddOns = async () => {
    try {
      if (!selectedService) {
        return;
      }

      const data = await getAddOns(selectedService.id);
      setAddOns(data.addOns || []);
    } catch (error) {
      console.log(error);
    }
  };

  const toggleAddOn = (addOn: any) => {
    const exists = selectedAddOns.find(
      item => item.id === addOn.id,
    );

    if (exists) {
      setSelectedAddOns(
        selectedAddOns.filter(item => item.id !== addOn.id),
      );
    } else {
      setSelectedAddOns([...selectedAddOns, addOn]);
    }
  };

  const addOnTotal = selectedAddOns.reduce(
    (total, item) => total + item.price,
    0,
  );

  const servicePrice = selectedPackage?.offerPrice || 0;

  const grandTotal = servicePrice + addOnTotal;

const handleContinue = () => {
  saveAddOns(selectedAddOns);

  clearOffer(); 
  clearOffers();

  navigation.navigate('Schedule');

  if (!selectedService) {
    return;
  }

  clearOffers();
  setOffersLoading(true);

  getEligibleOffers(
    selectedService.id,
    grandTotal,
  )
    .then(response => {
      setOffers(response.offers || []);
    })
    .catch(error => {
      console.log(error);
    })
    .finally(() => {
      setOffersLoading(false);
    });
};

  return (
    <View style={styles.container}>
      <FlatList
        data={addOns}
        contentContainerStyle={styles.listContent}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}

        // ── List header ──────────────────────────────────────────────────────
        ListHeaderComponent={
          <>
            {/* Header */}
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
                    {t('customizeBooking', language)}
                  </Text>
                  <Text style={styles.subtitle}>
                    {t('addExtrasSubtitle', language)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardTop}>
                <View style={styles.packageChip}>
                  <Ionicons
                    name="cube-outline"
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={styles.packageChipText}>
                    {t('selectedPackage', language)}
                  </Text>
                </View>

                <View style={styles.summaryPricePill}>
                  <Text style={styles.summaryPrice}>
                    {t('currency', language)} {selectedPackage?.offerPrice}
                  </Text>
                </View>
              </View>

              <Text style={styles.summaryName}>
                {getLocalizedText(selectedPackage?.name, language)}
              </Text>

              <Text style={styles.heroDescription}>
                {t('addExtrasSubtitle', language)}
              </Text>
            </View>

            {/* Section title */}
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleAccent} />
              <Text style={styles.sectionTitle}>
                {t('recommendedAddOns', language)}
              </Text>
              {addOns.length > 0 && (
                <View style={styles.sectionCountBadge}>
                  <Text style={styles.sectionCountText}>
                    {addOns.length}
                  </Text>
                </View>
              )}
            </View>
          </>
        }

        // ── Add-on cards ─────────────────────────────────────────────────────
        renderItem={({item}) => {
          const selected = selectedAddOns.some(
            addOn => addOn.id === item.id,
          );

          return (
            <TouchableOpacity
              style={[
                styles.card,
                selected && styles.selectedCard,
              ]}
              activeOpacity={0.8}
              onPress={() => toggleAddOn(item)}>

              <View style={styles.cardRow}>
                <View style={styles.cardTextBlock}>
                  <Text style={[
                    styles.name,
                    selected && styles.nameSelected,
                  ]}>
                    {getLocalizedText(item.name, language)}
                  </Text>

                  <Text style={styles.description}>
                    {getLocalizedText(item.description, language)}
                  </Text>
                </View>

                <View style={styles.cardRight}>
                  <Text style={[
                    styles.price,
                    selected && styles.priceSelected,
                  ]}>
                    {t('currency', language)} {item.price}
                  </Text>

                  <View style={[
                    styles.checkBox,
                    selected && styles.checkBoxSelected,
                  ]}>
                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </View>
              </View>

            </TouchableOpacity>
          );
        }}

        // ── Total card ───────────────────────────────────────────────────────
        ListFooterComponent={
          <View style={styles.totalCard}>

            <View style={styles.totalCardHeader}>
              <View style={styles.totalCardIconWrap}>
                <Ionicons
                  name="receipt-outline"
                  size={15}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.totalLabel}>
                {t('selectedAddOns', language)}
              </Text>
              {selectedAddOns.length > 0 && (
                <View style={styles.totalCountBadge}>
                  <Text style={styles.totalCountText}>
                    {selectedAddOns.length} {t('items', language)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.totalDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalText}>
                {t('service', language)}
              </Text>
              <Text style={styles.totalText}>
                {t('currency', language)} {servicePrice}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalText}>
                {t('addOns', language)}
              </Text>
              <Text style={styles.totalText}>
                {t('currency', language)} {addOnTotal}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.grandLabel}>
                {t('total', language)}
              </Text>
              <Text style={styles.grandTotal}>
                {t('currency', language)} {grandTotal}
              </Text>
            </View>

          </View>
        }
      />

      {/* ── Sticky footer ── */}
      <View style={styles.stickyFooter}>

        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>
            {t('total', language)}
          </Text>
          <Text style={styles.footerPrice}>
            {t('currency', language)} {grandTotal}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.footerButton}
          activeOpacity={0.85}
          onPress={handleContinue}>
          <Text style={styles.footerButtonText}>
            {t('continue', language)}
          </Text>
          <Ionicons
            name={
              language === 'ar' ? 'arrow-back' : 'arrow-forward'
            }
            size={17}
            color="#FFFFFF"
            style={styles.footerButtonIcon}
          />
        </TouchableOpacity>

      </View>

    </View>
  );
};

export default AddOnScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // ── Header ──────────────────────────────
  headerContainer: {
    marginTop: 56,
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

  subtitle: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },

  // ── Summary card ─────────────────────────
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },

  summaryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  packageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  packageChipText: {
    color: colors.primary,
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },

  summaryPricePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  summaryPrice: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },

  summaryName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
    lineHeight: 22,
  },

  heroDescription: {
    color: colors.textSecondary,
    marginTop: 5,
    lineHeight: 20,
    fontFamily: Fonts.regular,
    fontSize: 13,
  },

  // ── Section title ─────────────────────────
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },

  sectionTitleAccent: {
    width: 4,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  sectionTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },

  sectionCountBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },

  sectionCountText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },

  // ── Add-on cards ──────────────────────────
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selectedCardBackground,
  },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  cardTextBlock: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
    lineHeight: 20,
  },

  nameSelected: {
    color: colors.primary,
  },

  description: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },

  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    flexShrink: 0,
  },

  price: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
  },

  priceSelected: {
    color: colors.primary,
  },

  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },

  checkBoxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // ── Total card ────────────────────────────
  totalCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
    elevation: 3,
  },

  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },

  totalCardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  totalLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  totalCountBadge: {
    backgroundColor: colors.divider,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },

  totalCountText: {
    color: colors.textSecondary,
    fontFamily: Fonts.medium,
    fontSize: 12,
  },

  totalDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: 14,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  totalText: {
    color: '#475569',
    fontFamily: Fonts.medium,
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  grandLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
  },

  grandTotal: {
    fontSize: 20,
    color: colors.primary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
  },

  // ── Sticky footer ─────────────────────────
  stickyFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 14,
    paddingLeft: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 8},
    elevation: 12,
  },

  footerLeft: {
    flex: 1,
    marginRight: 12,
  },

  footerLabel: {
    color: colors.textHint,
    fontSize: 10,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  footerPrice: {
    marginTop: 3,
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
  },

  footerButton: {
    backgroundColor: colors.primary,
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },

  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },

  footerButtonIcon: {
    marginLeft: 6,
  },
});
