import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import SplashScreen from '../screens/common/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';

import ServiceDetailsScreen from '../screens/services/ServiceDetailsScreen';


import AddressScreen from '../screens/booking/AddressScreen';
import ScheduleScreen from '../screens/booking/ScheduleScreen';
import BookingSummaryScreen from '../screens/booking/BookingSummaryScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import BookingSuccessScreen from '../screens/booking/BookingSuccessScreen';
import MyBookingsScreen from '../screens/booking/MyBookingsScreen';

import ProfileScreen from '../screens/profile/ProfileScreen';
import AddOnScreen from '../screens/services/AddOnScreen';

import BottomTabs from './BottomTabs';
import {RootStackParamList} from './types';
import Toast from 'react-native-toast-message';

import LanguageScreen from '../screens/profile/LanguageScreen';

import BookingDetailsScreen
from '../screens/booking/BookingDetailsScreen';

import NotificationScreen
from '../screens/notification/NotificationScreen';

import {navigationRef} from './navigationRef';


const Stack =
  createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <>
      <NavigationContainer
  ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
          }}>
          
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
          />

          <Stack.Screen
            name="Home"
            component={BottomTabs}
          />

<Stack.Screen
  name="Login"
  component={LoginScreen}
  options={{
    presentation: 'transparentModal',
    animation: 'slide_from_bottom',
  }}
/>

<Stack.Screen
  name="Otp"
  component={OtpScreen}
  options={{
    presentation: 'transparentModal',
    animation: 'slide_from_bottom',
  }}
/>

          <Stack.Screen
            name="ServiceDetails"
            component={ServiceDetailsScreen}
          />


<Stack.Screen
  name="AddOn"
  component={AddOnScreen}
/>

          <Stack.Screen
            name="Address"
            component={AddressScreen}
          />

          <Stack.Screen
            name="Schedule"
            component={ScheduleScreen}
          />

          <Stack.Screen
            name="BookingSummary"
            component={BookingSummaryScreen}
          />

          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
          />

          <Stack.Screen
            name="BookingSuccess"
            component={BookingSuccessScreen}
          />

          <Stack.Screen
            name="MyBookings"
            component={MyBookingsScreen}
          />

          <Stack.Screen
  name="BookingDetails"
  component={BookingDetailsScreen}
/>

          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
          />

          <Stack.Screen
  name="Language"
  component={LanguageScreen}
/>

<Stack.Screen
  name="Notifications"
  component={NotificationScreen}
/>

        </Stack.Navigator>
      </NavigationContainer>
      

      <Toast />
    </>
  );
};
export default RootNavigator;