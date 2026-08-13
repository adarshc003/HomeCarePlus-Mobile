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

  // Distinguishes "the request failed" from "the list is genuinely empty" —
  // without this, CategorySection had no way to tell the two apart and
  // silently rendered as if there were simply no categories.
  error: boolean;

  loadCategories:
    () => Promise<void>;
}

export const
  useCategoryStore =
    create<CategoryState>(
      set => ({
        categories: [],

        loading: false,

        error: false,

        loadCategories:
          async () => {
            try {
              set({
                loading: true,
                error: false,
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

              set({
                error: true,
              });
            } finally {
              set({
                loading: false,
              });
            }
          },
      }),
    );