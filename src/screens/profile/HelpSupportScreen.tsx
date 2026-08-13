import React, {useRef, useState} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  UIManager,
  LayoutAnimation,
  Animated,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import Ionicons from '@react-native-vector-icons/ionicons';

import {useNavigation} from '@react-navigation/native';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import {SUPPORT_CONTACT} from '../../constants/supportContact';

import {HELP_FAQ_CONTENT} from '../../content/helpFaqContent';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Account-deletion contact details are specific to this policy/process and
// intentionally separate from SUPPORT_CONTACT (general support), which may
// use a different email/phone.
const DELETE_ACCOUNT_CONTACT = {
  email: 'admin@hcare.plus',
  phone: '+919747869897',
} as const;

// Rotates a chevron 0deg -> 90deg when expanded, same pattern as
// ProfileScreen.tsx's AnimatedChevron (not exported from there, so
// duplicated locally — every screen in this app hand-rolls its own styles).
const AnimatedChevron = ({
  expanded,
  color,
}: {
  expanded: boolean;
  color: string;
}) => {
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View style={{transform: [{rotate}]}}>
      <Ionicons name="chevron-forward" size={16} color={color} />
    </Animated.View>
  );
};

const HelpSupportScreen = () => {
  const navigation = useNavigation();

  const language = useLanguageStore(state => state.language);

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);

  const faqEntries = HELP_FAQ_CONTENT[language];

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const toggleFaq = (id: string) => {
    animate();
    setActiveFaqId(current => (current === id ? null : id));
  };

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_CONTACT.email}`);
  };

  const handleCallSupport = () => {
    Linking.openURL(`tel:${SUPPORT_CONTACT.phone}`);
  };

  const handleDeleteAccountEmail = () => {
    Linking.openURL(`mailto:${DELETE_ACCOUNT_CONTACT.email}`);
  };

  const handleDeleteAccountCall = () => {
    Linking.openURL(`tel:${DELETE_ACCOUNT_CONTACT.phone}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('back', language)}>
            <Ionicons
              name={language === 'ar' ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {t('helpSupport', language)}
          </Text>
        </View>

        {/* ── Hero ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="headset" size={34} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>
            {t('needHelp', language)}
          </Text>
          <Text style={styles.heroSubtitle}>
            {t('needHelpIntro', language)}
          </Text>
        </View>

        {/* ── Contact info ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.8}
            onPress={handleEmailSupport}
            accessibilityRole="button"
            accessibilityLabel={t('emailSupport', language)}>
            <View style={styles.contactIconWrap}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.contactTextBlock}>
              <Text style={styles.contactLabel}>
                {t('emailSupport', language)}
              </Text>
              <Text style={styles.contactValue}>
                {SUPPORT_CONTACT.email}
              </Text>
            </View>
            <Ionicons
              name={language === 'ar' ? 'chevron-back' : 'chevron-forward'}
              size={16}
              color={colors.textHint}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.8}
            onPress={handleCallSupport}
            accessibilityRole="button"
            accessibilityLabel={t('callSupport', language)}>
            <View style={styles.contactIconWrap}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.contactTextBlock}>
              <Text style={styles.contactLabel}>
                {t('callSupport', language)}
              </Text>
              <Text style={styles.contactValue}>
                {SUPPORT_CONTACT.phone}
              </Text>
            </View>
            <Ionicons
              name={language === 'ar' ? 'chevron-back' : 'chevron-forward'}
              size={16}
              color={colors.textHint}
            />
          </TouchableOpacity>
        </View>

        {/* ── Support hours / Response time ── */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>
              {t('supportHours', language)}
            </Text>
            <Text style={styles.statValue}>
              {t('supportHoursValue', language)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="flash-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>
              {t('responseTime', language)}
            </Text>
            <Text style={styles.statValue}>
              {t('responseTimeValue', language)}
            </Text>
          </View>
        </View>

        {/* ── FAQ ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('faq', language)}
          </Text>

          <View style={styles.faqCard}>
            {faqEntries.map((entry, index) => {
              const isOpen = activeFaqId === entry.id;
              const isLast = index === faqEntries.length - 1;

              return (
                <React.Fragment key={entry.id}>
                  <TouchableOpacity
                    style={styles.faqRow}
                    activeOpacity={0.8}
                    onPress={() => toggleFaq(entry.id)}
                    accessibilityRole="button"
                    accessibilityState={{expanded: isOpen}}>
                    <Text style={styles.faqQuestion}>
                      {entry.question}
                    </Text>
                    <AnimatedChevron expanded={isOpen} color={colors.textHint} />
                  </TouchableOpacity>

                  {isOpen && (
                    <Text style={styles.faqAnswer}>
                      {entry.answer}
                    </Text>
                  )}

                  {!isLast && <View style={styles.faqDivider} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* ── Delete account ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('deleteAccountTitle', language)}
          </Text>

          <View style={styles.deleteAccountCard}>
            <Text style={styles.deleteAccountIntro}>
              {t('deleteAccountIntro', language)}
            </Text>

            <TouchableOpacity
              style={styles.contactCard}
              activeOpacity={0.8}
              onPress={handleDeleteAccountEmail}
              accessibilityRole="button"
              accessibilityLabel={t('emailSupport', language)}>
              <View style={styles.contactIconWrap}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.contactTextBlock}>
                <Text style={styles.contactLabel}>
                  {t('emailSupport', language)}
                </Text>
                <Text style={styles.contactValue}>
                  {DELETE_ACCOUNT_CONTACT.email}
                </Text>
              </View>
              <Ionicons
                name={language === 'ar' ? 'chevron-back' : 'chevron-forward'}
                size={16}
                color={colors.textHint}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              activeOpacity={0.8}
              onPress={handleDeleteAccountCall}
              accessibilityRole="button"
              accessibilityLabel={t('callSupport', language)}>
              <View style={styles.contactIconWrap}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.contactTextBlock}>
                <Text style={styles.contactLabel}>
                  {t('callSupport', language)}
                </Text>
                <Text style={styles.contactValue}>
                  {DELETE_ACCOUNT_CONTACT.phone}
                </Text>
              </View>
              <Ionicons
                name={language === 'ar' ? 'chevron-back' : 'chevron-forward'}
                size={16}
                color={colors.textHint}
              />
            </TouchableOpacity>

            <Text style={styles.deleteAccountIncludeTitle}>
              {t('deleteAccountIncludeTitle', language)}
            </Text>
            <Text style={styles.deleteAccountBullet}>
              {t('deleteAccountInclude1', language)}
            </Text>
            <Text style={styles.deleteAccountBullet}>
              {t('deleteAccountInclude2', language)}
            </Text>
            <Text style={styles.deleteAccountBullet}>
              {t('deleteAccountInclude3', language)}
            </Text>

            <Text style={styles.deleteAccountFooter}>
              {t('deleteAccountFooter', language)}
            </Text>
          </View>
        </View>

        {/* ── Need more help CTA ── */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>
            {t('needMoreHelp', language)}
          </Text>
          <Text style={styles.ctaSubtitle}>
            {t('needMoreHelpSubtitle', language)}
          </Text>

          <View style={styles.ctaButtonRow}>
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.85}
              onPress={handleEmailSupport}>
              <Ionicons name="mail-outline" size={17} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>
                {t('emailSupport', language)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.85}
              onPress={handleCallSupport}>
              <Ionicons name="call-outline" size={17} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>
                {t('callSupport', language)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingTop: 8,
      paddingBottom: 16,
    },

    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    headerTitle: {
      fontFamily: Fonts.bold,
      fontSize: 22,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },

    // ── Hero ────────────────────────────────────────────────────────────────
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: 28,
      paddingVertical: 28,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#64748B',
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: {width: 0, height: 5},
      elevation: 4,
    },

    heroIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },

    heroTitle: {
      fontSize: 22,
      color: colors.textPrimary,
      fontFamily: Fonts.bold,
      marginBottom: 8,
      textAlign: 'center',
    },

    heroSubtitle: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      fontFamily: Fonts.regular,
      textAlign: 'center',
    },

    // ── Sections ────────────────────────────────────────────────────────────
    section: {
      marginBottom: 20,
    },

    sectionTitle: {
      fontFamily: Fonts.bold,
      fontSize: 17,
      color: colors.textPrimary,
      marginBottom: 12,
      letterSpacing: -0.2,
    },

    // ── Contact cards ───────────────────────────────────────────────────────
    contactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },

    contactIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    contactTextBlock: {
      flex: 1,
    },

    contactLabel: {
      fontFamily: Fonts.semiBold,
      fontSize: 14,
      color: colors.textPrimary,
      marginBottom: 3,
    },

    contactValue: {
      fontFamily: Fonts.regular,
      fontSize: 13,
      color: colors.textSecondary,
    },

    // ── Stat cards (support hours / response time) ─────────────────────────
    statRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },

    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },

    statIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },

    statLabel: {
      fontFamily: Fonts.medium,
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },

    statValue: {
      fontFamily: Fonts.bold,
      fontSize: 15,
      color: colors.textPrimary,
    },

    // ── FAQ ─────────────────────────────────────────────────────────────────
    faqCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },

    faqRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      gap: 12,
    },

    faqQuestion: {
      flex: 1,
      fontFamily: Fonts.semiBold,
      fontSize: 14,
      color: colors.textPrimary,
    },

    faqAnswer: {
      fontFamily: Fonts.regular,
      fontSize: 13,
      lineHeight: 21,
      color: colors.textSecondary,
      paddingBottom: 16,
    },

    faqDivider: {
      height: 1,
      backgroundColor: colors.divider,
    },

    // ── Delete account ──────────────────────────────────────────────────────
    deleteAccountCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },

    deleteAccountIntro: {
      fontFamily: Fonts.regular,
      fontSize: 13,
      lineHeight: 21,
      color: colors.textSecondary,
      marginBottom: 14,
    },

    deleteAccountIncludeTitle: {
      fontFamily: Fonts.semiBold,
      fontSize: 13,
      color: colors.textPrimary,
      marginTop: 6,
      marginBottom: 6,
    },

    deleteAccountBullet: {
      fontFamily: Fonts.regular,
      fontSize: 13,
      lineHeight: 21,
      color: colors.textSecondary,
      marginBottom: 2,
    },

    deleteAccountFooter: {
      fontFamily: Fonts.regular,
      fontSize: 12,
      lineHeight: 19,
      color: colors.textHint,
      marginTop: 12,
    },

    // ── Need more help CTA ──────────────────────────────────────────────────
    ctaCard: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOpacity: 0.28,
      shadowRadius: 14,
      shadowOffset: {width: 0, height: 6},
      elevation: 6,
    },

    ctaTitle: {
      fontFamily: Fonts.bold,
      fontSize: 19,
      color: '#FFFFFF',
      marginBottom: 6,
      textAlign: 'center',
    },

    ctaSubtitle: {
      fontFamily: Fonts.regular,
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      marginBottom: 18,
    },

    ctaButtonRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },

    ctaButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: 'rgba(255,255,255,0.16)',
      paddingVertical: 13,
      borderRadius: 14,
    },

    ctaButtonText: {
      color: '#FFFFFF',
      fontFamily: Fonts.semiBold,
      fontSize: 13,
    },
  });
