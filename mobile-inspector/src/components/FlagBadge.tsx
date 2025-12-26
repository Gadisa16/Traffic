import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { VehicleFlag } from '../types'

interface FlagBadgeProps {
  flag: VehicleFlag
}

export default function FlagBadge({ flag }: FlagBadgeProps) {
  const { theme, isDark } = useTheme()

  const getTypeColors = () => {
    switch (flag.type) {
      case 'danger':
        return {
          bg: isDark ? '#3a1a1a' : '#f8d7da',
          text: isDark ? '#e57373' : '#c0392b',
          icon: '⚠️',
        }
      case 'warning':
        return {
          bg: isDark ? '#3a2a1a' : '#fff3cd',
          text: isDark ? '#ffb74d' : '#f39c12',
          icon: '⚡',
        }
      case 'info':
      default:
        return {
          bg: isDark ? '#1a2a3a' : '#d1ecf1',
          text: isDark ? '#64b5f6' : '#0c5460',
          icon: 'ℹ️',
        }
    }
  }

  const colors = getTypeColors()

  return (
    <View
      style={[styles.container, { backgroundColor: colors.bg }]}
      accessibilityRole="alert"
      accessibilityLabel={`${flag.type} flag: ${flag.message}`}
    >
      <Text style={styles.icon}>{colors.icon}</Text>
      <View style={styles.content}>
        <Text style={[styles.code, { color: colors.text }]}>
          {flag.code?.toUpperCase()}
        </Text>
        <Text style={[styles.message, { color: theme.text }]}>
          {flag.message}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  code: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
})
