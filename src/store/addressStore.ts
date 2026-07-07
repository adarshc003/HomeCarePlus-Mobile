import {create} from 'zustand';

import {getAddresses} from '../services/addressService';

interface AddressState {
  addresses: any[];

  loading: boolean;

  loadAddresses: () => Promise<void>;
}

export const useAddressStore =
  create<AddressState>(set => ({

    addresses: [],

    loading: false,

    loadAddresses: async () => {

      try {

        set({
          loading: true,
        });

        const response =
          await getAddresses();

        set({
          addresses:
            response.data || [],
        });

      } catch (error) {

        console.log(error);

      } finally {

        set({
          loading: false,
        });

      }

    },

  }));