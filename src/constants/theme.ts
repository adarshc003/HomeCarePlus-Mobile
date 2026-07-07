export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  card: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textHint: string;
  border: string;
  divider: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  statusBarStyle: 'dark-content' | 'light-content';
}

// Current, final Light Theme — values kept exactly as already used
// throughout the app (unchanged by the theme system).
export const LIGHT_COLORS: ThemeColors = {
  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textHint: '#94A3B8',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  primary: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  statusBarStyle: 'dark-content',
};

export const DARK_COLORS: ThemeColors = {
  background: '#0F172A',
  backgroundSecondary: '#111827',
  card: '#1E293B',
  surface: '#1F2937',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textHint: '#94A3B8',
  border: '#334155',
  divider: '#475569',
  primary: '#2563EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  statusBarStyle: 'light-content',
};
