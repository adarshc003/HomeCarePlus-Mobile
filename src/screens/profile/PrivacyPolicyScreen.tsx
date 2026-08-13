import React, {useState} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import Ionicons from '@react-native-vector-icons/ionicons';

import {useNavigation} from '@react-navigation/native';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import {PRIVACY_POLICY_CONTENT} from '../../content/privacyPolicyContent';

type DocLanguage = 'en' | 'ar';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();

  // The app's actual current language only sets the INITIAL selection —
  // switching the selector below must never change the app's language, so
  // this is deliberately local state, not a write-through to languageStore.
  const appLanguage = useLanguageStore(state => state.language);

  const [selectedLanguage, setSelectedLanguage] =
    useState<DocLanguage>(appLanguage);

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const content = PRIVACY_POLICY_CONTENT[selectedLanguage];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('back', appLanguage)}>
            <Ionicons
              name={appLanguage === 'ar' ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>
              {t('privacyPolicy', appLanguage)}
            </Text>
          </View>
        </View>

        {/* ── Language selector ── */}
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[
              styles.selectorOption,
              selectedLanguage === 'en' && styles.selectorOptionActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedLanguage('en')}
            accessibilityRole="button"
            accessibilityLabel={t('english', appLanguage)}>
            <Text
              style={[
                styles.selectorOptionText,
                selectedLanguage === 'en' && styles.selectorOptionTextActive,
              ]}>
              EN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorOption,
              selectedLanguage === 'ar' && styles.selectorOptionActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedLanguage('ar')}
            accessibilityRole="button"
            accessibilityLabel={t('arabic', appLanguage)}>
            <Text
              style={[
                styles.selectorOptionText,
                selectedLanguage === 'ar' && styles.selectorOptionTextActive,
              ]}>
              ع
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.lastUpdated}>
          {content.lastUpdated}
        </Text>

        {content.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                selectedLanguage === 'ar' && styles.textRTL,
              ]}>
              {section.title}
            </Text>
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <Text
                key={paragraphIndex}
                style={[
                  styles.paragraph,
                  selectedLanguage === 'ar' && styles.textRTL,
                ]}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

      </ScrollView>

    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
    },

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },

    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    headerTextBlock: {
      justifyContent: 'center',
      flexShrink: 1,
    },

    headerTitle: {
      fontFamily: Fonts.bold,
      fontSize: 20,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },

    selectorRow: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 3,
      gap: 3,
    },

    selectorOption: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 9,
      alignItems: 'center',
    },

    selectorOptionActive: {
      backgroundColor: colors.card,
      shadowColor: '#64748B',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: {width: 0, height: 2},
      elevation: 2,
    },

    selectorOptionText: {
      fontFamily: Fonts.semiBold,
      fontSize: 13,
      color: colors.textSecondary,
    },

    selectorOptionTextActive: {
      color: colors.primary,
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },

    lastUpdated: {
      fontFamily: Fonts.medium,
      fontSize: 12,
      color: colors.textHint,
      marginBottom: 20,
    },

    section: {
      marginBottom: 24,
    },

    sectionTitle: {
      fontFamily: Fonts.bold,
      fontSize: 17,
      color: colors.textPrimary,
      marginBottom: 8,
      letterSpacing: -0.2,
    },

    paragraph: {
      fontFamily: Fonts.regular,
      fontSize: 14,
      lineHeight: 23,
      color: colors.textSecondary,
      marginBottom: 10,
    },

    textRTL: {
      writingDirection: 'rtl',
      textAlign: 'right',
    },
  });
