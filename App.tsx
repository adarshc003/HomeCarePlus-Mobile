import React, {useEffect} from 'react';
import {StatusBar, Linking} from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';

import NotificationProvider from './src/providers/NotificationProvider';

import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {useTheme} from './src/hooks/useTheme';

import {navigationRef} from './src/navigation/navigationRef';

const App = () => {
  const {colors} = useTheme();

  useEffect(() => {
    // InAppBrowser.openAuth() (used by PaymentScreen for the Tamara/Telr
    // checkout redirect) intercepts homecareplus://payment itself and
    // never lets it reach here in the common case. This only catches the
    // rarer paths that bypass that interception: InAppBrowser.isAvailable()
    // being false (PaymentScreen then falls back to Linking.openURL,
    // opening the system browser instead) or the app process being killed
    // and later relaunched via the redirect URL. Previously nothing caught
    // this at all — routing to My Bookings (which already polls/refreshes
    // booking status correctly on its own) is far better than leaving the
    // user stranded on whatever screen they happen to land on.
    const handleUrl = (url: string | null) => {
      if (url && url.startsWith('homecareplus://payment') && navigationRef.isReady()) {
        navigationRef.navigate('MyBookings');
      }
    };

    Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener(
      'url',
      ({url}) => handleUrl(url),
    );

    return () => subscription.remove();
  }, []);

return (
  <GestureHandlerRootView
    style={{flex: 1}}>
    <SafeAreaProvider>
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.background}
      />
      <NotificationProvider>
        <RootNavigator />
      </NotificationProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
};

export default App;