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
  useNotificationStore,
} from '../../store/notificationStore';

import {
  Swipeable,
} from 'react-native-gesture-handler';

import {
  deleteNotification,
} from '../../services/notificationApi';



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

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const markRead =
    useNotificationStore(
      state => state.markRead,
    );

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
      renderRightActions={RightAction}
      onSwipeableOpen={onDelete}
      overshootRight={false}>
      <Animated.View
        style={{transform: [{scale: scaleAnim}]}}>
        <Pressable
          style={[
            styles.card,
            !item.isRead && styles.cardUnread,
          ]}
          android_ripple={{
            color: '#EEF2FF',
            borderless: false,
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

                markRead(notificationId);

                try {
                  await markNotificationRead(
                    notificationId,
                  );
                } catch (error) {
                  console.log(error);
                }
              }

              switch (item.type) {
                case 'booking':
                case 'payment':
                case 'review':
                  if (item.data?.bookingId) {
                    navigation.navigate(
                      'BookingDetails',
                      {
                        bookingNumber: String(
                          item.data.bookingId,
                        ),
                      },
                    );
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
            <View style={styles.unreadBar} />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
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
  },

  cardUnread: {
    backgroundColor: '#FAFBFF',
    shadowOpacity: 0.1,
    elevation: 4,
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
    color: '#0F172A',
    lineHeight: 20,
  },

  body: {
    marginTop: 3,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#64748B',
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
