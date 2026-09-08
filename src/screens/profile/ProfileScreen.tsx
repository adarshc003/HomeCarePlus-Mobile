import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  Animated,
  Linking,
} from 'react-native';

import {useFocusEffect} from '@react-navigation/native';

import {InAppBrowser} from 'react-native-inappbrowser-reborn';

import {LEGAL_DOCUMENT_URLS} from '../../constants/legalDocuments';

import {useAuthStore} from '../../store/authStore';
import {unregisterCurrentToken} from '../../services/notificationService';
import {getProfile} from '../../services/userService';
import {useLanguageStore} from '../../store/languageStore';
import {useThemeStore, ThemeMode} from '../../store/themeStore';
import {useTheme} from '../../hooks/useTheme';
import {t} from '../../i18n';
import {Fonts} from '../../constants/fonts';
import Ionicons from '@react-native-vector-icons/ionicons';
import AboutAppModal from '../../components/modal/AboutAppModal';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Rotates a right-pointing chevron to point down when expanded (▶ → ▼).
const AnimatedChevron = ({
  expanded,
  color,
}: {
  expanded: boolean;
  color: string;
}) => {
  const rotateAnim = useRef(
    new Animated.Value(expanded ? 1 : 0),
  ).current;

  useEffect(() => {
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

type SubSection = 'theme' | 'language' | null;

const ProfileScreen = ({navigation}: any) => {
  const user = useAuthStore(state => state.user);

  const isLoggedIn = useAuthStore(state => state.isLoggedIn);

  const updateUser = useAuthStore(state => state.updateUser);

  const logout = useAuthStore(state => state.logout);

  const language = useLanguageStore(state => state.language);
  const setLanguage = useLanguageStore(state => state.setLanguage);

  const themeMode = useThemeStore(state => state.mode);
  const setThemeMode = useThemeStore(state => state.setThemeMode);

  const {colors} = useTheme();

  const styles = createStyles(colors);

  // ── Settings accordion state ────────────────────────────────────────────
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<SubSection>(null);
  const [pendingTheme, setPendingTheme] = useState<ThemeMode>(themeMode);
  const [pendingLanguage, setPendingLanguage] = useState(language);
  const [aboutAppVisible, setAboutAppVisible] = useState(false);

  const animate = () =>
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut,
    );

  const toggleSettings = () => {
    animate();

    if (settingsExpanded) {
      setActiveSection(null);
    }

    setSettingsExpanded(!settingsExpanded);
  };

  const toggleSection = (section: 'theme' | 'language') => {
    animate();

    if (activeSection === section) {
      setActiveSection(null);
      return;
    }

    if (section === 'theme') {
      setPendingTheme(themeMode);
    } else {
      setPendingLanguage(language);
    }

    setActiveSection(section);
  };

  const handleApplyTheme = async () => {
    await setThemeMode(pendingTheme);
    animate();
    setActiveSection(null);
  };

  const handleApplyLanguage = async () => {
    const isSwitchingLanguage = pendingLanguage !== language;

    if (isSwitchingLanguage) {
      await setLanguage(pendingLanguage);
    }

    // A language switch flips isRTL app-wide (flexDirection 'row' <->
    // 'row-reverse') across every still-mounted screen, not just this
    // dropdown — native-stack keeps prior screens mounted even off-screen.
    // On iOS, stacking a LayoutAnimation-driven collapse of this dropdown
    // right on top of that global LTR->RTL re-layout is what left the app
    // stuck (only fixed by a full relaunch, which lays the RTL tree out
    // fresh with nothing mid-flight). Skipping the animation only for this
    // switch — only on iOS, only when the language actually changed — avoids
    // that without touching the already-working Android behavior below, or
    // the theme toggle / plain expand-collapse animations elsewhere in this
    // screen.
    if (Platform.OS === 'ios' && isSwitchingLanguage) {
      setActiveSection(null);
      return;
    }

    animate();
    setActiveSection(null);
  };

  // Refresh the cached profile whenever this screen is focused — until now
  // nothing in the app ever re-fetched it, so name/email changes made
  // elsewhere (e.g. entering a name on the address form) only appeared
  // after a fresh login.
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        return;
      }

      const refreshProfile = async () => {
        try {
          const response = await getProfile();

          // handleLogout() can complete while this request is still in
          // flight (it clears session state without cancelling this call).
          // Re-checking against the store directly — not the isLoggedIn
          // closed over above, which is stale the moment logout happens —
          // stops a late-arriving response from silently repopulating user
          // data right after logout.
          if (!useAuthStore.getState().isLoggedIn) {
            return;
          }

          await updateUser(response.user);
        } catch (error) {
          console.log(error);
        }
      };

      refreshProfile();
    }, [isLoggedIn]),
  );

  const handleLogout = async () => {
    await unregisterCurrentToken();
    await logout();
    navigation.replace('Home');
  };

  // Opens the website's Terms & Conditions page directly — no in-app
  // language choice anymore, it's whatever LEGAL_DOCUMENT_URLS points to.
  const handleOpenTermsAndConditions = async () => {
    const url = LEGAL_DOCUMENT_URLS.termsAndConditions.en;

    try {
      const available = await InAppBrowser.isAvailable();

      if (available) {
        await InAppBrowser.open(url, {
          dismissButtonStyle: 'close',
          showTitle: true,
          enableUrlBarHiding: true,
          enableDefaultShare: true,
        });
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ── Menu items config ─────────────────────────────────────────────────────
  const menuItems = [
    {
      key: 'settings',
      icon: 'settings-outline',
      labelKey: 'settings',
      onPress: toggleSettings,
      danger: false,
    },
    {
      key: 'helpSupport',
      icon: 'headset-outline',
      labelKey: 'helpSupport',
      onPress: () => navigation.navigate('HelpSupport'),
      danger: false,
    },
    {
      key: 'termsAndConditions',
      icon: 'document-text-outline',
      labelKey: 'termsAndConditions',
      onPress: handleOpenTermsAndConditions,
      danger: false,
    },
    {
      key: 'privacyPolicy',
      icon: 'shield-checkmark-outline',
      labelKey: 'privacyPolicy',
      onPress: () => navigation.navigate('PrivacyPolicy'),
      danger: false,
    },
    {
      key: 'aboutApp',
      icon: 'information-circle-outline',
      labelKey: 'aboutApp',
      onPress: () => setAboutAppVisible(true),
      danger: false,
    },
    {
      key: 'logout',
      icon: 'log-out-outline',
      labelKey: 'logout',
      onPress: handleLogout,
      danger: true,
    },
  ];

  const THEME_OPTIONS: {value: ThemeMode; labelKey: string; icon: string}[] = [
    {value: 'light', labelKey: 'themeLight', icon: 'sunny-outline'},
    {value: 'dark', labelKey: 'themeDark', icon: 'moon-outline'},
    {value: 'system', labelKey: 'themeSystem', icon: 'phone-portrait-outline'},
  ];

  const LANGUAGE_OPTIONS: {value: 'en' | 'ar'; labelKey: string}[] = [
    {value: 'en', labelKey: 'english'},
    {value: 'ar', labelKey: 'arabic'},
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.background}
      />

      {/* ── Profile card ── */}
      <View style={styles.profileCard}>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Ionicons
            name="person"
            size={40}
            color={colors.primary}
          />
          <View style={styles.avatarOnlineDot} />
        </View>

        {/* Name + label */}
        <Text style={styles.name}>
          {user?.name || t('customer', language)}
        </Text>

        <Text style={styles.profileLabel}>
          {t('profile', language)}
        </Text>

        {/* Phone pill */}
        {(user?.phone || true) && (
          <View style={styles.phonePill}>
            <Ionicons
              name="call-outline"
              size={13}
              color={colors.primary}
            />
            <Text style={styles.phone}>
              {user?.phone || t('notAvailable', language)}
            </Text>
          </View>
        )}

      </View>

      {/* ── Menu card ── */}
      <View style={styles.menuCard}>
        {menuItems.map((item, index) => {
          const isLast = index === menuItems.length - 1;
          const isSettings = item.key === 'settings';

          return (
            <React.Fragment key={item.key}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={item.onPress}
                activeOpacity={0.75}>

                {/* Icon blob */}
                <View style={[
                  styles.menuIconWrap,
                  item.danger && styles.menuIconWrapDanger,
                ]}>
                  <Ionicons
                    name={item.icon as any}
                    size={19}
                    color={item.danger ? colors.error : colors.primary}
                  />
                </View>

                {/* Label */}
                <Text style={[
                  styles.menuText,
                  item.danger && styles.menuTextDanger,
                ]}>
                  {t(item.labelKey, language)}
                </Text>

                {/* Chevron */}
                {isSettings ? (
                  <AnimatedChevron
                    expanded={settingsExpanded}
                    color={colors.textHint}
                  />
                ) : (
                  <Ionicons
                    name={
                      language === 'ar'
                        ? 'chevron-back'
                        : 'chevron-forward'
                    }
                    size={16}
                    color={item.danger ? '#FCA5A5' : colors.textHint}
                  />
                )}

              </TouchableOpacity>

              {/* ── Inline Settings accordion ── */}
              {isSettings && settingsExpanded && (
                <View style={styles.settingsPanel}>

                  {/* Theme row */}
                  <TouchableOpacity
                    style={styles.subRow}
                    activeOpacity={0.75}
                    onPress={() => toggleSection('theme')}>
                    <Text style={styles.subRowText}>
                      {t('theme', language)}
                    </Text>
                    <AnimatedChevron
                      expanded={activeSection === 'theme'}
                      color={colors.textHint}
                    />
                  </TouchableOpacity>

                  {activeSection === 'theme' && (
                    <View style={styles.dropdown}>
                      {THEME_OPTIONS.map(option => {
                        const selected = pendingTheme === option.value;

                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={styles.optionRow}
                            activeOpacity={0.75}
                            onPress={() => setPendingTheme(option.value)}>
                            <Ionicons
                              name={option.icon as any}
                              size={17}
                              color={selected ? colors.primary : colors.textHint}
                            />
                            <Text style={[
                              styles.optionText,
                              selected && styles.optionTextSelected,
                            ]}>
                              {t(option.labelKey, language)}
                            </Text>
                            <View style={[
                              styles.radioOuter,
                              selected && styles.radioOuterSelected,
                            ]}>
                              {selected && <View style={styles.radioInner} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}

                      <TouchableOpacity
                        style={styles.okButton}
                        activeOpacity={0.85}
                        onPress={handleApplyTheme}>
                        <Text style={styles.okButtonText}>
                          {t('ok', language)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.settingsDivider} />

                  {/* Language row */}
                  <TouchableOpacity
                    style={styles.subRow}
                    activeOpacity={0.75}
                    onPress={() => toggleSection('language')}>
                    <Text style={styles.subRowText}>
                      {t('language', language)}
                    </Text>
                    <AnimatedChevron
                      expanded={activeSection === 'language'}
                      color={colors.textHint}
                    />
                  </TouchableOpacity>

                  {activeSection === 'language' && (
                    <View style={styles.dropdown}>
                      {LANGUAGE_OPTIONS.map(option => {
                        const selected = pendingLanguage === option.value;

                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={styles.optionRow}
                            activeOpacity={0.75}
                            onPress={() => setPendingLanguage(option.value)}>
                            <Text style={styles.flagEmoji}>
                              {option.value === 'en' ? '🇬🇧' : '🇸🇦'}
                            </Text>
                            <Text style={[
                              styles.optionText,
                              selected && styles.optionTextSelected,
                            ]}>
                              {t(option.labelKey, language)}
                            </Text>
                            <View style={[
                              styles.radioOuter,
                              selected && styles.radioOuterSelected,
                            ]}>
                              {selected && <View style={styles.radioInner} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}

                      <TouchableOpacity
                        style={styles.okButton}
                        activeOpacity={0.85}
                        onPress={handleApplyLanguage}>
                        <Text style={styles.okButtonText}>
                          {t('ok', language)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                </View>
              )}

              {!isLast && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Version ── */}
      <Text style={styles.version}>
        {t('version', language)} 1.0.9
      </Text>

      <AboutAppModal
        visible={aboutAppVisible}
        onClose={() => setAboutAppVisible(false)}
      />

    </View>
  );
};

export default ProfileScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
      paddingTop: 50,
    },

    // ── Profile card ──────────────────────────────────────────────────────────
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 28,
      paddingVertical: 28,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#64748B',
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: {width: 0, height: 5},
      elevation: 4,
    },

    avatarContainer: {
      width: 88,
      height: 88,
      borderRadius: 26,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 3,
      borderColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#4757E7',
      shadowOpacity: 0.16,
      shadowRadius: 14,
      shadowOffset: {width: 0, height: 6},
      elevation: 6,
    },

    avatarOnlineDot: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.success,
      borderWidth: 2.5,
      borderColor: colors.card,
    },

    name: {
      fontSize: 22,
      color: colors.textPrimary,
      fontFamily: Fonts.bold,
      letterSpacing: -0.3,
    },

    profileLabel: {
      marginTop: 4,
      color: colors.textHint,
      fontSize: 12,
      fontFamily: Fonts.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },

    phonePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      marginTop: 12,
    },

    phone: {
      color: colors.primary,
      fontSize: 13,
      fontFamily: Fonts.semiBold,
    },

    // ── Menu card ─────────────────────────────────────────────────────────────
    menuCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#64748B',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: {width: 0, height: 4},
      elevation: 3,
    },

    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 15,
      gap: 12,
    },

    menuIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },

    menuIconWrapDanger: {
      backgroundColor: '#FEF2F2',
    },

    menuText: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      fontFamily: Fonts.semiBold,
    },

    menuTextDanger: {
      color: colors.error,
    },

    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginLeft: 68,
    },

    // ── Inline Settings accordion ─────────────────────────────────────────────
    settingsPanel: {
      paddingHorizontal: 18,
      paddingBottom: 14,
      paddingTop: 2,
      backgroundColor: colors.backgroundSecondary,
    },

    subRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },

    subRowText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontFamily: Fonts.semiBold,
    },

    settingsDivider: {
      height: 1,
      backgroundColor: colors.divider,
    },

    dropdown: {
      paddingBottom: 14,
    },

    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 8,
    },

    optionText: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      fontFamily: Fonts.medium,
    },

    optionTextSelected: {
      color: colors.primary,
      fontFamily: Fonts.semiBold,
    },

    flagEmoji: {
      fontSize: 17,
    },

    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },

    radioOuterSelected: {
      borderColor: colors.primary,
    },

    radioInner: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },

    okButton: {
      marginTop: 4,
      height: 46,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOpacity: 0.28,
      shadowRadius: 10,
      shadowOffset: {width: 0, height: 4},
      elevation: 5,
    },

    okButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: Fonts.semiBold,
    },

    // ── Version ───────────────────────────────────────────────────────────────
    version: {
      textAlign: 'center',
      color: colors.textHint,
      marginTop: 24,
      marginBottom: 14,
      fontSize: 12,
      fontFamily: Fonts.regular,
    },
  });
