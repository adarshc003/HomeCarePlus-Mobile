import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';
import {Fonts} from '../../constants/fonts';

const LanguageScreen = ({
  navigation,
}: any) => {
  const language = useLanguageStore(
    state => state.language,
  );

  const setLanguage = useLanguageStore(
    state => state.setLanguage,
  );

  const [selectedLanguage, setSelectedLanguage] =
    useState(language);

  const handleApply = async () => {
    await setLanguage(selectedLanguage);
    navigation.goBack();
  };

  const isEnSelected = selectedLanguage === 'en';
  const isArSelected = selectedLanguage === 'ar';

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons
            name={
              language === 'ar'
                ? 'chevron-forward'
                : 'chevron-back'
            }
            size={22}
            color="#0F172A"
          />
        </TouchableOpacity>

        <View style={styles.headerTextBlock}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeDot} />
            <Text style={styles.badge}>
              {t('languageSettings', language)}
            </Text>
          </View>

          <Text style={styles.title}>
            {t('language', language)}
          </Text>

          <Text style={styles.subtitle}>
            {t('languageSubtitle', language)}
          </Text>
        </View>
      </View>

      {/* ── English option ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.option,
          isEnSelected && styles.selectedOption,
        ]}
        onPress={() => setSelectedLanguage('en')}>

        {isEnSelected && <View style={styles.selectedTopBar} />}

        <View style={styles.leftRow}>
          <View style={[
            styles.iconContainer,
            isEnSelected && styles.selectedIcon,
          ]}>
            <Text style={styles.flag}>🇬🇧</Text>
          </View>

          <View style={styles.optionTextBlock}>
            <Text style={[
              styles.optionTitle,
              isEnSelected && styles.optionTitleSelected,
            ]}>
              English
            </Text>
            <Text style={styles.optionSubtitle}>
              {t('defaultLanguage', language)}
            </Text>
          </View>
        </View>

        <View style={[
          styles.radioOuter,
          isEnSelected && styles.radioOuterSelected,
        ]}>
          {isEnSelected && <View style={styles.radioInner} />}
        </View>

      </TouchableOpacity>

      {/* ── Arabic option ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.option,
          isArSelected && styles.selectedOption,
        ]}
        onPress={() => setSelectedLanguage('ar')}>

        {isArSelected && <View style={styles.selectedTopBar} />}

        <View style={styles.leftRow}>
          <View style={[
            styles.iconContainer,
            isArSelected && styles.selectedIcon,
          ]}>
            <Text style={styles.flag}>🇸🇦</Text>
          </View>

          <View style={styles.optionTextBlock}>
            <Text style={[
              styles.optionTitle,
              isArSelected && styles.optionTitleSelected,
            ]}>
              العربية
            </Text>
            <Text style={styles.optionSubtitle}>
              {t('arabicLanguage', language)}
            </Text>
          </View>
        </View>

        <View style={[
          styles.radioOuter,
          isArSelected && styles.radioOuterSelected,
        ]}>
          {isArSelected && <View style={styles.radioInner} />}
        </View>

      </TouchableOpacity>

      {/* ── Selection hint ── */}
      {selectedLanguage !== language && (
        <View style={styles.hintRow}>
          <Ionicons
            name="information-circle-outline"
            size={15}
            color="#4757E7"
          />
          <Text style={styles.hintText}>
            {t('languageChangeHint', language)}
          </Text>
        </View>
      )}

      {/* ── Bottom row ── */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>
            {t('cancel', language)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            selectedLanguage === language &&
              styles.saveButtonDisabled,
          ]}
          onPress={handleApply}
          activeOpacity={0.85}
          disabled={selectedLanguage === language}>
          <Ionicons
            name="checkmark-circle-outline"
            size={17}
            color="#FFFFFF"
          />
          <Text style={styles.saveText}>
            {t('save', language)}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default LanguageScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  // ── Header ──────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 32,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 4,
  },

  headerTextBlock: {
    flex: 1,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4757E7',
  },

  badge: {
    color: '#4757E7',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Fonts.semiBold,
  },

  title: {
    fontSize: 28,
    color: '#0F172A',
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },

  // ── Option cards ─────────────────────────
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },

  selectedOption: {
    borderColor: '#4757E7',
    backgroundColor: '#FAFBFF',
    shadowColor: '#4757E7',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  selectedTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#4757E7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },

  selectedIcon: {
    backgroundColor: '#EEF2FF',
  },

  flag: {
    fontSize: 26,
  },

  optionTextBlock: {
    flex: 1,
  },

  optionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },

  optionTitleSelected: {
    color: '#4757E7',
  },

  optionSubtitle: {
    color: '#94A3B8',
    marginTop: 3,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },

  // ── Custom radio ──────────────────────────
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  radioOuterSelected: {
    borderColor: '#4757E7',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4757E7',
  },

  // ── Hint ──────────────────────────────────
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7CEFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 4,
  },

  hintText: {
    flex: 1,
    color: '#4757E7',
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },

  // ── Bottom row ────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cancelText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

  saveButton: {
    flex: 2,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#4757E7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#4757E7',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },

  saveButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});
