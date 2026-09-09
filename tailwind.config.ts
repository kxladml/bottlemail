import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        serif: ['"Times New Roman"', 'Times', 'Georgia', 'serif'],
        sans: ['Tahoma', 'Arial', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'retro-sm': '1px 1px 0px #000000',
        'retro': '2px 2px 0px #000000',
        'retro-lg': '4px 4px 0px #000000',
        'retro-pressed': 'inset 1px 1px 0px #000000',
      },
      colors: {
        paper: {
          white: '#ffffff',
          manila: '#fbf7ee',
          ruled: '#f6f9fc',
          yellow: '#fdfbf0',
          grid: '#f8f9fa',
          kraft: '#f3ece1',
          slate: '#18181b',
        }
      }
    },
  },
  plugins: [],
};

export default config;
