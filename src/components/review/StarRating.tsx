import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

interface Props {
  rating: number;
  onChange: (rating: number) => void;
}

const STARS = [1, 2, 3, 4, 5];

const StarRating = ({
  rating,
  onChange,
}: Props) => {

  const scales = STARS.map(
    () => React.useRef(new Animated.Value(1)).current,
  );

  const handlePress = (item: number) => {
    const scale = scales[item - 1];

    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.35,
        useNativeDriver: true,
        speed: 80,
        bounciness: 10,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 60,
        bounciness: 6,
      }),
    ]).start();

    onChange(item);
  };

  return (
    <View style={styles.container}>
      {STARS.map(item => {
        const filled = item <= rating;
        const isHalf = false; // extensible

        return (
          <TouchableOpacity
            key={item}
            activeOpacity={0.75}
            onPress={() => handlePress(item)}
            style={styles.starButton}>

            <Animated.View
              style={{transform: [{scale: scales[item - 1]}]}}>
              <Ionicons
                name={filled ? 'star-sharp' : 'star-outline'}
                size={44}
                color={filled ? '#F59E0B' : '#CBD5E1'}
              />
            </Animated.View>

          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default StarRating;

const styles = StyleSheet.create({

  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
    gap: 6,
  },

  starButton: {
    padding: 4,
  },

});
