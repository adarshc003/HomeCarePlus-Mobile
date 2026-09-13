import React, {useRef} from 'react';
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';
import {SUPPORT_WHATSAPP_NUMBER} from '../../constants/supportContact';

// Only show the button on the Home tab. navigationRef.getCurrentRoute()
// resolves to the leaf route, which for the nested Home stack screen ->
// BottomTabs is 'HomeTab' when that tab is active (vs 'BookingsTab' /
// 'ProfileTab' for the other tabs, or the pushed stack screens' own names).
const VISIBLE_ROUTES = ['HomeTab'];

interface Props {
  currentRoute?: string;
}

// Global floating WhatsApp support button. Mounted once at the root
// navigator level (alongside Toast/FeedbackDialogHost) so it renders above
// every authenticated screen without being duplicated per-screen.
const WhatsAppSupportButton = ({currentRoute}: Props) => {
  const language = useLanguageStore(state => state.language);
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;

  if (!currentRoute || !VISIBLE_ROUTES.includes(currentRoute)) {
    return null;
  }

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePress = async () => {
    const message = t('whatsappDefaultMessage', language);
    const url = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message,
    )}`;

    // wa.me is a plain https link, so Linking.openURL() succeeds on any
    // device with a browser, whether or not WhatsApp itself is installed —
    // it just falls back to opening the link on the web. canOpenURL() is
    // unreliable here (Android 11+ package-visibility rules, and some iOS
    // versions) so it's used only as a best-effort installed-app check,
    // never to block the open attempt.
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        t('whatsappNotInstalledTitle', language),
        t('whatsappNotInstalledMessage', language),
      );
    }
  };

  const bottom = Math.max(96, insets.bottom + 88);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {bottom, transform: [{scale}]},
      ]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={t('whatsappSupportButtonLabel', language)}
        hitSlop={8}
        style={styles.button}>
        <Ionicons name="logo-whatsapp" size={30} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
};

export default WhatsAppSupportButton;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 999,
    elevation: 12,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 8,
  },
});
