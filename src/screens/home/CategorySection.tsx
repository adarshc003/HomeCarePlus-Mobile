import React, {useRef} from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';

import Icon from '@react-native-vector-icons/ionicons';

import {useCategoryStore} from '../../store/categoryStore';
import {useServiceStore} from '../../store/serviceStore';
import {useLanguageStore} from '../../store/languageStore';
import {Fonts} from '../../constants/fonts';
import {useTheme} from '../../hooks/useTheme';

interface AnimatedChipProps {
  item: any;
  isSelected: boolean;
  displayName: string;
  onPress: () => void;
}

const AnimatedChip = ({
  item,
  isSelected,
  displayName,
  onPress,
}: AnimatedChipProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.93,
        useNativeDriver: true,
        speed: 80,
        bounciness: 0,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 60,
        bounciness: 8,
      }),
    ]).start();

    onPress();
  };

  const iconName = item.code === 'all'
    ? 'home'
    : (item.icon || 'apps-outline') as any;

  return (
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        style={[
          styles.chip,
          isSelected ? styles.chipSelected : styles.chipDefault,
        ]}>

        {/* Icon blob */}
        <View
          style={[
            styles.iconBlob,
            isSelected
              ? styles.iconBlobSelected
              : styles.iconBlobDefault,
          ]}>
          <Icon
            name={iconName}
            size={16}
            color={isSelected ? '#FFFFFF' : colors.primary}
          />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.label,
            isSelected ? styles.labelSelected : styles.labelDefault,
          ]}
          numberOfLines={1}>
          {displayName}
        </Text>

        {/* Selected dot */}
        {isSelected && <View style={styles.selectedDot} />}

      </TouchableOpacity>
    </Animated.View>
  );
};

const CategorySection = ({
  onCategorySelect,
}: any) => {

  const setCategory = useServiceStore(
    state => state.setCategory,
  );

  const selectedCategory = useServiceStore(
    state => state.selectedCategory,
  );

  const language = useLanguageStore(
    state => state.language,
  );

  const categories = useCategoryStore(
    state => state.categories,
  );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const allCategories = [
    {
      id: 'all',
      code: 'all',
      name: {en: 'All', ar: 'الكل'},
      icon: 'home',
    },
    ...categories,
  ];

  return (
    <View style={styles.section}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={allCategories}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => {
          const displayName =
            language === 'ar' ? item.name.ar : item.name.en;

          const isSelected = selectedCategory === item.code;

          return (
            <AnimatedChip
              item={item}
              isSelected={isSelected}
              displayName={displayName}
              onPress={() => {
                setCategory(item.code);
                onCategorySelect?.();
              }}
            />
          );
        }}
      />
    </View>
  );
};

export default CategorySection;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  section: {
    marginTop: 24,
  },

  listContent: {
    paddingHorizontal: 10,
    gap: 8,
    paddingRight: 20,
  },

  // ── Chip ─────────────────────────────────
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 22,
    gap: 8,
  },

  chipDefault: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  chipSelected: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },

  // ── Icon blob ─────────────────────────────
  iconBlob: {
    width: 40,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconBlobDefault: {
    backgroundColor: '#EFF6FF',
  },

  iconBlobSelected: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // ── Label ─────────────────────────────────
  label: {
    fontSize: 13,
    maxWidth: 90,
  },

  labelDefault: {
    color: colors.textSecondary,
    fontFamily: Fonts.medium,
  },

  labelSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },

  // ── Selected dot ──────────────────────────
  selectedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
    marginLeft: 2,
  },
});
