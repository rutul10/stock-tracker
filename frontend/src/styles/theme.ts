export type ThemeName = 'dark' | 'light' | 'sand'

export const themes = {
  dark: {
    bg: '#0a0a0f',
    surface: '#111118',
    border: '#1e1e2e',
    accentGreen: '#00ff88',
    accentRed: '#ff3366',
    accentBlue: '#00aaff',
    textPrimary: '#e8e8f0',
    textMuted: '#6b6b8a',
    navAccent: '#00ff88',
  },
  light: {
    bg: '#f5f7fa',
    surface: '#ffffff',
    border: '#e2e6ed',
    accentGreen: '#16a34a',
    accentRed: '#dc2626',
    accentBlue: '#2563eb',
    textPrimary: '#111827',
    textMuted: '#6b7280',
    navAccent: '#16a34a',
  },
  sand: {
    bg: '#faf7f0',
    surface: '#f0ebe0',
    border: '#ddd5c4',
    accentGreen: '#16a34a',
    accentRed: '#dc2626',
    accentBlue: '#2563eb',
    textPrimary: '#1c1812',
    textMuted: '#8a7b68',
    navAccent: '#d97706',
  },
} as const satisfies Record<ThemeName, Record<string, string>>

export const theme = themes.dark
