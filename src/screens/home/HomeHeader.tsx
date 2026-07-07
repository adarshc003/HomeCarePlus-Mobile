import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';

import {useAuthStore} from '../../store/authStore';
import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';
import {Fonts} from '../../constants/fonts';

import Icon from '@react-native-vector-icons/ionicons';

import {useNotificationStore} from '../../store/notificationStore';

const HomeHeader = ({navigation}: any) => {
  const isLoggedIn = useAuthStore(
    state => state.isLoggedIn,
  );

  const language = useLanguageStore(
    state => state.language,
  );

  const unreadCount = useNotificationStore(
    state => state.unreadCount,
  );

  return (
    <View style={styles.container}>

      {/* ── Left: logo + brand name ── */}
      <View style={styles.leftSection}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>
            {t('homeCarePlus', language)}
          </Text>

          <Text style={styles.subtitle}>
            {t('professionalHomeServices1', language)}
          </Text>
        </View>
      </View>

      {/* ── Right: login btn or notification bell ── */}
      {!isLoggedIn ? (
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}>
          <Icon
            name="person-outline"
            size={14}
            color="#2563EB"
            style={styles.loginIcon}
          />
          <Text style={styles.loginText}>
            {t('login', language)}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.notificationButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Notifications')}>

          <Icon
            name={
              unreadCount > 0
                ? 'notifications'
                : 'notifications-outline'
            }
            size={22}
            color="#2563EB"
          />

          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}

        </TouchableOpacity>
      )}

    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({

  container: {
    marginTop: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ── Left ─────────────────────────────────
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },

  logoWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    shadowColor: '#2563EB',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 4,
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
  },

  textBlock: {
    justifyContent: 'center',
    flex: 1,
  },

  title: {
    fontSize: 19,
    fontFamily: Fonts.bold,
    color: '#0A0F1E',
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: Fonts.regular,
    letterSpacing: 0.1,
  },

  // ── Login button ──────────────────────────
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  loginIcon: {
    marginTop: 1,
  },

  loginText: {
    color: '#2563EB',
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    letterSpacing: 0.1,
  },

  // ── Notification button ───────────────────
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  badgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 9,
  },
});
