import NetInfo from '@react-native-community/netinfo'
import { createNavigationContainerRef, DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import { Alert, AppState, AppStateStatus, StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import * as Api from './lib/api'
import * as Offline from './lib/offline'
import * as Storage from './lib/storage'
import DashboardScreen from './screens/DashboardScreen'
import InspectorVerificationScreen from './screens/InspectorVerificationScreen'
import LoginScreen from './screens/LoginScreen'
import RecentScansScreen from './screens/RecentScansScreen'
import RegisterScreen from './screens/RegisterScreen'
import ScannerScreen from './screens/ScannerScreen'
import SettingsScreen from './screens/SettingsScreen'
import VerifyScreen from './screens/VerifyScreen'

import type { RootStackParamList as RootStackParamListBase } from './types'

export type RootStackParamList = RootStackParamListBase

const Stack = createNativeStackNavigator<RootStackParamList>()

function AppNavigator() {
  const [isReady, setIsReady] = useState(false)
  const { theme, isDark } = useTheme()

  const navigationRef = createNavigationContainerRef<RootStackParamList>()

  // Custom navigation theme based on our theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.accent,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.accent,
    },
  }

  useEffect(() => {
    ; (async () => {
      setIsReady(true)
    })()

    // register session-expired handler
    Api.setOnSessionExpired(async () => {
      try { await Storage.clearToken() } catch (e) { }
      try {
        Alert.alert('Session expired', 'Please sign in again')
      } catch (e) { }
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Dashboard' }] })
      }
    })

      // initial sync when app opens
      ; (async () => { try { await Offline.syncQueue() } catch (e) { /**/ } })()
    const unsub = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        try {
          const res: any = await Offline.syncQueue()
          if (res && res.ok) {
            // notify user when sync finishes
            if (res.results && res.results.length > 0) {
              const succeeded = res.results.filter((r: any) => r.ok).length
              const failed = res.results.length - succeeded
              if (succeeded > 0 || failed > 0) {
                Alert.alert('Sync Complete', `Uploaded ${succeeded} scans${failed > 0 ? `, ${failed} failed` : ''}`)
              }
            }
          }
        } catch (e) {
          console.warn('Sync failed', e)
        }
      }
    })
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        ; (async () => { try { await Offline.syncQueue() } catch (e) { /* ignore */ } })()
      }
    }
    const sub = AppState.addEventListener('change', onAppState)
    return () => {
      unsub()
      try { sub.remove() } catch (e) { /* old RN versions */ }
      Api.setOnSessionExpired(null)
    }
  }, [])

  if (!isReady) {
    return null
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator
          initialRouteName={'Dashboard'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="Verify" component={VerifyScreen} />
          <Stack.Screen name="Recent" component={RecentScansScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="InspectorVerification" component={InspectorVerificationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
