import Config from 'react-native-config';

export const getAddressFromCoordinates =
  async (
    latitude: number,
    longitude: number,
  ) => {
    try {

      // Unlike the GPS fetch itself, this network call had no timeout at
      // all — a slow/hanging response left the address text stuck on raw
      // coordinates indefinitely with no error and no retry. Bounding it
      // means a slow geocode fails soft (same empty-string fallback below)
      // within a few seconds instead of potentially never resolving.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response =
        await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${Config.GOOGLE_MAPS_API_KEY}`,
          {signal: controller.signal},
        ).finally(() => clearTimeout(timeoutId));

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