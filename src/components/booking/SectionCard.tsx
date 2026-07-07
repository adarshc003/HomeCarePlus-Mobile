import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {Fonts} from '../../constants/fonts';

interface Props {
  title: string;
  children: React.ReactNode;
}

const SectionCard = ({
  title,
  children,
}: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {title}
      </Text>

      {children}
    </View>
  );
};

export default SectionCard;

const styles = StyleSheet.create({

  card: {

    backgroundColor: '#FFFFFF',

    borderRadius: 22,

    padding: 18,

    marginBottom: 16,

    shadowColor: '#000',

    shadowOpacity: 0.05,

    shadowRadius: 10,

    shadowOffset: {

      width: 0,

      height: 5,

    },

    elevation: 3,

  },

  title: {

    color: '#94A3B8',

    fontSize: 13,

    marginBottom: 12,

    fontFamily: Fonts.medium,

  },

});