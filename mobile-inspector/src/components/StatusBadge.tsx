import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { getStatusColor } from '../theme'

interface StatusBadgeProps {
  status: string
  size?: 'small' | 'medium' | 'large'
}

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const { theme, isDark } = useTheme()
  const statusColors = getStatusColor(status, theme)
  
  const sizeStyles = {
    small: { paddingH: 8, paddingV: 4, fontSize: 12 },
    medium: { paddingH: 12, paddingV: 6, fontSize: 14 },
    large: { paddingH: 16, paddingV: 10, fontSize: 18 },
  }
  
  const s = sizeStyles[size]
  
  // Format status for display
  const displayStatus = status
    ?.replace(/_/g, ' ')
    ?.replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusColors.bg,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${displayStatus}`}
    >
      <View style={[styles.dot, { backgroundColor: statusColors.text }]} />
      <Text
        style={[
          styles.text,
          {
            color: statusColors.text,
            fontSize: s.fontSize,
            fontWeight: size === 'large' ? '700' : '600',
          },
        ]}
      >
        {displayStatus}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  text: {
    letterSpacing: 0.3,
  },
})
