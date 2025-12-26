import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../App'
import Button from '../components/Button'
import Card from '../components/Card'
import FlagBadge from '../components/FlagBadge'
import StatusBadge from '../components/StatusBadge'
import { useTheme } from '../context/ThemeContext'
import * as Api from '../lib/api'
import * as Offline from '../lib/offline'
import * as Storage from '../lib/storage'
import { formatDaysRemaining, getDaysRemaining, getStatusColor } from '../theme'
import { Vehicle, VehicleFlag } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Verify'>

export default function VerifyScreen({ route, navigation }: Props) {
  const { code, fromRecent } = route.params
  const { theme, isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Vehicle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [actionLoading, setActionLoading] = useState<'ok' | 'flag' | null>(null)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagNote, setFlagNote] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    setIsOffline(false)

    Api.verifyVehicle(code)
      .then(async (res) => {
        if (!mounted) return
        setData(res)
        const now = Date.now()
        try {
          await Api.recordScan(code, { result: res, when: now })
          await Storage.addRecentScan({ code, result: res, when: now, syncStatus: 'synced' })
        } catch (err) {
          const queued = await Offline.addToQueue({ code, when: now, payload: { result: res } })
          await Storage.addRecentScan({ code, result: res, when: now, syncStatus: 'pending', queueId: queued.id })
        }
      })
      .catch(async (err: any) => {
        const now = Date.now()
        const queued = await Offline.addToQueue({ code, when: now, payload: { offline: true } })
        await Storage.addRecentScan({ code, result: null, when: now, syncStatus: 'pending', queueId: queued.id })
        setIsOffline(true)
        setError('Queued for verification — will sync when online')
      })
      .finally(() => setLoading(false))

    return () => { mounted = false }
  }, [code])

  const handleMarkOk = async () => {
    setActionLoading('ok')
    try {
      await Api.recordScan(code, { action: 'ok', when: Date.now() })
      Alert.alert('✓ Verified', 'Vehicle marked as inspected and OK')
      navigation.goBack()
    } catch (err: any) {
      // Queue offline
      await Offline.addToQueue({ code, when: Date.now(), payload: { action: 'ok' } })
      Alert.alert('Saved Offline', 'Will sync when connected')
      navigation.goBack()
    } finally {
      setActionLoading(null)
    }
  }

  const handleRaiseFlag = async () => {
    if (!flagNote.trim()) {
      Alert.alert('Note Required', 'Please describe the issue')
      return
    }
    setActionLoading('flag')
    try {
      await Api.recordScan(code, { action: 'flag', note: flagNote.trim(), when: Date.now() })
      Alert.alert('🚩 Flagged', 'Issue has been reported')
      setShowFlagModal(false)
      navigation.goBack()
    } catch (err: any) {
      await Offline.addToQueue({ code, when: Date.now(), payload: { action: 'flag', note: flagNote.trim() } })
      Alert.alert('Saved Offline', 'Will sync when connected')
      setShowFlagModal(false)
      navigation.goBack()
    } finally {
      setActionLoading(null)
    }
  }

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take photos')
        return
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.6 })
      if (res.canceled) return
      
      const photoUri = res.assets?.[0]?.uri
      if (!photoUri) return

      const now = Date.now()
      try {
        await Api.recordScan(code, { when: now, photoUri })
        Alert.alert('📸 Photo Uploaded', 'Evidence photo has been saved')
      } catch (err) {
        await Offline.addToQueue({ code, when: now, payload: { photoUri } })
        Alert.alert('Photo Saved', 'Will upload when online')
      }
    } catch (e) {
      Alert.alert('Photo Failed', String(e))
    }
  }

  const daysRemaining = data?.license_expiry ? getDaysRemaining(data.license_expiry) : null

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Verifying vehicle...
        </Text>
      </View>
    )
  }

  // Offline/error state
  if (error && !data) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background, paddingTop: insets.top },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Verification</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={[styles.center, { flex: 1, padding: 24 }]}>
          <View style={[styles.offlineCard, { backgroundColor: theme.warningLight }]}>
            <Text style={styles.offlineIcon}>📶</Text>
            <Text style={[styles.offlineTitle, { color: theme.warning }]}>
              {isOffline ? 'Offline Mode' : 'Verification Failed'}
            </Text>
            <Text style={[styles.offlineText, { color: theme.text }]}>
              {error}
            </Text>
            <Text style={[styles.offlineCode, { color: theme.textSecondary }]}>
              Code: {code}
            </Text>
          </View>

          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="secondary"
            size="large"
            style={{ marginTop: 24, width: '100%' }}
          />
        </View>
      </View>
    )
  }

  // Success state - Vehicle data
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Vehicle Details</Text>
        <TouchableOpacity
          onPress={takePhoto}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          accessibilityLabel="Take photo"
        >
          <Text style={styles.backIcon}>📷</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Identity - Large and prominent */}
        <Card variant="elevated" style={styles.identityCard}>
          {/* Side Number Badge */}
          <View style={[styles.sideNumberBadge, { backgroundColor: theme.accent }]}>
            <Text style={styles.sideNumberLabel}>SIDE NO.</Text>
            <Text style={styles.sideNumberValue}>
              {data?.side_number || '—'}
            </Text>
          </View>

          {/* Plate Number */}
          <Text style={[styles.plateNumber, { color: theme.text }]}>
            {data?.plate_number || code}
          </Text>

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <StatusBadge status={data?.status || 'unknown'} size="large" />
          </View>
        </Card>

        {/* License Info */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            License Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Expiry Date
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {data?.license_expiry
                ? new Date(data.license_expiry).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown'}
            </Text>
          </View>

          {daysRemaining !== null && (
            <View
              style={[
                styles.daysRemainingBadge,
                {
                  backgroundColor: getStatusColor(
                    daysRemaining < 0 ? 'expired' : daysRemaining < 30 ? 'expiring_soon' : 'valid',
                    theme
                  ).bg,
                },
              ]}
            >
              <Text
                style={[
                  styles.daysRemainingText,
                  {
                    color: getStatusColor(
                      daysRemaining < 0 ? 'expired' : daysRemaining < 30 ? 'expiring_soon' : 'valid',
                      theme
                    ).text,
                  },
                ]}
              >
                {formatDaysRemaining(daysRemaining)}
              </Text>
            </View>
          )}
        </Card>

        {/* Owner Info */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Owner Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Name
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {data?.owner?.name || 'Not available'}
            </Text>
          </View>

          <Text style={[styles.infoValue, { color: theme.text }]}>Owner: {data?.owner?.name || 'Not available'}</Text>

          {data?.owner?.mask_phone && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Phone
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {data.owner.mask_phone}
              </Text>
            </View>
          )}
        </Card>

        {/* Flags/Warnings */}
        {data?.flags && data.flags.length > 0 && (
          <Card variant="outlined" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              ⚠️ Alerts & Warnings
            </Text>
            {data.flags.map((flag: VehicleFlag, index: number) => (
              <FlagBadge key={index} flag={flag} />
            ))}
          </Card>
        )}

        {/* Vehicle Details */}
        {(data?.vehicle_type || data?.make || data?.model || data?.color) && (
          <Card variant="outlined" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Vehicle Details
            </Text>

            {data.vehicle_type && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Type</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{data.vehicle_type}</Text>
              </View>
            )}
            {data.make && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Make</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{data.make}</Text>
              </View>
            )}
            {data.model && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Model</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{data.model}</Text>
              </View>
            )}
            {data.color && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Color</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{data.color}</Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: theme.surface,
            paddingBottom: insets.bottom + 16,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Button
          title="Mark OK"
          onPress={handleMarkOk}
          loading={actionLoading === 'ok'}
          disabled={actionLoading !== null}
          size="large"
          style={{ flex: 1, marginRight: 8 }}
          accessibilityLabel="Mark vehicle as OK"
        />
        <Button
          title="Raise Flag"
          onPress={() => setShowFlagModal(true)}
          variant="danger"
          loading={actionLoading === 'flag'}
          disabled={actionLoading !== null}
          size="large"
          style={{ flex: 1 }}
          accessibilityLabel="Report an issue with this vehicle"
        />
      </View>

      {/* Flag Modal */}
      {showFlagModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFlagModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              🚩 Report Issue
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Describe the problem with this vehicle
            </Text>

            <TextInput
              style={[
                styles.flagInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Enter details about the issue..."
              placeholderTextColor={theme.textMuted}
              value={flagNote}
              onChangeText={setFlagNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowFlagModal(false)
                  setFlagNote('')
                }}
                variant="ghost"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Submit Flag"
                onPress={handleRaiseFlag}
                variant="danger"
                loading={actionLoading === 'flag'}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  identityCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  sideNumberBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  sideNumberLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  sideNumberValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  plateNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  daysRemainingBadge: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  daysRemainingText: {
    fontSize: 15,
    fontWeight: '700',
  },
  offlineCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  offlineIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  offlineCode: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  flagInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
  },
})
