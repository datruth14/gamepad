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
                primary: {
                    DEFAULT: "#0a0a0a",
                    50: "#f5f5f5",
                    100: "#e5e5e5",
                    200: "#d4d4d4",
                    300: "#a3a3a3",
                    400: "#737373",
                    500: "#525252",
                    600: "#404040",
                    700: "#262626",
                    800: "#171717",
                    900: "#0a0a0a",
                },
                gold: {
                    DEFAULT: "#FFD700",
                    50: "#FFFDF0",
                    100: "#FFF9DB",
                    200: "#FFF3B8",
                    300: "#FFEC8A",
                    400: "#FFE55C",
                    500: "#FFD700",
                    600: "#D4B300",
                    700: "#A88F00",
                    800: "#7D6A00",
                    900: "#524600",
                },
                success: "#22c55e",
                danger: "#ef4444",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
            animation: {
                "spin-slow": "spin 3s linear infinite",
                "pulse-gold": "pulse-gold 2s ease-in-out infinite",
                "bounce-once": "bounce-once 0.5s ease-out",
            },
            keyframes: {
                "pulse-gold": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 215, 0, 0.7)" },
                    "50%": { boxShadow: "0 0 0 10px rgba(255, 215, 0, 0)" },
                },
                "bounce-once": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-gold": "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            },
        },
    },
    plugins: [],
};

export default config;
