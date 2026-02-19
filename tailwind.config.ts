import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      '#F8F7F5',
          white:   '#FFFFFF',
          border:  '#E8E5E0',
          borderL: '#F0EDE8',
          text:    '#1C1917',
          muted:   '#78716C',
          dim:     '#A8A29E',
          accent:  '#2563EB',
          accentL: '#EFF6FF',
          green:   '#16A34A',
          greenL:  '#DCFCE7',
          amber:   '#D97706',
          amberL:  '#FEF3C7',
          red:     '#DC2626',
          redL:    '#FEE2E2',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
