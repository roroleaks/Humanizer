import type { Config } from 'tailwindcss';
import { DESIGN_TOKENS } from './src/styles/design-tokens';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navyDark: DESIGN_TOKENS.colors.brand.navyDark,
          navyPrimary: DESIGN_TOKENS.colors.brand.navyPrimary,
          navyLight: DESIGN_TOKENS.colors.brand.navyLight,
          navySubtle: DESIGN_TOKENS.colors.brand.navySubtle,
        },
        navy: {
          900: DESIGN_TOKENS.colors.brand.navyDark,
          800: DESIGN_TOKENS.colors.brand.navyPrimary,
          700: DESIGN_TOKENS.colors.brand.navyLight,
          600: DESIGN_TOKENS.colors.brand.navySubtle,
        },
        accent: {
          tealPrimary: DESIGN_TOKENS.colors.accent.tealPrimary,
          tealHover: DESIGN_TOKENS.colors.accent.tealHover,
          tealLight: DESIGN_TOKENS.colors.accent.tealLight,
          tealMuted: DESIGN_TOKENS.colors.accent.tealMuted,
        },
        teal: {
          accent: DESIGN_TOKENS.colors.accent.tealPrimary,
          hover: DESIGN_TOKENS.colors.accent.tealHover,
          light: DESIGN_TOKENS.colors.accent.tealLight,
          muted: DESIGN_TOKENS.colors.accent.tealMuted,
        },
        surface: {
          pureWhite: DESIGN_TOKENS.colors.surface.pureWhite,
          clinicalBackdrop: DESIGN_TOKENS.colors.surface.clinicalBackdrop,
          cardBackground: DESIGN_TOKENS.colors.surface.cardBackground,
          borderSubtle: DESIGN_TOKENS.colors.surface.borderSubtle,
          borderDefault: DESIGN_TOKENS.colors.surface.borderDefault,
          borderActive: DESIGN_TOKENS.colors.surface.borderActive,
        },
        clinical: {
          white: DESIGN_TOKENS.colors.surface.pureWhite,
          surface: DESIGN_TOKENS.colors.surface.clinicalBackdrop,
          card: DESIGN_TOKENS.colors.surface.cardBackground,
          border: DESIGN_TOKENS.colors.surface.borderSubtle,
        },
        integrity: {
          pass: DESIGN_TOKENS.colors.integrity.pass,
          passBackground: DESIGN_TOKENS.colors.integrity.passBackground,
          passBorder: DESIGN_TOKENS.colors.integrity.passBorder,
          warning: DESIGN_TOKENS.colors.integrity.warning,
          warningBackground: DESIGN_TOKENS.colors.integrity.warningBackground,
          warningBorder: DESIGN_TOKENS.colors.integrity.warningBorder,
          fail: DESIGN_TOKENS.colors.integrity.fail,
          failBackground: DESIGN_TOKENS.colors.integrity.failBackground,
          failBorder: DESIGN_TOKENS.colors.integrity.failBorder,
        },
        scientific: {
          pass: DESIGN_TOKENS.colors.integrity.pass,
          passLight: DESIGN_TOKENS.colors.integrity.passBackground,
          warning: DESIGN_TOKENS.colors.integrity.warning,
          warningLight: DESIGN_TOKENS.colors.integrity.warningBackground,
          fail: DESIGN_TOKENS.colors.integrity.fail,
          failLight: DESIGN_TOKENS.colors.integrity.failBackground,
        },
        neutral: {
          textPrimary: DESIGN_TOKENS.colors.neutral.textPrimary,
          textSecondary: DESIGN_TOKENS.colors.neutral.textSecondary,
          gray: DESIGN_TOKENS.colors.neutral.textMuted,
          muted: DESIGN_TOKENS.colors.neutral.textMuted,
          disabled: DESIGN_TOKENS.colors.neutral.textDisabled,
        },
      },
      fontFamily: {
        sans: ['Inter', 'Source Sans 3', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      boxShadow: {
        subtle: DESIGN_TOKENS.shadows.subtle,
        card: DESIGN_TOKENS.shadows.card,
        elevated: DESIGN_TOKENS.shadows.elevated,
        modal: DESIGN_TOKENS.shadows.modal,
      },
      borderRadius: {
        sm: DESIGN_TOKENS.borderRadius.sm,
        md: DESIGN_TOKENS.borderRadius.md,
        lg: DESIGN_TOKENS.borderRadius.lg,
        xl: DESIGN_TOKENS.borderRadius.xl,
        full: DESIGN_TOKENS.borderRadius.full,
      },
    },
  },
  plugins: [],
};

export default config;
