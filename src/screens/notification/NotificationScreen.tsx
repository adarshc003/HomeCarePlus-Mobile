import React from 'react';

import {
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  getNotifications,
} from '../../services/notificationApi';

import {
  useNotificationStore,
} from '../../store/notificationStore';

import {
  useLanguageStore,
} from '../../store/languageStore';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import {t} from '../../i18n';

import NotificationCard from '../../components/common/NotificationCard';
import NotificationCardSkeleton from '../../components/common/NotificationCardSkeleton';

import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {
  markAllNotificationsRead,
} from '../../services/notificationApi';

import Icon from '@react-native-vector-icons/ionicons';

const SKELETON_COUNT = 8;

const NotificationScreen = () => {
  const language =
    useLanguageStore(
      state => state.language,
    );

  const navigation = useNavigation();

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const notifications = useNotificationStore(
    state => state.notifications,
  );
  const setNotifications = useNotificationStore(
    state => state.setNotifications,
  );
  const loading = useNotificationStore(
    state => state.loading,
  );
  const refreshing = useNotificationStore(
    state => state.refreshing,
  );
  const setLoading = useNotificationStore(
    state => state.setLoading,
  );
  const setRefreshing = useNotificationStore(
    state => state.setRefreshing,
  );
  const markAllRead = useNotificationStore(
    state => state.markAllRead,
  );

  // Distinguishes "the request failed" from "there are genuinely no
  // notifications" — EmptyState previously showed the same "all caught up"
  // message either way, with the fetch error only ever reaching a
  // console.log.
  const [loadError, setLoadError] =
    React.useState(false);

  const loadNotifications =
    async () => {
      // Captured from the store (not a local ref) so that ANY mutation —
      // mark-all-read here, or an individual NotificationCard tap's
      // markRead() — invalidates a fetch that was already in flight
      // before it. Without this, a slower earlier GET /notifications can
      // resolve after the mutation and silently overwrite the
      // just-corrected read state with stale (pre-mutation) data.
      const requestVersion =
        useNotificationStore.getState().mutationVersion;

      try {
        setLoading(true);
        setLoadError(false);

        const response =
          await getNotifications();

        if (
          requestVersion ===
          useNotificationStore.getState().mutationVersion
        ) {
          setNotifications(
            response.data.notifications,
          );
        }
      } catch (error) {
        console.log(error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

  const onRefresh =
    async () => {
      setRefreshing(true);

      await loadNotifications();

      setRefreshing(false);
    };

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, []),
  );

  const showSkeleton = loading && notifications.length === 0;

  // Fades the real list in the first time it replaces the skeleton. Starts
  // already-opaque when there's cached data, so a warm revisit never plays
  // an unnecessary fade — mirrors MyBookingsScreen's identical pattern.
  const contentOpacity = React.useRef(
    new Animated.Value(notifications.length > 0 ? 1 : 0),
  ).current;

  React.useEffect(() => {
    if (!showSkeleton) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [showSkeleton, contentOpacity]);

  const onMarkAllRead =
    async () => {
      try {
        await markAllNotificationsRead();

        // markAllRead() itself bumps the store's mutationVersion, which
        // invalidates any fetch already in flight before this point.
        markAllRead();
      } catch (error) {
        console.log(error);
      }
    };

  const unreadCount =
    notifications.filter(n => !n.isRead).length;

  const EmptyState = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Icon
          name={
            loadError
              ? 'cloud-offline-outline'
              : 'notifications-off-outline'
          }
          size={48}
          color="#4757E7"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {loadError
          ? t('failedToLoadNotifications', language)
          : t('allCaughtUp', language)}
      </Text>
      <Text style={styles.emptySubtitle}>
        {loadError
          ? ''
          : t('notificationsWillAppear', language)}
      </Text>
      {loadError && (
        <TouchableOpacity
          style={styles.retryBtn}
          activeOpacity={0.85}
          onPress={() => loadNotifications()}>
          <Icon name="refresh-outline" size={14} color="#FFFFFF" />
          <Text style={styles.retryBtnText}>
            {t('retry', language)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}>

      {/* Header */}
      <View style={styles.header}>

        {/* Back button + Title block */}
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Icon
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
            <Text style={styles.headerTitle}>
              {t('notifications', language)}
            </Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>
                {unreadCount} {t('unread', language)}
              </Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={onMarkAllRead}
            activeOpacity={0.7}>
            <Icon
              name="checkmark-done-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.markAllText}>
              {t('markAllRead', language)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {showSkeleton ? (
        <View style={styles.listContent}>
          {Array.from({length: SKELETON_COUNT}).map((_, index) => (
            <NotificationCardSkeleton key={index} />
          ))}
        </View>
      ) : (
        <Animated.View style={{flex: 1, opacity: contentOpacity}}>
          <FlatList
            data={notifications}
            keyExtractor={item =>
              item._id ??
              item.id ??
              String(item.createdAt ?? Date.now())
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4757E7"
                colors={['#4757E7']}
              />
            }
            renderItem={({item}) => (
              <NotificationCard
                item={item}
              />
            )}
            contentContainerStyle={
              notifications.length === 0
                ? styles.listEmpty
                : styles.listContent
            }
            ListEmptyComponent={<EmptyState />}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
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
  },

  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  markAllText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    marginBottom: 2,
  },

  listContent: {
    paddingBottom: 32,
    paddingTop: 4,
  },

  listEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },

  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },

  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
});
