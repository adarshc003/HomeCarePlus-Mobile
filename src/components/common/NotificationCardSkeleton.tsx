import React from 'react';
import {View, StyleSheet} from 'react-native';

import Skeleton from '../skeleton/Skeleton';
import {useTheme} from '../../hooks/useTheme';
import {useLanguageStore} from '../../store/languageStore';

// Mirrors NotificationCard.tsx's own card/iconContainer/content/trailing
// exactly (same margins, padding, borderRadius, shadow) so swapping it for
// the real card never shifts layout. NotificationCard today renders an
// icon + title + message only (no separate timestamp element), so this
// matches that real layout rather than inventing an extra line.
const NotificationCardSkeleton = () => {
  const {colors} = useTheme();
  const language = useLanguageStore(state => state.language);
  const isRTL = language === 'ar';
  const styles = createStyles(colors);

  return (
    <View style={[styles.card, isRTL && styles.cardRTL]}>
      <Skeleton width={48} height={48} borderRadius={14} />

      <View style={styles.content}>
        <Skeleton width="70%" height={14} borderRadius={6} />
        <Skeleton width="90%" height={13} borderRadius={6} style={styles.bodyLine} />
      </View>

      <View style={styles.trailing}>
        <Skeleton width={8} height={8} borderRadius={4} />
      </View>
    </View>
  );
};

export default NotificationCardSkeleton;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 20,
      paddingVertical: 14,
      paddingRight: 14,
      paddingLeft: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#64748B',
      shadowOpacity: 0.07,
      shadowRadius: 10,
      shadowOffset: {width: 0, height: 4},
      elevation: 3,
    },

    cardRTL: {
      flexDirection: 'row-reverse',
    },

    content: {
      flex: 1,
      marginHorizontal: 12,
    },

    bodyLine: {
      marginTop: 6,
    },

    trailing: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
