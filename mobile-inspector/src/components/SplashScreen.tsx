import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'

interface SplashScreenProps {
  message?: string
}

export default function SplashScreen({ message = 'Loading...' }: SplashScreenProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.logoCircle, { backgroundColor: theme.accent }]}>
        <Text style={styles.logoText}>🚕</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Vehicle Inspector</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Sidama Region • Hawassa
      </Text>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>
          {message}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
})
