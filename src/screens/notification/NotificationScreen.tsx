import React from 'react';

import {
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
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

import {t} from '../../i18n';

import NotificationCard from '../../components/common/NotificationCard';

import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {
  markAllNotificationsRead,
} from '../../services/notificationApi';

import Icon from '@react-native-vector-icons/ionicons';

const NotificationScreen = () => {
  const language =
    useLanguageStore(
      state => state.language,
    );

  const navigation = useNavigation();

  const {
    notifications,
    setNotifications,
    loading,
    refreshing,
    setLoading,
    setRefreshing,
    markRead,
    setUnreadCount,
  } =
    useNotificationStore();

  const loadNotifications =
    async () => {
      try {
        setLoading(true);

        const response =
          await getNotifications();

        setNotifications(
          response.data.notifications,
        );
      } catch (error) {
        console.log(error);
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

  const onMarkAllRead =
    async () => {
      try {
        await markAllNotificationsRead();

        notifications.forEach(item => {
          const id =
            item._id || item.id;

          if (id && !item.isRead) {
            markRead(id);
          }
        });

        setUnreadCount(0);
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
          name="notifications-off-outline"
          size={48}
          color="#4757E7"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {t('allCaughtUp', language)}
      </Text>
      <Text style={styles.emptySubtitle}>
        {t('notificationsWillAppear', language)}
      </Text>
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
              color="#0F172A"
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
              color="#4757E7"
            />
            <Text style={styles.markAllText}>
              {t('markAllRead', language)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

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
        ListEmptyComponent={
          !loading ? <EmptyState /> : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTextBlock: {
    justifyContent: 'center',
  },

  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  markAllText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#4757E7',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
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
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
