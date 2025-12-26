import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../context/ThemeContext'

interface HeaderProps {
  title: string
  subtitle?: string
  leftAction?: {
    icon: string
    onPress: () => void
    accessibilityLabel?: string
  }
  rightAction?: {
    icon: string
    onPress: () => void
    accessibilityLabel?: string
  }
  style?: ViewStyle
}

export default function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
}: HeaderProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + 8,
          borderBottomColor: theme.border,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Left Action */}
        <View style={styles.action}>
          {leftAction && (
            <TouchableOpacity
              onPress={leftAction.onPress}
              style={[styles.actionButton, { backgroundColor: theme.surface }]}
              accessibilityRole="button"
              accessibilityLabel={leftAction.accessibilityLabel || 'Back'}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.actionIcon}>{leftAction.icon}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Action */}
        <View style={styles.action}>
          {rightAction && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={[styles.actionButton, { backgroundColor: theme.surface }]}
              accessibilityRole="button"
              accessibilityLabel={rightAction.accessibilityLabel || 'Action'}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.actionIcon}>{rightAction.icon}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
})
