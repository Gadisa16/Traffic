import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../App'
import Button from '../components/Button'
import Card from '../components/Card'
import { useTheme } from '../context/ThemeContext'
import * as Offline from '../lib/offline'
import * as Storage from '../lib/storage'

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>

export default function SettingsScreen({ navigation }: Props) {
  const { theme, isDark, themePreference, setThemePreference } = useTheme()
  const insets = useSafeAreaInsets()

  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [queueCount, setQueueCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    loadData()
    const unsub = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false)
    })
    return () => unsub()
  }, [])

  const loadData = async () => {
    try {
      const net = await NetInfo.fetch()
      setIsConnected(net.isConnected ?? false)
      const queue = await Offline.getQueue()
      setQueueCount(queue.length)
    } catch (e) {
      // ignore
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await Offline.syncQueue()
      if (res?.ok) {
        const succeeded = res.results?.filter((r: any) => r.ok).length || 0
        const failed = (res.results?.length || 0) - succeeded
        Alert.alert(
          'Sync Complete',
          succeeded > 0 || failed > 0
            ? `Uploaded ${succeeded} scans${failed > 0 ? `, ${failed} failed` : ''}`
            : 'No pending scans to sync'
        )
      } else {
        Alert.alert('Sync Failed', res?.message || 'Unknown error')
      }
    } catch (e: any) {
      Alert.alert('Sync Failed', e?.message || 'Unknown error')
    } finally {
      setSyncing(false)
      loadData()
    }
  }

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will delete your recent scan history. Pending uploads will not be affected. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true)
            try {
              await AsyncStorage.removeItem('mobile_inspector_recent')
              Alert.alert('Cache Cleared', 'Your recent scan history has been cleared.')
            } catch (e) {
              Alert.alert('Error', 'Failed to clear cache')
            } finally {
              setClearing(false)
            }
          },
        },
      ]
    )
  }

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await Storage.clearToken()
            navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] })
          },
        },
      ]
    )
  }

  const ThemeOption = ({
    label,
    value,
    icon,
  }: {
    label: string
    value: 'system' | 'light' | 'dark'
    icon: string
  }) => {
    const isSelected = themePreference === value
    return (
      <TouchableOpacity
        style={[
          styles.themeOption,
          {
            backgroundColor: isSelected ? theme.accent : theme.surface,
            borderColor: isSelected ? theme.accent : theme.border,
          },
        ]}
        onPress={() => setThemePreference(value)}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${label} theme`}
      >
        <Text style={styles.themeIcon}>{icon}</Text>
        <Text
          style={[
            styles.themeLabel,
            { color: isSelected ? (isDark ? '#0a1628' : '#ffffff') : theme.text },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Connection Status */}
        <Card variant="outlined" style={styles.section}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? theme.success : theme.error },
                ]}
              />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Connection Status
              </Text>
            </View>
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
          {queueCount > 0 && (
            <View style={[styles.queueBanner, { backgroundColor: theme.warningLight }]}>
              <Text style={[styles.queueText, { color: theme.warning }]}>
                📤 {queueCount} scan{queueCount !== 1 ? 's' : ''} pending upload
              </Text>
            </View>
          )}
        </Card>

        {/* Theme Selection */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Appearance
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Choose how the app looks
          </Text>
          <View style={styles.themeOptions}>
            <View style={{ marginRight: 8, flex: 1 }}>
              <ThemeOption label="System" value="system" icon="📱" />
            </View>
            <View style={{ marginRight: 8, flex: 1 }}>
              <ThemeOption label="Light" value="light" icon="☀️" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemeOption label="Dark" value="dark" icon="🌙" />
            </View>
          </View>
        </Card>

        {/* Sync */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Data Sync
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Manually sync any pending scans to the server
          </Text>
          <Button
            title={syncing ? 'Syncing...' : 'Sync Now'}
            onPress={handleSync}
            variant="secondary"
            loading={syncing}
            disabled={!isConnected || queueCount === 0}
            style={{ marginTop: 12 }}
          />
          {!isConnected && (
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Connect to internet to sync
            </Text>
          )}
        </Card>

        {/* Cache */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Storage
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Clear cached scan history
          </Text>
          <Button
            title={clearing ? 'Clearing...' : 'Clear Cache'}
            onPress={handleClearCache}
            variant="outline"
            loading={clearing}
            style={{ marginTop: 12 }}
          />
        </Card>

        {/* About */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            About
          </Text>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>
              Version
            </Text>
            <Text style={[styles.aboutValue, { color: theme.text }]}>
              0.1.0
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>
              Region
            </Text>
            <Text style={[styles.aboutValue, { color: theme.text }]}>
              Sidama / Hawassa
            </Text>
          </View>
        </Card>

        {/* Logout */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          size="large"
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  queueBanner: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  queueText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '600',
  },
})
