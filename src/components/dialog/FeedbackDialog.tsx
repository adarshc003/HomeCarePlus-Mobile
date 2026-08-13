import React, {useEffect, useRef, useState} from 'react';

import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import {useTheme} from '../../hooks/useTheme';
import {useLanguageStore} from '../../store/languageStore';
import {t} from '../../i18n';
import {Fonts} from '../../constants/fonts';

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export interface DialogButton {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void | Promise<void>;
}

export type DialogVariant = 'default' | 'success' | 'error' | 'warning';

export interface DialogOptions {
  title: string;
  description?: string;
  icon?: string;
  variant?: DialogVariant;
  buttons?: DialogButton[];
}

const defaultIconFor = (variant?: DialogVariant) => {
  switch (variant) {
    case 'success':
      return 'checkmark-circle';
    case 'error':
      return 'alert-circle';
    case 'warning':
      return 'warning';
    default:
      return 'information-circle';
  }
};

// Imperative API — a drop-in replacement call shape for Alert.alert(), so
// every existing call site swaps over with its exact same title/message/
// buttons/callbacks. FeedbackDialogHost (rendered once, near <Toast/>)
// owns the actual visible state; this ref is how any file can trigger it
// without threading visibility state through every screen.
let dialogHostRef: {show: (options: DialogOptions) => void} | null = null;

// Unlike Alert.alert() (which queues), a second showDialog() call while one
// is already visible previously clobbered the first before the user could
// read it — options were simply overwritten. isDialogVisible/pendingQueue
// live outside React state (module scope) rather than reading the host's
// own `visible` state directly, since a closure captured once at mount
// (dialogHostRef.show is only ever (re)assigned inside a useEffect keyed on
// stable refs) would otherwise always see the initial, stale value.
let isDialogVisible = false;
const pendingQueue: DialogOptions[] = [];

const displayNext = (options: DialogOptions) => {
  isDialogVisible = true;
  dialogHostRef?.show(options);
};

export const showDialog = (options: DialogOptions) => {
  if (isDialogVisible) {
    pendingQueue.push(options);
    return;
  }

  displayNext(options);
};

const FeedbackDialogHost = () => {
  const {colors} = useTheme();
  const language = useLanguageStore(state => state.language);
  const isRTL = language === 'ar';
  const styles = createStyles(colors);

  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dialogHostRef = {
      show: opts => {
        setOptions(opts);
        setLoadingIndex(null);
        setVisible(true);
        scale.setValue(0.92);
        opacity.setValue(0);
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 6,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      },
    };

    return () => {
      dialogHostRef = null;
    };
  }, [scale, opacity]);

  const close = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setOptions(null);
      setLoadingIndex(null);

      isDialogVisible = false;

      const next = pendingQueue.shift();

      if (next) {
        displayNext(next);
      }
    });
  };

  const handleBackdropPress = () => {
    // Never let a backdrop tap dismiss the dialog while a button's async
    // onPress is still in flight — the underlying action (e.g. cancelling a
    // booking) must be allowed to finish and report its own result.
    if (loadingIndex !== null) {
      return;
    }
    close();
  };

  const handleButtonPress = async (button: DialogButton, index: number) => {
    if (loadingIndex !== null) {
      return;
    }

    const result = button.onPress?.();

    if (result && typeof (result as Promise<void>).then === 'function') {
      setLoadingIndex(index);
      try {
        await result;
      } finally {
        close();
      }
    } else {
      close();
    }
  };

  if (!options) {
    return null;
  }

  const buttons: DialogButton[] =
    options.buttons && options.buttons.length > 0
      ? options.buttons
      : [{text: t('ok', language), style: 'default'}];

  const variantColor =
    options.variant === 'success'
      ? colors.success
      : options.variant === 'error'
      ? colors.error
      : options.variant === 'warning'
      ? colors.warning
      : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, {opacity}]} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centerWrap}
          pointerEvents="box-none">
          <Animated.View
            style={[
              styles.card,
              {opacity, transform: [{scale}]},
            ]}
            accessibilityViewIsModal
            accessibilityRole="alert">

            <View style={[styles.iconWrap, {backgroundColor: `${variantColor}1A`}]}>
              <Ionicons
                name={(options.icon || defaultIconFor(options.variant)) as any}
                size={28}
                color={variantColor}
              />
            </View>

            <Text style={styles.title}>{options.title}</Text>

            {options.description ? (
              <Text style={styles.description}>{options.description}</Text>
            ) : null}

            <View
              style={[
                styles.buttonRow,
                isRTL && styles.buttonRowRTL,
                buttons.length > 2 && styles.buttonColumn,
              ]}>
              {buttons.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';
                const isLoadingThis = loadingIndex === index;
                const disabled = loadingIndex !== null && !isLoadingThis;

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={button.text}
                    onPress={() => handleButtonPress(button, index)}
                    style={[
                      styles.button,
                      isCancel
                        ? styles.buttonCancel
                        : isDestructive
                        ? styles.buttonDestructive
                        : styles.buttonPrimary,
                      disabled && styles.buttonDisabled,
                    ]}>
                    {isLoadingThis ? (
                      <ActivityIndicator
                        size="small"
                        color={isCancel ? colors.textPrimary : '#FFFFFF'}
                      />
                    ) : (
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.buttonText,
                          isCancel
                            ? styles.buttonTextCancel
                            : styles.buttonTextOnColor,
                        ]}>
                        {button.text}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default FeedbackDialogHost;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },

    backdrop: {
      backgroundColor: 'rgba(8,10,20,0.55)',
    },

    centerWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
    },

    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.card,
      borderRadius: 26,
      paddingTop: 26,
      paddingHorizontal: 22,
      paddingBottom: 18,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.28,
      shadowRadius: 26,
      shadowOffset: {width: 0, height: 12},
      elevation: 14,
    },

    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },

    title: {
      fontSize: 17,
      fontFamily: Fonts.semiBold,
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.2,
    },

    description: {
      marginTop: 8,
      fontSize: 14,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 22,
      width: '100%',
    },

    buttonRowRTL: {
      flexDirection: 'row-reverse',
    },

    buttonColumn: {
      flexDirection: 'column',
    },

    button: {
      flex: 1,
      minHeight: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 14,
    },

    buttonPrimary: {
      backgroundColor: colors.primary,
    },

    buttonDestructive: {
      backgroundColor: colors.error,
    },

    buttonCancel: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },

    buttonDisabled: {
      opacity: 0.5,
    },

    buttonText: {
      fontSize: 14,
      fontFamily: Fonts.semiBold,
    },

    buttonTextOnColor: {
      color: '#FFFFFF',
    },

    buttonTextCancel: {
      color: colors.textPrimary,
    },
  });
