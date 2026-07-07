import {useCategoryStore} from '../store/categoryStore';
import {useServiceStore} from '../store/serviceStore';
import {startBackgroundLoading} from './backgroundLoader';

export const initializeApp = async () => {
  try {

    await Promise.all([
      useCategoryStore.getState().loadCategories(),
      useServiceStore.getState().loadServices(),
    ]);

    await startBackgroundLoading();

  } catch (error) {
    console.log('App Init Error:', error);
  }
};