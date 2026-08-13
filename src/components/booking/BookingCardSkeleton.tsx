import React from 'react';
import {View, StyleSheet} from 'react-native';

import Skeleton from '../skeleton/Skeleton';
import {useTheme} from '../../hooks/useTheme';

// Mirrors BookingCard.tsx's own card/topRow/infoRow/bottomRow exactly (same
// padding, borderRadius, marginBottom, shadow) so swapping it for the real
// card never shifts layout.
const BookingCardSkeleton = () => {
  const {colors} = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Skeleton width="55%" height={20} borderRadius={6} />
        <Skeleton width={90} height={30} borderRadius={16} />
      </View>

      <Skeleton width="40%" height={13} borderRadius={6} style={styles.bookingId} />

      <View style={styles.infoRow}>
        <Skeleton width={110} height={14} borderRadius={6} />
        <Skeleton width={70} height={14} borderRadius={6} />
      </View>

      <View style={styles.bottomRow}>
        <Skeleton width={90} height={14} borderRadius={6} />
      </View>
    </View>
  );
};

export default BookingCardSkeleton;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: {width: 0, height: 5},
      elevation: 4,
    },

    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    bookingId: {
      marginTop: 12,
    },

    infoRow: {
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    bottomRow: {
      marginTop: 20,
      alignItems: 'flex-end',
    },
  });
