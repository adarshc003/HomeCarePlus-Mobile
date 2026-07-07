import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {Fonts} from '../../constants/fonts';

interface Props {

  label: string;

  value: string;

}

const DetailRow = ({
  label,
  value,
}: Props) => {

  return (

    <View style={styles.row}>

      <Text style={styles.label}>
        {label}
      </Text>

      <Text style={styles.value}>
        {value}
      </Text>

    </View>

  );

};

export default DetailRow;

const styles = StyleSheet.create({

  row: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    marginBottom: 12,

  },

  label: {

    color: '#64748B',

    fontFamily: Fonts.medium,

    flex: 1,

  },

  value: {

    color: '#0F172A',

    fontFamily: Fonts.semiBold,

    flex: 1,

    textAlign: 'right',

  },

});