import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native'
import { dark, getTheme, light, Theme } from '../theme'

const THEME_STORAGE_KEY = 'mobile_inspector_theme_preference'

type ThemePreference = 'system' | 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  colorScheme: ColorSchemeName
  themePreference: ThemePreference
  setThemePreference: (pref: ThemePreference) => Promise<void>
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: light,
  colorScheme: 'light',
  themePreference: 'system',
  setThemePreference: async () => {},
  isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme()
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (saved && ['system', 'light', 'dark'].includes(saved)) {
          setThemePreferenceState(saved as ThemePreference)
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoaded(true)
      }
    })()
  }, [])

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePreferenceState(pref)
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref)
    } catch (e) {
      // ignore
    }
  }

  // Determine actual color scheme
  const effectiveColorScheme: ColorSchemeName =
    themePreference === 'system'
      ? systemColorScheme || 'light'
      : themePreference

  const theme = getTheme(effectiveColorScheme)
  const isDark = effectiveColorScheme === 'dark'

  // Don't render until theme preference is loaded to prevent flash
  if (!isLoaded) {
    return null
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme: effectiveColorScheme,
        themePreference,
        setThemePreference,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
