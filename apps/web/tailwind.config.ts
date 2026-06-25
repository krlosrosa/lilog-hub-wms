import type { Config } from 'tailwindcss';

import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: [
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
        'glass-bg': 'var(--glass-bg)',
        'status-active': 'hsl(var(--status-active))',
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
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        inter: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': [
          '48px',
          {
            lineHeight: '56px',
            letterSpacing: '-0.02em',
            fontWeight: '600',
          },
        ],
        'headline-lg': [
          '32px',
          {
            lineHeight: '40px',
            letterSpacing: '-0.02em',
            fontWeight: '600',
          },
        ],
        'headline-lg-mobile': [
          '28px',
          {
            lineHeight: '36px',
            letterSpacing: '-0.02em',
            fontWeight: '600',
          },
        ],
        'headline-md': [
          '24px',
          {
            lineHeight: '32px',
            letterSpacing: '-0.01em',
            fontWeight: '500',
          },
        ],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': [
          '14px',
          {
            lineHeight: '20px',
            letterSpacing: '0.01em',
            fontWeight: '500',
          },
        ],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      maxWidth: {
        container: '1280px',
      },
      spacing: {
        gutter: '24px',
        sidebar: '220px',
        'margin-desktop': '48px',
        'margin-mobile': '16px',
      },
      backdropBlur: {
        glass: '12px',
      },
      boxShadow: {
        'inner-glow': 'inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
