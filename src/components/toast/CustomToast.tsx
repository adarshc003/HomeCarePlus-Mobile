import React from 'react';

import {View, Text, StyleSheet} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import {useTheme} from '../../hooks/useTheme';
import {useLanguageStore} from '../../store/languageStore';
import {Fonts} from '../../constants/fonts';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Props {
  text1?: string;
  text2?: string;
  variant: ToastVariant;
}

const ICONS: Record<ToastVariant, string> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
};

// Custom render for react-native-toast-message's `config` prop — the
// library still owns show/hide timing, queueing, and the slide/fade
// animation; this only replaces what's drawn inside it, so no new
// animation or toast library is introduced.
const CustomToast = ({text1, text2, variant}: Props) => {
  const {colors} = useTheme();
  const language = useLanguageStore(state => state.language);
  const isRTL = language === 'ar';
  const styles = createStyles(colors);

  const accentColor =
    variant === 'success'
      ? colors.success
      : variant === 'error'
      ? colors.error
      : variant === 'warning'
      ? colors.warning
      : colors.primary;

  return (
    <View style={[styles.card, isRTL && styles.cardRTL]}>
      <View style={[styles.accentBar, isRTL ? styles.accentBarRTL : styles.accentBarLTR, {backgroundColor: accentColor}]} />

      <View style={[styles.iconWrap, {backgroundColor: `${accentColor}1A`}]}>
        <Ionicons name={ICONS[variant] as any} size={20} color={accentColor} />
      </View>

      <View style={styles.textBlock}>
        {text1 ? (
          <Text numberOfLines={2} style={styles.text1}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text numberOfLines={2} style={styles.text2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default CustomToast;

// Passed to <Toast config={toastConfig} /> — this is react-native-toast-
// message's own supported customization point, so no new toast library is
// introduced. Each entry just renders CustomToast for that message type.
export const toastConfig = {
  success: (props: any) => (
    <CustomToast text1={props.text1} text2={props.text2} variant="success" />
  ),
  error: (props: any) => (
    <CustomToast text1={props.text1} text2={props.text2} variant="error" />
  ),
  info: (props: any) => (
    <CustomToast text1={props.text1} text2={props.text2} variant="info" />
  ),
  warning: (props: any) => (
    <CustomToast text1={props.text1} text2={props.text2} variant="warning" />
  ),
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    card: {
      width: '92%',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 18,
      shadowOffset: {width: 0, height: 8},
      elevation: 10,
    },

    cardRTL: {
      flexDirection: 'row-reverse',
    },

    accentBar: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 4,
    },

    accentBarLTR: {
      left: 0,
    },

    accentBarRTL: {
      right: 0,
    },

    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },

    textBlock: {
      flex: 1,
    },

    text1: {
      fontSize: 14,
      fontFamily: Fonts.semiBold,
      color: colors.textPrimary,
    },

    text2: {
      marginTop: 2,
      fontSize: 12.5,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      lineHeight: 17,
    },
  });
