import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {Fonts} from '../../constants/fonts';
import {useTheme} from '../../hooks/useTheme';

interface Props {
  title: string;
  children: React.ReactNode;
}

const SectionCard = ({
  title,
  children,
}: Props) => {
  const {colors} = useTheme();
  const styles = createStyles(colors);

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

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  card: {

    backgroundColor: colors.card,

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

    color: colors.textHint,

    fontSize: 13,

    marginBottom: 12,

    fontFamily: Fonts.medium,

  },

});