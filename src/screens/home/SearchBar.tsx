import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useServiceStore } from '../../store/serviceStore';
import { useLanguageStore } from '../../store/languageStore';
import { t } from '../../i18n';
import { Fonts } from '../../constants/fonts';
import { useTheme } from '../../hooks/useTheme';

const SearchBar = ({
  onSearch,
  searchText,
  setSearchText,
  autoFocus = false,
}: any) => {
  const searchServices = useServiceStore(
    state => state.searchServices,
  );
  const language = useLanguageStore(state => state.language);
  // The app's own language toggle drives RTL, not the device's system
  // locale — I18nManager.isRTL reflects the latter and stays false here
  // since the app never calls I18nManager.forceRTL(), which left Arabic
  // text always left-aligned regardless of the in-app language. Same
  // isRTL-from-language-store pattern already used in FeedbackDialog.tsx /
  // HeroSection.tsx / NotificationCardSkeleton.tsx.
  const isRTL = language === 'ar';

  const {colors} = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <Ionicons
          name="search"
          size={22}
          color={colors.textSecondary}
          style={[styles.searchIcon, isRTL && styles.searchIconRTL]}
        />

        <TextInput
          autoFocus={autoFocus}
          value={searchText}
          placeholder={t('searchServices', language)}
          placeholderTextColor={colors.textHint}
          style={styles.input}
          returnKeyType="search"
          textAlign={isRTL ? 'right' : 'left'}
          onChangeText={text => {
            setSearchText(text);
            searchServices(text);
          }}
          onSubmitEditing={() => onSearch?.()}
        />

        {searchText.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setSearchText('');
              searchServices('');
              onSearch?.();
            }}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textHint}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SearchBar;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  wrapper: {
    marginTop: 24,
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    minHeight: 62,
    borderRadius: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchIconRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: Fonts.medium,
    paddingVertical: 0,
  },
});
