import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';


const getCurrentIndex = (
  status: string,
) => {

  switch (status) {

    case 'pending':
    // Still awaiting technician acceptance — same timeline position as
    // 'pending', not yet 'assigned'. Handled explicitly (not via the
    // default branch) so it can't silently fall out of sync if more
    // statuses are added later.
    case 'pending_assignment':
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

  const {colors} = useTheme();
  const styles = createStyles(colors);

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
                        ? colors.success
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
                                ? colors.success
                                : colors.border,
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

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
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
      color: colors.textSecondary,
      fontFamily:
        Fonts.medium,
      fontSize: 15,
    },

    doneText: {
      color: colors.textPrimary,
      fontFamily:
        Fonts.semiBold,
    },

  });