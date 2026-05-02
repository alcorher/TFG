/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// constants/theme.js

export const COLORS = {
  // Paleta Oficial LebriJaleo
  lemonIcing: '#F6EBC8',
  cloudDancer: '#f0eee9', // bg-background
  midnightBlue: '#0f172a', // text-foreground (usando el @theme principal)
  nimbusCloud: '#D5D5D8',
  formBg: '#F0EEE9',
  
  // Variantes y acentos (Shadcn y utilities)
  lemonIcingAccent: '#C1A866', // ring
  lemonIcingDark: '#A38C52',
  borderDark: '#DBCDA3', // borde de shadcn
  midnightBlueDark: '#221610', // foreground de shadcn
  
  // Neutros y estados (para replicar clases de Tailwind base)
  white: '#ffffff',
  slate100: '#f1f5f9',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  red500: '#ef4444', // destructive aproximado
  
  // Transparencias (útiles para modales)
  overlay: 'rgba(15, 23, 42, 0.5)', // midnightBlue con 50% de opacidad
};

export const Colors = {
  light: {
    text: COLORS.midnightBlue,
    background: COLORS.cloudDancer,
    tint: COLORS.lemonIcingAccent,
    icon: COLORS.slate500,
    tabIconDefault: COLORS.slate400,
    tabIconSelected: COLORS.midnightBlue,
  },
  dark: {
    text: COLORS.white,
    background: COLORS.midnightBlue,
    tint: COLORS.lemonIcing,
    icon: COLORS.nimbusCloud,
    tabIconDefault: COLORS.slate400,
    tabIconSelected: COLORS.lemonIcing,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
