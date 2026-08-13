import React, {
  useEffect,
  useRef,
} from 'react';

import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';

import {useLanguageStore}
from '../../store/languageStore';

import {useTheme}
from '../../hooks/useTheme';

import {t}
from '../../i18n';

import {Fonts}
from '../../constants/fonts';

import {
  initializeApp,
}
from '../../init/appInitializer';

// Splash's only job is to get theme/language/auth state ready (via
// appInitializer) and hand off to Home — catalog data (categories/
// services/packages/add-ons) used to be prefetched here too, but nothing
// on Home needs it before first paint, so it now loads lazily from the
// screens that actually own it.
const MIN_SPLASH_DURATION_MS = 500;

const SplashScreen = ({
  navigation,
}: any) => {

  const language =
    useLanguageStore(
      state => state.language,
    );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const rotateAnim =
    useRef(
      new Animated.Value(0),
    ).current;

useEffect(() => {

let isMounted = true;

const loopAnim = Animated.loop(
  Animated.timing(
    rotateAnim,
    {
      toValue: 1,
      duration: 1200,
      easing: Easing.linear,
      useNativeDriver: true,
    },
  ),
);

loopAnim.start();

const initialize = async () => {

  const start = Date.now();

  // Only theme/language/auth gate navigation — every request that used to
  // block here (categories, services, packages, add-ons) now loads lazily
  // from the screen that actually renders it. A failure here (corrupted
  // storage, a rejected AsyncStorage read) must never strand the user on
  // this screen forever — log it and proceed to Home as a logged-out
  // session rather than leaving navigation.replace() unreachable.
  try {
    await initializeApp();
  } catch (error) {
    console.log('Splash initialization error:', error);
  }

  const elapsed = Date.now() - start;

  if (elapsed < MIN_SPLASH_DURATION_MS) {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, MIN_SPLASH_DURATION_MS - elapsed);
    });
  }

  if (isMounted) {
    navigation.replace('Home');
  }
};

    initialize();

return () => {
  isMounted = false;
  loopAnim.stop();
};

}, []);

  return (
    <>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={colors.statusBarStyle}
      />

      <View style={styles.container}>

        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />

        <Text style={styles.title}>
          {t(
            'appName',
            language,
          )}
        </Text>

        <Text style={styles.subtitle}>
          {t(
            'splashSubtitle',
            language,
          )}
        </Text>

        <Animated.View
          style={[
            styles.loader,
            {
              transform: [
                {
                  rotate:
                    rotateAnim.interpolate({
                      inputRange: [
                        0,
                        1,
                      ],
                      outputRange: [
                        '0deg',
                        '360deg',
                      ],
                    }),
                },
              ],
            },
          ]}
        />

        <Text
          style={
            styles.bottomText
          }>
          {t(
            'splashBottom',
            language,
          )}
        </Text>

      </View>
    </>
  );
};

export default SplashScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        colors.background,

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal: 24,
    },

    logo: {
      width: 180,

      height: 180,

      resizeMode:
        'contain',
    },

    title: {
      marginTop: 16,

      fontSize: 34,

      color: colors.textPrimary,

      fontFamily:
        Fonts.bold,

      letterSpacing: -1,
    },

    subtitle: {
      marginTop: 8,

      fontSize: 16,

      color: colors.textSecondary,

      textAlign: 'center',

      fontFamily:
        Fonts.medium,

      lineHeight: 24,
    },

    loader: {
      width: 34,

      height: 34,

      borderRadius: 17,

      borderWidth: 3,

      borderColor:
        colors.border,

      borderTopColor:
        colors.primary,

      marginTop: 28,

      marginBottom: 28,
    },

    bottomText: {
      position: 'absolute',

      bottom: 55,

      color: colors.textHint,

      fontSize: 13,

      letterSpacing: 0.5,

      fontFamily:
        Fonts.medium,
    },
  });