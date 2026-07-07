import Config from 'react-native-config';

export const getAddressFromCoordinates =
  async (
    latitude: number,
    longitude: number,
  ) => {
    try {

      const response =
        await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${Config.GOOGLE_MAPS_API_KEY}`,
        );

      const data =
        await response.json();

      if (
        data.results &&
        data.results.length > 0
      ) {
        return data.results[0]
          .formatted_address;
      }

      return '';
    } catch (error) {

      return '';
    }
  };