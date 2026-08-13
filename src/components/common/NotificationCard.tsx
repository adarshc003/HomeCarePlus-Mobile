import React, {useRef} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';

import Icon from '@react-native-vector-icons/ionicons';

import {
  NotificationItem,
} from '../../store/notificationStore';

import {
  useLanguageStore,
} from '../../store/languageStore';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import {t} from '../../i18n';

import {useNavigation} from '@react-navigation/native';

import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  RootStackParamList,
} from '../../navigation/types';

import {
  markNotificationRead,
} from '../../services/notificationApi';

import {
  getBookingNumberById,
} from '../../services/bookingService';

import {
  useNotificationStore,
} from '../../store/notificationStore';

import {
  Swipeable,
} from 'react-native-gesture-handler';

import {
  deleteNotification,
} from '../../services/notificationApi';

import {showError} from '../../utils/showToast';



interface Props {
  item: NotificationItem;
}

const TYPE_CONFIG: Record<
  string,
  {icon: string; color: string; bg: string}
> = {
  booking: {
    icon: 'calendar',
    color: '#4757E7',
    bg: '#EEF2FF',
  },
  payment: {
    icon: 'card',
    color: '#22C55E',
    bg: '#F0FDF4',
  },
  invoice: {
    icon: 'receipt',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  review: {
    icon: 'star',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  default: {
    icon: 'notifications',
    color: '#4757E7',
    bg: '#EEF2FF',
  },
};

const NotificationCard = ({
  item,
}: Props) => {
  const language =
    useLanguageStore(
      state => state.language,
    );

  const isRTL = language === 'ar';

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const markRead =
    useNotificationStore(
      state => state.markRead,
    );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const title =
    language === 'ar'
      ? item.title.ar
      : item.title.en;

  const body =
    language === 'ar'
      ? item.body.ar
      : item.body.en;

  const getTypeConfig = () =>
    TYPE_CONFIG[item.type] ?? TYPE_CONFIG.default;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const removeNotification =
    useNotificationStore(
      state => state.removeNotification,
    );

  const swipeableRef = useRef<Swipeable>(null);

  const onDelete =
    async () => {
      try {
        const id =
          item._id || item.id;

        if (!id) {
          return;
        }

        await deleteNotification(id);

        removeNotification(id);
      } catch (error) {
        console.log(error);

        // The card was never removed from the list (correct — the delete
        // genuinely failed), but the swipe had already revealed the red
        // trash panel with nothing telling the user it didn't work — snap
        // it back closed and surface why.
        swipeableRef.current?.close();

        showError(
          t('unableToDeleteNotification', language) ||
            'Unable to delete notification.',
        );
      }
    };

  const RightAction = () => (
    <View style={styles.deleteAction}>
      <Icon
        name="trash-outline"
        size={22}
        color="#FFFFFF"
      />
      <Text style={styles.deleteLabel}>
        {t('delete', language)}
      </Text>
    </View>
  );

  const {icon, color, bg} = getTypeConfig();

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={RightAction}
      onSwipeableOpen={onDelete}
      overshootRight={false}>
      <Animated.View
        style={{transform: [{scale: scaleAnim}]}}>
        <Pressable
          style={[
            styles.card,
            isRTL && styles.cardRTL,
            !item.isRead && styles.cardUnread,
          ]}
          android_ripple={{
            color: '#EEF2FF',
            borderless: false,
          }}
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${body}`}
          accessibilityState={{selected: !item.isRead}}
          // Deleting today only happens via the swipe-to-reveal gesture
          // (onSwipeableOpen below), which assistive tech (TalkBack/
          // VoiceOver) generally can't perform. accessibilityActions
          // exposes the same onDelete as a discrete action in the screen
          // reader's actions menu, with no change to the swipe gesture
          // itself.
          accessibilityActions={[
            {name: 'delete', label: t('delete', language)},
          ]}
          onAccessibilityAction={event => {
            if (event.nativeEvent.actionName === 'delete') {
              onDelete();
            }
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={async () => {
            try {
              if ((item.id || item._id) && !item.isRead) {
                const notificationId =
                  item._id ?? item.id;

                if (!notificationId) {
                  return;
                }

                // Awaiting the backend confirmation BEFORE applying the
                // local mutation (matching onMarkAllRead's ordering in
                // NotificationScreen.tsx) — applying it first, as before,
                // left a window where a list reload landing in between
                // (the mutationVersion guard only protects a fetch that
                // was ALREADY in flight before this point) would still see
                // this notification as unread server-side and silently
                // revert it back. A failure now also actually surfaces to
                // the user instead of leaving local/server state diverged
                // with no indication anything went wrong.
                try {
                  await markNotificationRead(
                    notificationId,
                  );

                  markRead(notificationId);
                } catch (error) {
                  console.log(error);
                  showError(
                    t('unableToMarkAsRead', language),
                  );
                }
              }

              switch (item.type) {
                case 'booking':
                case 'payment':
                case 'review':
                case 'cancelled':
                  if (item.data?.bookingId) {
                    const rawId = String(item.data.bookingId);

                    // ERP's cancellation/status-change webhooks send the
                    // booking's internal numeric id here, not its
                    // bookingNumber (e.g. "HCP-000102") — resolve it first.
                    const bookingNumber = /^\d+$/.test(rawId)
                      ? (await getBookingNumberById(rawId))
                          .bookingNumber
                      : rawId;

                    if (bookingNumber) {
                      navigation.navigate(
                        'BookingDetails',
                        {bookingNumber},
                      );
                    }
                  }
                  break;

                default:
                  break;
              }
            } catch (error) {
              console.log(error);
            }
          }}>

          {/* Unread accent bar */}
          {!item.isRead && (
            <View
              style={[
                styles.unreadBar,
                isRTL && styles.unreadBarRTL,
              ]}
            />
          )}

          <View
            style={[
              styles.iconContainer,
              {backgroundColor: bg},
            ]}>
<Icon
  name={icon as any}
  size={22}
  color={color}
/>
          </View>

          <View style={styles.content}>
            <Text
              style={styles.title}
              numberOfLines={1}>
              {title}
            </Text>

            <Text
              style={styles.body}
              numberOfLines={2}>
              {body}
            </Text>
          </View>

          <View style={styles.trailing}>
            {!item.isRead && (
              <View style={styles.dot} />
            )}
            <Icon
              name={
                language === 'ar'
                  ? 'chevron-back'
                  : 'chevron-forward'
              }
              size={16}
              color="#CBD5E1"
              style={styles.chevron}
            />
          </View>
        </Pressable>
      </Animated.View>
    </Swipeable>
  );
};

export default NotificationCard;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',

    shadowColor: '#64748B',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
    // Kept constant (never 0) so cardUnread only ever changes borderColor,
    // never borderWidth. Toggling borderWidth on/off is what still caused
    // the Android "black box" artifact even after elevation was equalized —
    // Android rebuilds the View's background drawable when a border is
    // added where none existed, and elevation's shadow outline is derived
    // from that same drawable.
    borderWidth: 1,
    borderColor: 'transparent',
  },

  cardUnread: {
    backgroundColor: colors.selectedCardBackground,
    borderColor: `${colors.primary}26`,
    shadowOpacity: 0.1,
    elevation: 3,
  },

  cardRTL: {
    flexDirection: 'row-reverse',
    paddingRight: 16,
    paddingLeft: 14,
  },

  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 4,
    backgroundColor: '#4757E7',
  },

  unreadBarRTL: {
    left: undefined,
    right: 0,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    marginTop: 3,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4757E7',
  },

  chevron: {
    marginTop: 2,
  },

  deleteAction: {
    width: 80,
    marginTop: 10,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },

  deleteLabel: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
});
