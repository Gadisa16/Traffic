import { Appearance, ColorSchemeName } from 'react-native'

// Ethiopian-inspired color palette
// Dark theme: dark-blue tones inspired by Ethiopian night sky and Hawassa lake
// Accent colors: deep green (Ethiopian coffee) and gold (Ethiopian royalty)

export const colors = {
  // Status colors - used for vehicle verification
  valid: '#1f7a3a', // Deep green - valid/ok
  validLight: '#d4edda',
  expiringSoon: '#e67e22', // Ethiopian amber/gold
  expiringSoonLight: '#fef3e2',
  expired: '#c0392b', // Deep red
  expiredLight: '#f8d7da',
  warning: '#f39c12', // Gold warning
  warningLight: '#fff3cd',
  
  // Ethiopian-inspired accents
  ethiopianGold: '#f2c94c',
  ethiopianGreen: '#1f7a3a',
  hawassaBlue: '#1a3a5c',
  sidamaEarth: '#8b5a2b',
}

export const light = {
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceSecondary: '#f0f2f5',
  text: '#0b2545',
  textSecondary: '#4a5568',
  textMuted: '#718096',
  accent: colors.ethiopianGreen,
  accentSecondary: colors.ethiopianGold,
  border: '#e2e8f0',
  borderLight: '#edf2f7',
  card: '#ffffff',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  error: colors.expired,
  success: colors.valid,
  ...colors,
}

export const dark = {
  background: '#0a1628', // Deep dark blue
  surface: '#132238', // Slightly lighter blue
  surfaceSecondary: '#1a3050',
  text: '#e6eef8',
  textSecondary: '#a0aec0',
  textMuted: '#718096',
  accent: colors.ethiopianGold,
  accentSecondary: colors.ethiopianGreen,
  border: '#2d3748',
  borderLight: '#1e2d40',
  card: '#162540',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  error: '#e57373',
  success: '#81c784',
  ...colors,
}

export type Theme = typeof light

export function getTheme(colorScheme: ColorSchemeName): Theme {
  return colorScheme === 'dark' ? dark : light
}

export function getSystemColorScheme(): ColorSchemeName {
  return Appearance.getColorScheme()
}

// Helper to get status color based on vehicle status
export function getStatusColor(status: string, theme: Theme): { bg: string; text: string } {
  const statusLower = status?.toLowerCase() || ''
  
  if (statusLower.includes('valid') && !statusLower.includes('expir')) {
    return { bg: theme === dark ? '#1a3a2a' : colors.validLight, text: colors.valid }
  }
  if (statusLower.includes('expiring') || statusLower.includes('soon')) {
    return { bg: theme === dark ? '#3a2a1a' : colors.expiringSoonLight, text: colors.expiringSoon }
  }
  if (statusLower.includes('expired') || statusLower.includes('invalid')) {
    return { bg: theme === dark ? '#3a1a1a' : colors.expiredLight, text: colors.expired }
  }
  if (statusLower.includes('suspend') || statusLower.includes('stolen') || statusLower.includes('flag')) {
    return { bg: theme === dark ? '#3a1a1a' : colors.warningLight, text: colors.warning }
  }
  
  return { bg: theme.surfaceSecondary, text: theme.text }
}

// Calculate days remaining until expiry
export function getDaysRemaining(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null
  
  try {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

// Format days remaining into readable string
export function formatDaysRemaining(days: number | null): string {
  if (days === null) return 'Unknown'
  if (days < 0) return `Expired ${Math.abs(days)} days ago`
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `${days} days remaining`
}
