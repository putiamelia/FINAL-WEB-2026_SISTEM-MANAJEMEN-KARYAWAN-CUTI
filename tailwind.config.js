/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B2545',
          700: '#13315C',
          600: '#17386B',
        },
        gold: {
          500: '#C8A24A',
          300: '#E3C06D',
        },
        page: '#F1F3F6',
        cream: '#FBFAF7',
        surface: '#FFFFFF',
        tableHead: '#EEF1F5',
        borderSoft: '#E6EAF0',
        borderCard: '#D9DEE5',
        textMain: '#1B2430',
        textMuted: '#4A5565',
        textBody: '#334155',
        sidebarMuted: '#C9D3E3',
        sidebarLabel: '#9FB0CC',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
        ctl: '4px',
      },
    },
  },
  plugins: [],
};
