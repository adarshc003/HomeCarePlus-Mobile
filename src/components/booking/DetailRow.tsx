import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {Fonts} from '../../constants/fonts';
import {useTheme} from '../../hooks/useTheme';

interface Props {

  label: string;

  value: string;

}

const DetailRow = ({
  label,
  value,
}: Props) => {

  const {colors} = useTheme();
  const styles = createStyles(colors);

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

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  row: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    marginBottom: 12,

  },

  label: {

    color: colors.textSecondary,

    fontFamily: Fonts.medium,

    flex: 1,

  },

  value: {

    color: colors.textPrimary,

    fontFamily: Fonts.semiBold,

    flex: 1,

    textAlign: 'right',

  },

});