import type { Config } from 'tailwindcss';

import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          container: 'hsl(var(--primary-container))',
          'on-container': 'hsl(var(--on-primary-container))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          container: 'hsl(var(--secondary-container))',
          'on-container': 'hsl(var(--on-secondary-container))',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--on-tertiary))',
          container: 'hsl(var(--tertiary-container))',
          'on-container': 'hsl(var(--on-tertiary-container))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        surface: {
          lowest: 'hsl(var(--surface-lowest))',
          low: 'hsl(var(--surface-low))',
          DEFAULT: 'hsl(var(--surface))',
          high: 'hsl(var(--surface-high))',
          highest: 'hsl(var(--surface-highest))',
          bright: 'hsl(var(--surface-bright))',
          tint: 'hsl(var(--surface-tint))',
        },
        outline: {
          DEFAULT: 'hsl(var(--outline))',
          variant: 'hsl(var(--outline-variant))',
        },
        inverse: {
          primary: 'hsl(var(--inverse-primary))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          container: 'hsl(var(--warning-container))',
          'on-container': 'hsl(var(--on-warning-container))',
        },
        'on-surface': 'hsl(var(--on-surface))',
        'on-surface-variant': 'hsl(var(--on-surface-variant))',
        'on-background': 'hsl(var(--on-background))',
        'on-primary-container': 'hsl(var(--on-primary-container))',
        'on-secondary': 'hsl(var(--secondary-foreground))',
        'on-secondary-container': 'hsl(var(--on-secondary-container))',
        'on-tertiary-container': 'hsl(var(--on-tertiary-container))',
        'error-container': 'hsl(var(--error-container))',
        'on-error-container': 'hsl(var(--on-error-container))',
        'surface-container': {
          DEFAULT: 'hsl(var(--surface-container))',
          low: 'hsl(var(--surface-container-low))',
          lowest: 'hsl(var(--surface-container-lowest))',
          high: 'hsl(var(--surface-container-high))',
          highest: 'hsl(var(--surface-container-highest))',
        },
        'surface-variant': 'hsl(var(--surface-variant))',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'data-mono': [
          '14px',
          { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '500' },
        ],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label-md': [
          '14px',
          { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' },
        ],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-lg': [
          '28px',
          { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' },
        ],
        'headline-lg-mobile': [
          '24px',
          { lineHeight: '32px', fontWeight: '600' },
        ],
        'headline-xl': [
          '36px',
          { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' },
        ],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
      },
      maxWidth: {
        'max-width': '1440px',
      },
      spacing: {
        gutter: '16px',
        'margin-mobile': '16px',
        'margin-desktop': '32px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
