import React from 'react';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import Ionicons from '@react-native-vector-icons/ionicons';

import HomeScreen from '../screens/home/HomeScreen';

import MyBookingsScreen from '../screens/booking/MyBookingsScreen';

import ProfileScreen from '../screens/profile/ProfileScreen';

import {useLanguageStore} from '../store/languageStore';

import {t} from '../i18n';

import {Fonts} from '../constants/fonts';

import {useTheme} from '../hooks/useTheme';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  const language = useLanguageStore(
    state => state.language,
  );

  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,

        tabBarActiveTintColor: colors.primary,

        tabBarInactiveTintColor: colors.textHint,

        tabBarStyle: styles.tabBar,

        tabBarLabelStyle: styles.label,

        tabBarHideOnKeyboard: true,

        tabBarIcon: ({color, focused, size}) => {
          let iconName:
            | 'home'
            | 'home-outline'
            | 'document-text'
            | 'document-text-outline'
            | 'person'
            | 'person-outline' = 'home-outline';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          }

          if (route.name === 'BookingsTab') {
            iconName = focused
              ? 'document-text'
              : 'document-text-outline';
          }

          if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View
              style={[
                styles.iconWrap,
                focused && styles.iconWrapActive,
              ]}>
              <Ionicons
                name={iconName}
                size={22}
                color={color}
              />
            </View>
          );
        },
      })}>

      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: t('home', language),
        }}
      />

      <Tab.Screen
        name="BookingsTab"
        component={MyBookingsScreen}
        options={{
          title: t('bookings', language),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: t('profile', language),
        }}
      />

    </Tab.Navigator>
  );
};

export default BottomTabs;

const createStyles = (colors: ReturnType<typeof useTheme>['colors'], safeBottom: number) => StyleSheet.create({

  tabBar: {
    position: 'absolute',
    bottom: Math.max(20, safeBottom),
    marginHorizontal: 60,
    height: 68,
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#1E293B',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },

  label: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
    letterSpacing: 0.1,
  },

  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconWrapActive: {
    backgroundColor: `${colors.primary}1F`,
  },
});
