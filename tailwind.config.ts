import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      colors: { primary: "#22c55e" },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
    },
  },
  // daisyui: {
  //   themes: [
  //     {
  //       mytheme: {
  //         primary: "#22c55e",

  //         secondary: "#ff00d3",

  //         accent: "#4a00ff",

  //         neutral: "#2b3440",

  //         "base-100": "#ffffff",

  //         info: "#00b5ff",

  //         success: "#9affdc",

  //         warning: "#ffbe00",

  //         error: "#ff5861",
  //       },
  //     },
  //   ],
  // },
  plugins: [require("daisyui")],
} satisfies Config;
