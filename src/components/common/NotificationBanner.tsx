import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import {useNotificationStore} from '../../store/notificationStore';
import {useLanguageStore} from '../../store/languageStore';
import {useTheme} from '../../hooks/useTheme';
import {Fonts} from '../../constants/fonts';

const TYPE_CONFIG: Record<
  string,
  {icon: string; color: string; bg: string}
> = {
  booking: {icon: 'calendar', color: '#4757E7', bg: '#EEF2FF'},
  payment: {icon: 'card', color: '#22C55E', bg: '#F0FDF4'},
  invoice: {icon: 'receipt', color: '#F59E0B', bg: '#FFFBEB'},
  review: {icon: 'star', color: '#F59E0B', bg: '#FFFBEB'},
  default: {icon: 'notifications', color: '#4757E7', bg: '#EEF2FF'},
};

const NotificationBanner = () => {
  const {
    bannerVisible,
    currentNotification,
    hideBanner,
  } = useNotificationStore();

  const language =
    useLanguageStore(state => state.language);

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const translateY =
    useRef(new Animated.Value(-180)).current;

  const opacity =
    useRef(new Animated.Value(0)).current;

  const scaleX =
    useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!bannerVisible) {
      return;
    }

    // Entry animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(scaleX, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      closeBanner();
    }, 5000);

    return () => clearTimeout(timer);
  }, [bannerVisible]);

  const closeBanner = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -180,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      scaleX.setValue(0);
      hideBanner();
    });
  };

  if (
    !bannerVisible ||
    !currentNotification
  ) {
    return null;
  }

  const typeKey =
    (currentNotification as any).type ?? 'default';
  const {icon, color, bg} =
    TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.default;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{translateY}],
          opacity,
        },
      ]}>
      <Pressable
        style={styles.card}
        onPress={closeBanner}>

        {/* Icon */}
        <View style={[styles.iconWrap, {backgroundColor: bg}]}>
<Ionicons
  name={
    icon as React.ComponentProps<
      typeof Ionicons
    >['name']
  }
  size={22}
  color={color}
/>
        </View>

        {/* Text content */}
        <View style={styles.content}>
          <Text
            style={styles.title}
            numberOfLines={1}>
            {language === 'ar'
              ? currentNotification.title.ar
              : currentNotification.title.en}
          </Text>

          <Text
            style={styles.body}
            numberOfLines={2}>
            {language === 'ar'
              ? currentNotification.body.ar
              : currentNotification.body.en}
          </Text>
        </View>

        {/* Close */}
        <View style={styles.closeBtn}>
          <Ionicons
            name="close"
            size={16}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              transform: [
                {
                  scaleX,
                },
              ],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

export default NotificationBanner;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    zIndex: 9999,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    overflow: 'hidden',

    shadowColor: '#1E293B',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 12,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  content: {
    flex: 1,
    marginHorizontal: 12,
  },

  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  body: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    marginTop: -3,
  },

  progressBar: {
    height: 3,
    backgroundColor: '#4757E7',
    borderRadius: 20,
    transformOrigin: 'left',
  },
});
