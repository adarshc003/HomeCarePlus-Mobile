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

import {useThemeStore}
from '../../store/themeStore';

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

const SplashScreen = ({
  navigation,
}: any) => {

  const language =
    useLanguageStore(
      state => state.language,
    );

  const loadLanguage =
    useLanguageStore(
      state => state.loadLanguage,
    );

  const loadThemeMode =
    useThemeStore(
      state => state.loadThemeMode,
    );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const rotateAnim =
    useRef(
      new Animated.Value(0),
    ).current;

useEffect(() => {

const initialize = async () => {

  loadLanguage();
  loadThemeMode();

  Animated.loop(
    Animated.timing(
      rotateAnim,
      {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      },
    ),
  ).start();

  const start = Date.now();

  await initializeApp();

  const elapsed = Date.now() - start;

  if (elapsed < 2500) {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 2500 - elapsed);
    });
  }

  navigation.replace('Home');
};

    initialize();

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