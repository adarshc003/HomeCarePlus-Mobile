import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const BookingTimeline = ({
  status,
}: {
  status: string;
}) => {
  const steps = [
    'pending',
    'assigned',
    'in_progress',
    'completed',
  ];

  const labels = {
    pending:
      'Booking Created',
    assigned:
      'Technician Assigned',
    in_progress:
      'Service Started',
    completed:
      'Service Completed',
  };

  const currentIndex =
    steps.indexOf(status);

  return (
    <View
      style={styles.container}>
      {steps.map(
        (
          step,
          index,
        ) => (
          <Text
            key={step}
            style={
              index <=
              currentIndex
                ? styles.completed
                : styles.pending
            }>
            {index <=
            currentIndex
              ? '✓ '
              : '○ '}
            {
              labels[
                step as keyof typeof labels
              ]
            }
          </Text>
        ),
      )}
    </View>
  );
};

export default BookingTimeline;

const styles =
  StyleSheet.create({
    container: {
      marginTop: 10,
    },
    completed: {
      color: 'green',
      marginBottom: 5,
      fontWeight: '600',
    },
    pending: {
      color: '#94A3B8',
      marginBottom: 5,
    },
  });