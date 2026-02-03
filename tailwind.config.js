/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                'xs': '375px',
            },
            colors: {
                background: '#020617', // Slate 950 base
                surface: '#0f172a', // Slate 900
                electric: {
                    400: '#22d3ee', // Cyan
                    500: '#06b6d4',
                    DEFAULT: '#00f2ea', // Electric Cyan
                },
                neon: {
                    400: '#e879f9',
                    500: '#d946ef',
                    DEFAULT: '#ff00ff', // Neon Purple
                },
                acid: {
                    400: '#a3e635',
                    500: '#84cc16',
                    DEFAULT: '#ccff00', // Acid Green
                },
                accent: {
                    primary: 'var(--accent-primary)',
                    secondary: 'var(--accent-secondary)',
                }
            },
            animation: {
                'enter': 'enter 0.4s ease-out forwards',
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'slide-down': 'slideDown 0.3s ease-out forwards',
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
            },
            keyframes: {
                shake: {
                    '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
                },
                enter: {
                    '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(0, 242, 234, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(0, 242, 234, 0.6), 0 0 10px rgba(255, 0, 255, 0.4)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                }
            }
        },
    },
    plugins: [],
}
