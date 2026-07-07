import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {Fonts} from '../../constants/fonts';

interface Props {

  title: string;

  value: string;

}

const InfoCard = ({
  title,
  value,
}: Props) => {

  return (

    <View style={styles.card}>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.value}>
        {value}
      </Text>

    </View>

  );

};

export default InfoCard;

const styles = StyleSheet.create({

  card: {

    backgroundColor: '#fff',

    borderRadius: 18,

    padding: 18,

    marginBottom: 14,

    elevation: 3,

    shadowColor: '#000',

    shadowOpacity: 0.04,

    shadowRadius: 8,

    shadowOffset: {

      width: 0,

      height: 4,

    },

  },

  title: {

    color: '#94A3B8',

    fontSize: 13,

    fontFamily: Fonts.medium,

  },

  value: {

    marginTop: 8,

    color: '#0F172A',

    fontSize: 16,

    fontFamily: Fonts.semiBold,

  },

});