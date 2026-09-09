import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
  // Brand Backgrounds
  background: '#FAF7F3',
  backgroundCard: '#FFFFFF',
  backgroundSubtle: '#FAF6F0',
  backgroundHover: '#F5F2EC',
  backgroundSecondary: '#F1ECE5',
  
  // Brand Dark & Text
  dark: '#241E1A',
  textPrimary: '#241E1A',
  textSecondary: '#8A8177',
  textMuted: '#A0988E',
  
  // Brand Accent (Terracotta)
  primary: '#C2410C',
  primaryHover: '#A93A0C',
  primaryLight: '#FAF0E4',
  
  // Status Colors
  success: '#5B8C6E',
  successLight: '#E9F0EB',
  successText: '#3D6A50',
  
  warning: '#E4762B',
  warningLight: '#FAF0E4',
  warningText: '#8A5210',
  
  error: '#B3261E',
  errorLight: '#FDF2F2',
  errorText: '#8F1F19',
  
  // Borders
  border: '#E5E2DD',
  borderLight: '#F0EDE8',
  borderDark: '#D4CECA',
  
  // Clean Room / Priority Status
  priorityVip: '#8A5210',
  priorityVipBg: '#FAF0E4',
  statusDirty: '#8A8177',
  statusCleaning: '#E4762B',
  statusReady: '#5B8C6E',
  statusProblem: '#B3261E',
};

export const FONTS = {
  spectral500: Platform.select({
    ios: 'Spectral-Medium',
    android: 'Spectral_500Medium',
    web: 'Spectral, Georgia, serif',
    default: 'Spectral_500Medium',
  }),
  jost400: Platform.select({
    ios: 'Jost-Regular',
    android: 'Jost_400Regular',
    web: 'Jost, system-ui, sans-serif',
    default: 'Jost_400Regular',
  }),
  jost500: Platform.select({
    ios: 'Jost-Medium',
    android: 'Jost_500Medium',
    web: 'Jost, system-ui, sans-serif',
    default: 'Jost_500Medium',
  }),
  jost600: Platform.select({
    ios: 'Jost-SemiBold',
    android: 'Jost_600SemiBold',
    web: 'Jost, system-ui, sans-serif',
    default: 'Jost_500Medium',
  }),
};

export const COMMON_STYLES = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  headingSpectral: {
    fontFamily: FONTS.spectral500,
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  subheadingJost: {
    fontFamily: FONTS.jost400,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    fontFamily: FONTS.jost500,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: FONTS.jost500,
    fontSize: 14,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.jost500,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
