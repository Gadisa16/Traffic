import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { useTheme } from '../context/ThemeContext'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'elevated' | 'outlined'
}

export default function Card({ children, style, variant = 'default' }: CardProps) {
  const { theme, isDark } = useTheme()

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          shadowColor: theme.cardShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.5 : 0.15,
          shadowRadius: 8,
          elevation: 4,
        }
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: theme.border,
        }
      default:
        return {}
    }
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
        },
        getVariantStyles(),
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
})
