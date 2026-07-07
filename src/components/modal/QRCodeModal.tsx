import React from 'react';

import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import QRCode from 'react-native-qrcode-svg';

import {Fonts} from '../../constants/fonts';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

interface Props {
  visible: boolean;
  qrValue: string;
  bookingNumber: string;
  onClose: () => void;
}

const QRCodeModal = ({
  visible,
  qrValue,
  bookingNumber,
  onClose,
}: Props) => {

  const language = useLanguageStore(
    state => state.language,
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent>

      <View style={styles.overlay}>
        <View style={styles.container}>

          <Text style={styles.title}>
            {t('serviceVerification', language)}
          </Text>

          <Text style={styles.subtitle}>
            {t('showQrAfterService', language)}
          </Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={220}
            />
          </View>

          <Text style={styles.booking}>
            {bookingNumber}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}>
            <Text style={styles.buttonText}>
              {t('close', language)}
            </Text>
          </TouchableOpacity>

        </View>
      </View>

    </Modal>
  );
};

export default QRCodeModal;

const styles = StyleSheet.create({

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },

  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    color: '#0F172A',
    fontFamily: Fonts.bold,
  },

  subtitle: {
    marginTop: 10,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 22,
    fontFamily: Fonts.medium,
  },

  qrContainer: {
    marginVertical: 30,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  booking: {
    fontSize: 15,
    color: '#64748B',
    fontFamily: Fonts.medium,
  },

  button: {
    marginTop: 24,
    backgroundColor: '#4757E7',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
