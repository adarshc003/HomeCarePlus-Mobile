import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import {Fonts} from '../../constants/fonts';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';


const getCurrentIndex = (
  status: string,
) => {

  switch (status) {

    case 'pending':
      return 0;

    case 'accepted':
    case 'assigned':
      return 1;

    case 'travelling':
    case 'on_the_way':
      return 2;

    case 'arrived':
    case 'started':
    case 'in_progress':
      return 3;

    case 'completed':
      return 4;

    default:
      return 0;

  }

};

const BookingTimeline = ({
  status,
}: {
  status: string;
}) => {

  const language = useLanguageStore(
    state => state.language,
  );

  const steps = [

    {
      key: 'pending',
      title: t(
        'timelineBookingConfirmed',
        language,
      ),
    },

    {
      key: 'assigned',
      title: t(
        'timelinePartnerAssigned',
        language,
      ),
    },

    {
      key: 'travelling',
      title: t(
        'timelineTechnicianOnTheWay',
        language,
      ),
    },

    {
      key: 'started',
      title: t(
        'timelineServiceInProgress',
        language,
      ),
    },

    {
      key: 'completed',
      title: t(
        'timelineCompleted',
        language,
      ),
    },

  ];

  const current =
    getCurrentIndex(status);

  return (

    <View>

      {

        steps.map(
          (
            step,
            index,
          ) => {

            const done =
              index <= current;

            return (

              <View
                key={step.key}
                style={
                  styles.row
                }>

                <View
                  style={
                    styles.iconContainer
                  }>

                  <Ionicons
                    name={
                      done
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={24}
                    color={
                      done
                        ? '#22C55E'
                        : '#CBD5E1'
                    }
                  />

                  {

                    index !==
                      steps.length -
                        1 && (

                      <View
                        style={[
                          styles.line,
                          {
                            backgroundColor:
                              done
                                ? '#22C55E'
                                : '#E2E8F0',
                          },
                        ]}
                      />

                    )

                  }

                </View>

                <Text
                  style={[
                    styles.text,
                    done &&
                      styles.doneText,
                  ]}>
                  {step.title}
                </Text>

              </View>

            );

          },
        )

      }

    </View>

  );

};

export default BookingTimeline;

const styles =
  StyleSheet.create({

    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 18,
    },

    iconContainer: {
      alignItems: 'center',
      width: 28,
    },

    line: {
      width: 2,
      height: 32,
      marginTop: 2,
    },

    text: {
      marginLeft: 14,
      marginTop: 2,
      color: '#64748B',
      fontFamily:
        Fonts.medium,
      fontSize: 15,
    },

    doneText: {
      color: '#0F172A',
      fontFamily:
        Fonts.semiBold,
    },

  });