export interface Service {
  id: string;

  category: {
    id: string;

    code: string;

    name: {
      en: string;
      ar: string;
    };

    icon: string;
  };

  name: {
    en: string;
    ar: string;
  };

  description: {
    en: string;
    ar: string;
  };

  image: string;

  startingPrice: number;

  sortOrder: number;

  isActive: boolean;
}