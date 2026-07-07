import React, {
  useEffect,
  useState,
} from 'react';

import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';

import QRCode from 'react-native-qrcode-svg';

import {Fonts} from '../../constants/fonts';

import StarRating from '../review/StarRating';

import {submitReview} from '../../services/bookingService';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

interface Props {
  visible: boolean;
  bookingId: string;
  qrToken: string;
  bookingNumber: string;
  status: string;
  reviewSubmitted: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

const VerificationModal = ({
  visible,
  bookingId,
  qrToken,
  bookingNumber,
  status,
  reviewSubmitted,
  onClose,
  onReviewSubmitted,
}: Props) => {

  const language = useLanguageStore(
    state => state.language,
  );

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    try {
      setSubmitting(true);

      await submitReview(bookingId, rating, review);

      setSubmitted(true);

      onReviewSubmitted();

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        t('serviceVerification', language),
        error?.response?.data?.message ||
          t('unableToSubmitReview', language),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade">

      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* ── QR / waiting state ── */}
          {status !== 'completed' && (
            <>
              <Text style={styles.title}>
                {t('serviceVerification', language)}
              </Text>
              <Text style={styles.subtitle}>
                {t('showQrAfterService', language)}
              </Text>
            </>
          )}

          {status !== 'completed' ? (
            <>
              <View style={styles.qrBox}>
                {qrToken ? (
                  <QRCode
                    value={JSON.stringify({
                      type: 'booking-verification',
                      bookingId,
                      token: qrToken,
                    })}
                    size={220}
                  />
                ) : (
                  <Text style={styles.waiting}>
                    {t('qrBeingGenerated', language)}
                  </Text>
                )}
              </View>

              <Text style={styles.booking}>
                {bookingNumber}
              </Text>

              <Text style={styles.waiting}>
                {t('waitingForVerification', language)}
              </Text>
            </>

          ) : reviewSubmitted || submitted ? (
            <>
              <Text style={{fontSize: 64}}>
                🎉
              </Text>
              <Text style={styles.title}>
                {t('thankYou', language)}
              </Text>
              <Text style={styles.waiting}>
                {t('reviewSubmittedSuccessfully', language)}
              </Text>
            </>

          ) : (
            <>
              <Text style={styles.title}>
                {t('serviceCompleted', language)}
              </Text>
              <Text style={styles.subtitle}>
                {t('howWasYourExperience', language)}
              </Text>

              <StarRating
                rating={rating}
                onChange={setRating}
              />

              <TextInput
                style={{
                  width: '100%',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  padding: 14,
                  minHeight: 100,
                  marginTop: 15,
                  color: '#0F172A',
                  fontFamily: Fonts.regular,
                  textAlignVertical: 'top',
                }}
                multiline
                placeholder={t('writeYourReview', language)}
                placeholderTextColor="#94A3B8"
                value={review}
                onChangeText={setReview}
              />

              <TouchableOpacity
                style={styles.button}
                disabled={submitting}
                onPress={handleSubmit}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t('submitReview', language)}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

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

export default VerificationModal;

const styles = StyleSheet.create({

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#0F172A',
  },

  subtitle: {
    marginTop: 10,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 22,
    fontFamily: Fonts.medium,
  },

  qrBox: {
    marginVertical: 28,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  booking: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Fonts.semiBold,
  },

  waiting: {
    marginTop: 14,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: Fonts.medium,
  },

  button: {
    marginTop: 28,
    width: '100%',
    backgroundColor: '#4757E7',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
