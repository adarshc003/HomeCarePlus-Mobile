import React from 'react';

import {
  Modal,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';

import {Fonts} from '../../constants/fonts';

import {useLanguageStore} from '../../store/languageStore';

import {useTheme} from '../../hooks/useTheme';

import {t} from '../../i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const APP_VERSION = '1.0.9';

const AboutAppModal = ({visible, onClose}: Props) => {

  const language = useLanguageStore(
    state => state.language,
  );

  const {colors} = useTheme();

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>

      <View style={styles.overlay}>
        <View style={styles.container}>

          <View style={styles.iconWrap}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.appName}>
            {t('appName', language)}
          </Text>

          <Text style={styles.tagline}>
            {t('splashTagline', language)}
          </Text>

          <View style={styles.versionPill}>
            <Text style={styles.versionText}>
              {t('version', language)} {APP_VERSION}
            </Text>
          </View>

          <Text style={styles.copyright}>
            © {new Date().getFullYear()} {t('appName', language)}. {t('allRightsReserved', language)}
          </Text>

          <Text style={styles.poweredBy}>
            {t('poweredByAddonez', language)}{' '}
            <Text
              style={styles.poweredByLink}
              onPress={() => Linking.openURL('https://addonez.com/')}>
              Addonez
            </Text>
          </Text>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={onClose}>
            <Text style={styles.buttonText}>
              {t('close', language)}
            </Text>
          </TouchableOpacity>

        </View>
      </View>

    </Modal>
  );
};

export default AboutAppModal;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({

    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: 24,
    },

    container: {
      backgroundColor: colors.card,
      borderRadius: 28,
      paddingVertical: 28,
      paddingHorizontal: 24,
      alignItems: 'center',
    },

    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },

    logo: {
      width: 48,
      height: 48,
    },

    appName: {
      fontSize: 22,
      color: colors.textPrimary,
      fontFamily: Fonts.bold,
    },

    tagline: {
      marginTop: 6,
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: Fonts.medium,
    },

    versionPill: {
      marginTop: 18,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: colors.backgroundSecondary,
    },

    versionText: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: Fonts.semiBold,
    },

    copyright: {
      marginTop: 18,
      fontSize: 12,
      textAlign: 'center',
      color: colors.textHint,
      fontFamily: Fonts.medium,
    },

    poweredBy: {
      marginTop: 6,
      fontSize: 11,
      textAlign: 'center',
      color: colors.textHint,
      fontFamily: Fonts.medium,
    },

    poweredByLink: {
      color: colors.primary,
      fontFamily: Fonts.semiBold,
    },

    button: {
      marginTop: 24,
      backgroundColor: colors.primary,
      width: '100%',
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },

    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: Fonts.semiBold,
    },
  });
