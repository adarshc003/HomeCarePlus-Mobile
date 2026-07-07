import {create}
from 'zustand';

import {getCategories}
from '../services/categoryService';

interface Category {

  id: string;

  code: string;

  name: {

    en: string;

    ar: string;

  };

  icon: string;

}

interface CategoryState {
  categories:
    Category[];

  loading: boolean;

  loadCategories:
    () => Promise<void>;
}

export const
  useCategoryStore =
    create<CategoryState>(
      set => ({
        categories: [],

        loading: false,

        loadCategories:
          async () => {
            try {
              set({
                loading: true,
              });

              const data =
                await getCategories();

              set({
                categories:
                  data.categories ||
                  [],
              });
            } catch (
              error
            ) {
              console.log(
                error,
              );
            } finally {
              set({
                loading: false,
              });
            }
          },
      }),
    );