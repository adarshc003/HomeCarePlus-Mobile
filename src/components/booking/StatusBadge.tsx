import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {Fonts} from '../../constants/fonts';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import Ionicons from '@react-native-vector-icons/ionicons';

interface Props {
  status: string;
}

const StatusBadge = ({status}: Props) => {

  const language = useLanguageStore(
    state => state.language,
  );

const getColor = () => {

  switch (status) {

    case 'pending':
    case 'pending_assignment':
      return '#F59E0B';

    case 'assigned':
      return '#2563EB';

    case 'travelling':
    case 'on_the_way':
      return '#7C3AED';

    case 'started':
    case 'in_progress':
      return '#0EA5E9';

    case 'completed':
      return '#22C55E';

    case 'cancelled':
      return '#EF4444';

    default:
      return '#94A3B8';

  }

};

const getLabel = () => {

  switch (status) {

    case 'pending':
      return t(
        'statusPending',
        language,
      );

    case 'pending_assignment':
      return t(
        'statusPendingAssignment',
        language,
      );

    case 'assigned':
      return t(
        'statusAssigned',
        language,
      );

    case 'travelling':
    case 'on_the_way':
      return t(
        'statusTravelling',
        language,
      );

    case 'started':
    case 'in_progress':
      return t(
        'statusStarted',
        language,
      );

    case 'completed':
      return t(
        'statusCompleted',
        language,
      );

    case 'cancelled':
      return t(
        'statusCancelled',
        language,
      );

    default:
      return status;

  }

};

const getIcon = () => {

  switch (status) {

    case 'pending':
      return 'checkmark-circle';

    case 'pending_assignment':
      return 'search-circle';

    case 'assigned':
      return 'person-circle';

    case 'travelling':
    case 'on_the_way':
      return 'car';

    case 'started':
    case 'in_progress':
      return 'construct';

    case 'completed':
      return 'checkmark-done-circle';

    case 'cancelled':
      return 'close-circle';

    default:
      return 'ellipse';

  }

};

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: getColor()},
      ]}>
<View
  style={{
    flexDirection: 'row',
    alignItems: 'center',
  }}>

  <Ionicons
    name={getIcon()}
    size={14}
    color="#FFFFFF"
    style={{
      marginRight: 6,
    }}
  />

  <Text style={styles.text}>
    {getLabel()}
  </Text>

</View>
    </View>
  );
};

export default StatusBadge;

const styles = StyleSheet.create({

  container: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },

  text: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
});
