import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const spacing = {
  "0": "var(--spacing-0)",
  "025": "var(--spacing-025)",
  "050": "var(--spacing-050)",
  "075": "var(--spacing-075)",
  "100": "var(--spacing-100)",
  "125": "var(--spacing-125)",
  "150": "var(--spacing-150)",
  "200": "var(--spacing-200)",
  "250": "var(--spacing-250)",
  "300": "var(--spacing-300)",
  "400": "var(--spacing-400)",
  "500": "var(--spacing-500)",
  "600": "var(--spacing-600)",
  "800": "var(--spacing-800)",
  "1000": "var(--spacing-1000)",
  "1200": "var(--spacing-1200)",
  "1400": "var(--spacing-1400)",
  "1600": "var(--spacing-1600)",
  "1800": "var(--spacing-1800)",
} as const;

type TextPreset = [
  string,
  {
    lineHeight: string;
    letterSpacing: string;
    fontWeight: string;
  },
];

const textPreset = (name: string): TextPreset => [
  `var(--text-${name}-font-size)`,
  {
    lineHeight: `var(--text-${name}-line-height)`,
    letterSpacing: `var(--text-${name}-letter-spacing)`,
    fontWeight: `var(--text-${name}-font-weight)`,
  },
];

const fontSize = {
  "preset-1": textPreset("preset-1"),
  "preset-1-tablet": textPreset("preset-1-tablet"),
  "preset-2": textPreset("preset-2"),
  "preset-2-bold": textPreset("preset-2-bold"),
  "preset-3": textPreset("preset-3"),
  "preset-3-medium": textPreset("preset-3-medium"),
  "preset-3-bold": textPreset("preset-3-bold"),
  "preset-4": textPreset("preset-4"),
  "preset-5": textPreset("preset-5"),
  "preset-5-medium": textPreset("preset-5-medium"),
  "preset-6": textPreset("preset-6"),
};

const hsl = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const colors = {
  transparent: "transparent",
  current: "currentColor",
  neutral: {
    "50": hsl("neutral-50"),
    "100": hsl("neutral-100"),
    "200": hsl("neutral-200"),
    "300": hsl("neutral-300"),
    "400": hsl("neutral-400"),
    "500": hsl("neutral-500"),
    "600": hsl("neutral-600"),
    "700": hsl("neutral-700"),
    "900": hsl("neutral-900"),
  },
  lime: {
    "500": hsl("lime-500"),
    "800": hsl("lime-800"),
  },
  green: {
    "500": hsl("green-500"),
  },
  red: {
    "500": hsl("red-500"),
  },
  background: hsl("background"),
  foreground: hsl("foreground"),
  card: {
    DEFAULT: hsl("card"),
    foreground: hsl("card-foreground"),
  },
  popover: {
    DEFAULT: hsl("popover"),
    foreground: hsl("popover-foreground"),
  },
  primary: {
    DEFAULT: hsl("primary"),
    foreground: hsl("primary-foreground"),
  },
  secondary: {
    DEFAULT: hsl("secondary"),
    foreground: hsl("secondary-foreground"),
  },
  muted: {
    DEFAULT: hsl("muted"),
    foreground: hsl("muted-foreground"),
  },
  accent: {
    DEFAULT: hsl("accent"),
    foreground: hsl("accent-foreground"),
  },
  destructive: {
    DEFAULT: hsl("destructive"),
    foreground: hsl("destructive-foreground"),
  },
  border: hsl("border"),
  input: hsl("input"),
  ring: hsl("ring"),
  chart: {
    "1": hsl("chart-1"),
    "2": hsl("chart-2"),
    "3": hsl("chart-3"),
    "4": hsl("chart-4"),
    "5": hsl("chart-5"),
  },
} as const;

const borderRadius = {
  "0": "var(--radius-0)",
  "4": "var(--radius-4)",
  "6": "var(--radius-6)",
  "8": "var(--radius-8)",
  "10": "var(--radius-10)",
  "12": "var(--radius-12)",
  "16": "var(--radius-16)",
  "20": "var(--radius-20)",
  "24": "var(--radius-24)",
  full: "var(--radius-full)",
} as const;

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./stories/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    spacing,
    fontSize,
    colors,
    borderRadius,
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
