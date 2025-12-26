import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../App'
import Button from '../components/Button'
import { useTheme } from '../context/ThemeContext'

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>

export default function ScannerScreen({ navigation }: Props) {
  const { theme, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanning, setScanning] = useState(true)
  const [BarCodeScannerComp, setBarCodeScannerComp] = useState<any | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const lastScannedRef = useRef<number | null>(null)
  const scannerModuleRef = useRef<any>(null)

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setHasPermission(false)
        return
      }
      try {
        const mod = await import('expo-barcode-scanner')
        scannerModuleRef.current = mod
        setBarCodeScannerComp(() => mod.BarCodeScanner)
        if (mod && mod.requestPermissionsAsync) {
          const { status } = await mod.requestPermissionsAsync()
          setHasPermission(status === 'granted')
        } else {
          setHasPermission(false)
        }
      } catch (err) {
        setHasPermission(false)
      }
    })()
  }, [])

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    const now = Date.now()
    if (lastScannedRef.current && now - lastScannedRef.current < 5000) {
      // Suppress duplicate scans within 5s
      return
    }
    lastScannedRef.current = now
    setScanning(false)
    navigation.navigate('Verify', { code: data })
    setTimeout(() => setScanning(true), 1000)
  }

  const handleManualSubmit = () => {
    Keyboard.dismiss()
    const code = manualCode.trim()
    if (!code) {
      Alert.alert('Enter Code', 'Please enter a plate number or side number')
      return
    }
    setManualCode('')
    setShowManualEntry(false)
    navigation.navigate('Verify', { code })
  }

  const requestPermission = async () => {
    if (scannerModuleRef.current && scannerModuleRef.current.requestPermissionsAsync) {
      const r = await scannerModuleRef.current.requestPermissionsAsync()
      setHasPermission(r.status === 'granted')
    } else {
      setHasPermission(false)
    }
  }

  // Permission states
  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Requesting camera permission...
        </Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
            To scan vehicle QR codes, please grant camera access
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestPermission}
            size="large"
            style={{ marginTop: 24, width: '100%' }}
          />
          <Button
            title="Enter Code Manually"
            onPress={() => setShowManualEntry(true)}
            variant="outline"
            style={{ marginTop: 12, width: '100%' }}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Scan Vehicle</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Point camera at QR code
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Scanner View */}
      <View style={styles.scannerWrapper}>
        <View style={[styles.scannerContainer, { borderColor: theme.border }]}>
          {BarCodeScannerComp ? (
            <BarCodeScannerComp
              onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
              style={StyleSheet.absoluteFillObject}
              accessibilityLabel="Camera scanner"
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.noCamera]}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>
                Camera not available in this runtime
              </Text>
            </View>
          )}
          
          {/* Scan Frame Overlay */}
          <View style={styles.scanFrameOverlay}>
            <View style={[styles.scanFrame, { borderColor: theme.accent }]}>
              <View style={[styles.scanCorner, styles.topLeft, { borderColor: theme.accent }]} />
              <View style={[styles.scanCorner, styles.topRight, { borderColor: theme.accent }]} />
              <View style={[styles.scanCorner, styles.bottomLeft, { borderColor: theme.accent }]} />
              <View style={[styles.scanCorner, styles.bottomRight, { borderColor: theme.accent }]} />
            </View>
          </View>
        </View>

        {/* Scan hint */}
        <View style={[styles.scanHint, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}>
          <Text style={[styles.scanHintText, { color: theme.text }]}>
            {scanning ? '📱 Position QR code within frame' : '✓ Processing...'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Enter Code Manually"
          onPress={() => setShowManualEntry(true)}
          variant="outline"
          style={{ marginBottom: 12 }}
          accessibilityLabel="Enter vehicle code manually"
        />
        
        <View style={styles.actionRow}>
          <Button
            title="📋 Recent"
            onPress={() => navigation.navigate('Recent')}
            variant="secondary"
            style={{ flex: 1, marginRight: 8 }}
            accessibilityLabel="View recent scans"
          />
          <Button
            title="⚙️ Settings"
            onPress={() => navigation.navigate('Settings')}
            variant="secondary"
            style={{ flex: 1 }}
            accessibilityLabel="Open settings"
          />
        </View>
      </View>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss()
              setShowManualEntry(false)
            }}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Enter Vehicle Code
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter the plate number, side number, or QR code value
            </Text>
            
            <TextInput
              style={[
                styles.manualInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="e.g., AA-12345 or SN-001"
              placeholderTextColor={theme.textMuted}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleManualSubmit}
            />
            
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowManualEntry(false)
                  setManualCode('')
                }}
                variant="ghost"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Search"
                onPress={handleManualSubmit}
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
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
  },
  permissionContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  scannerWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scannerContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 3,
  },
  noCamera: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scanFrameOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: '70%',
    aspectRatio: 1,
    borderWidth: 0,
    borderRadius: 16,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanHintText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: 20,
  },
  actionRow: {
    flexDirection: 'row',
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
  manualInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
  },
})
