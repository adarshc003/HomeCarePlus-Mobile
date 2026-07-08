import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';

import {useAuthStore} from './src/store/authStore';

import NotificationProvider from './src/providers/NotificationProvider';

import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {useTheme} from './src/hooks/useTheme';

const App = () => {
  const loadUser =
    useAuthStore(state => state.loadUser);

  const {colors} = useTheme();

  useEffect(() => {
    loadUser();
  }, []);

return (
  <GestureHandlerRootView
    style={{flex: 1}}>
    <StatusBar
      barStyle={colors.statusBarStyle}
      backgroundColor={colors.background}
    />
    <NotificationProvider>
      <RootNavigator />
    </NotificationProvider>
  </GestureHandlerRootView>
);
};

export default App;