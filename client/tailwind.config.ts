import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
            transform: 'scale(1)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)',
            transform: 'scale(1.05)' 
          },
        },
      },
    },
  },
  plugins: [
    // Custom scrollbar plugin
    function({ addUtilities }: any) {
      const scrollbarUtilities = {
        '.scrollbar-thin': {
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgb(75 85 99)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgb(107 114 128)',
          },
        },
        '.scrollbar-thumb-slate-600': {
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgb(71 85 105)',
          },
        },
        '.scrollbar-track-slate-800': {
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgb(30 41 59)',
          },
        },
      }
      addUtilities(scrollbarUtilities)
    }
  ],
};

export default config; 
