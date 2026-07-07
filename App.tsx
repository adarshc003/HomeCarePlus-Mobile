import React, {useEffect} from 'react';
import RootNavigator from './src/navigation/RootNavigator';

import {useAuthStore} from './src/store/authStore';

import NotificationProvider from './src/providers/NotificationProvider';

import {GestureHandlerRootView} from 'react-native-gesture-handler';

const App = () => {
  const loadUser =
    useAuthStore(state => state.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

return (
  <GestureHandlerRootView
    style={{flex: 1}}>
    <NotificationProvider>
      <RootNavigator />
    </NotificationProvider>
  </GestureHandlerRootView>
);
};

export default App;