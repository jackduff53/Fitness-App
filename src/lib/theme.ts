/**
 * Theme token constants for the Fitness & Nutrition PWA.
 * These mirror the custom colors defined in tailwind.config.ts
 * and can be used directly in components for inline styles,
 * SVG fills, or any context where Tailwind classes aren't practical.
 */

export const colors = {
  background: "#000000",
  card: "#111111",
  accent: "#FF6B00",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A8A8A",
} as const;

export type ThemeColor = keyof typeof colors;

/**
 * Tailwind class names corresponding to theme tokens.
 * Useful for programmatic class composition.
 */
export const tw = {
  bg: {
    background: "bg-background",
    card: "bg-card",
    accent: "bg-accent",
  },
  text: {
    primary: "text-text-primary",
    secondary: "text-text-secondary",
    accent: "text-accent",
  },
  border: {
    accent: "border-accent",
  },
} as const;
