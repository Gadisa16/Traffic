import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import { useTheme } from '../context/ThemeContext'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  style?: ViewStyle
  accessibilityLabel?: string
  accessibilityHint?: string
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const { theme, isDark } = useTheme()

  const sizeStyles = {
    small: { paddingH: 12, paddingV: 8, fontSize: 14, minHeight: 36 },
    medium: { paddingH: 20, paddingV: 14, fontSize: 16, minHeight: 48 },
    large: { paddingH: 28, paddingV: 18, fontSize: 18, minHeight: 56 },
  }

  const s = sizeStyles[size]

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.accent,
          text: isDark ? '#0a1628' : '#ffffff',
          border: theme.accent,
        }
      case 'secondary':
        return {
          bg: theme.surfaceSecondary,
          text: theme.text,
          border: theme.border,
        }
      case 'danger':
        return {
          bg: theme.error,
          text: '#ffffff',
          border: theme.error,
        }
      case 'outline':
        return {
          bg: 'transparent',
          text: theme.accent,
          border: theme.accent,
        }
      case 'ghost':
        return {
          bg: 'transparent',
          text: theme.accent,
          border: 'transparent',
        }
      default:
        return {
          bg: theme.accent,
          text: '#ffffff',
          border: theme.accent,
        }
    }
  }

  const variantStyles = getVariantStyles()

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? theme.surfaceSecondary : variantStyles.bg,
          borderColor: disabled ? theme.border : variantStyles.border,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          minHeight: s.minHeight,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: disabled ? theme.textMuted : variantStyles.text,
                fontSize: s.fontSize,
              },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
})
