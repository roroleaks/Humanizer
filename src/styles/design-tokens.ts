/**
 * Scientific Humanizer Design Tokens
 * 
 * Strict academic and clinical visual language tokens.
 * Emphasizes clinical precision, deep navy architectural surfaces,
 * subtle teal interactive accents, and restrained status indicators.
 */

export const DESIGN_TOKENS = {
  colors: {
    // Primary architectural surfaces & chrome
    brand: {
      navyDark: '#061323',
      navyPrimary: '#0B2545',
      navyLight: '#133966',
      navySubtle: '#1C4F8B',
    },
    // Interactive & highlight accents
    accent: {
      tealPrimary: '#13818B',
      tealHover: '#0E636A',
      tealLight: '#E6F4F5',
      tealMuted: '#58A3AA',
    },
    // Clinical content backgrounds & surfaces
    surface: {
      pureWhite: '#FFFFFF',
      clinicalBackdrop: '#F8FAFC',
      cardBackground: '#FFFFFF',
      borderSubtle: '#E2E8F0',
      borderDefault: '#CBD5E1',
      borderActive: '#94A3B8',
    },
    // Scientific Integrity status colors
    integrity: {
      pass: '#2E7D32',       // Restrained green for verified consistency
      passBackground: '#E8F5E9',
      passBorder: '#A5D6A7',
      warning: '#ED6C02',    // Rigorous amber for items needing review
      warningBackground: '#FFF4E5',
      warningBorder: '#FFCC80',
      fail: '#D32F2F',       // Explicit red for detected discrepancies/unsupported changes
      failBackground: '#FFEBEE',
      failBorder: '#EF9A9A',
    },
    // Typography & neutral hierarchy
    neutral: {
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#6B7280',
      textDisabled: '#94A3B8',
    },
  },

  typography: {
    fonts: {
      body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "SF Mono", Consolas, Menlo, Courier, monospace',
    },
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.65',
      loose: '1.8',
    },
    fontWeights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },

  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },

  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },

  transitions: {
    default: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
