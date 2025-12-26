import NetInfo from '@react-native-community/netinfo'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../App'
import Button from '../components/Button'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { useTheme } from '../context/ThemeContext'
import * as Offline from '../lib/offline'
import * as Storage from '../lib/storage'
import { RecentScan } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Recent'>

export default function RecentScansScreen({ navigation }: Props) {
  const { theme, isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const [items, setItems] = useState<RecentScan[]>([])
  const [hasPending, setHasPending] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [retrying, setRetrying] = useState<Record<string, boolean>>({})
  const [queueMap, setQueueMap] = useState<Record<string, { retryCount?: number; lastAttempt?: number | null }>>({})

  const loadData = useCallback(async () => {
    const recent = await Storage.getRecentScans()
    const q = await Offline.getQueue()
    const map: Record<string, { retryCount?: number; lastAttempt?: number | null }> = {}
    ;(q || []).forEach((it) => (map[it.id] = { retryCount: it.retryCount || 0, lastAttempt: it.lastAttempt ?? null }))
    setItems(recent)
    setQueueMap(map)
    setHasPending((q || []).length > 0)
    const net = await NetInfo.fetch()
    setIsConnected(net.isConnected ?? false)
  }, [])

  useEffect(() => {
    loadData()
    const unsub = NetInfo.addEventListener((s) => setIsConnected(s.isConnected ?? false))
    return () => unsub()
  }, [loadData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
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
            : 'All scans already synced'
        )
      } else {
        Alert.alert('Sync Failed', res?.message || 'Unknown error')
      }
    } catch (e: any) {
      Alert.alert('Sync Failed', e?.message || 'Unknown error')
    } finally {
      setSyncing(false)
      await loadData()
    }
  }

  const handleRetry = async (queueId: string) => {
    setRetrying((s) => ({ ...s, [queueId]: true }))
    try {
      const res = await Offline.retryItem(queueId)
      if (res?.ok) {
        Alert.alert('Success', 'Scan uploaded successfully')
      } else {
        Alert.alert('Retry Failed', res?.message || 'Unknown error')
      }
    } catch (e: any) {
      Alert.alert('Retry Failed', e?.message || 'Unknown error')
    } finally {
      setRetrying((s) => ({ ...s, [queueId]: false }))
      await loadData()
    }
  }

  const getSyncStatusDisplay = (syncStatus?: string) => {
    switch (syncStatus) {
      case 'synced':
        return { label: 'Synced', color: theme.success, icon: '✓' }
      case 'pending':
        return { label: 'Pending', color: theme.warning, icon: '⏳' }
      case 'failed':
        return { label: 'Failed', color: theme.error, icon: '✗' }
      default:
        return { label: 'Unknown', color: theme.textMuted, icon: '?' }
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderItem = ({ item }: { item: RecentScan }) => {
    const syncStatus = getSyncStatusDisplay(item.syncStatus)
    const meta = item.queueId ? queueMap[item.queueId] : null

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Verify', { code: item.code, fromRecent: true })}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${item.result?.plate_number || item.code}`}
      >
        <Card variant="outlined" style={styles.itemCard}>
          <View style={styles.itemMain}>
            {/* Left side - Vehicle info */}
            <View style={styles.itemInfo}>
              {item.result?.side_number && (
                <View style={[styles.sideNumberSmall, { backgroundColor: theme.accent }]}>
                  <Text style={styles.sideNumberSmallText}>{item.result.side_number}</Text>
                </View>
              )}
              <Text style={[styles.plateText, { color: theme.text }]}>
                {item.result?.plate_number || item.code}
              </Text>
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                {formatTime(item.when)}
              </Text>
            </View>

            {/* Right side - Status */}
            <View style={styles.itemStatus}>
              {item.result?.status ? (
                <StatusBadge status={item.result.status} size="small" />
              ) : (
                <View
                  style={[
                    styles.syncBadge,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                  ]}
                >
                  <Text style={{ marginRight: 4 }}>{syncStatus.icon}</Text>
                  <Text style={[styles.syncText, { color: syncStatus.color }]}>
                    {syncStatus.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Queue metadata for pending/failed */}
          {meta && item.syncStatus !== 'synced' && (
            <View style={[styles.metaRow, { borderTopColor: theme.borderLight }]}>
              <Text style={[styles.metaText, { color: theme.textMuted }]}>
                {meta.retryCount ? `${meta.retryCount} attempt${meta.retryCount > 1 ? 's' : ''}` : 'Queued'}
                {meta.lastAttempt && ` • Last: ${formatTime(meta.lastAttempt)}`}
              </Text>
              {item.syncStatus === 'failed' && item.queueId && (
                <TouchableOpacity
                  onPress={() => handleRetry(item.queueId!)}
                  disabled={retrying[item.queueId]}
                  style={[styles.retryButton, { backgroundColor: theme.accent }]}
                >
                  {retrying[item.queueId] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.retryButtonText}>Retry</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    )
  }

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Recent Scans</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        Scanned vehicles will appear here
      </Text>
      <Button
        title="Scan Vehicle"
        onPress={() => navigation.navigate('Scanner')}
        style={{ marginTop: 24 }}
      />
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Recent Scans</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Pending uploads banner */}
      {hasPending && (
        <View style={[styles.pendingBanner, { backgroundColor: theme.warningLight }]}>
          <View style={styles.pendingInfo}>
            <Text style={[styles.pendingText, { color: theme.warning }]}>
              📤 {Object.keys(queueMap).length} scan{Object.keys(queueMap).length !== 1 ? 's' : ''} pending upload
            </Text>
            {!isConnected && (
              <Text style={[styles.pendingSubtext, { color: theme.textSecondary }]}>
                Will sync when online
              </Text>
            )}
          </View>
          <Button
            title={syncing ? 'Syncing...' : 'Sync'}
            onPress={handleSync}
            size="small"
            loading={syncing}
            disabled={!isConnected || syncing}
          />
        </View>
      )}

      {/* Scan list */}
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.code}_${item.when}`}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 16 },
          items.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    fontSize: 20,
    fontWeight: '700',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  pendingInfo: {
    flex: 1,
    marginRight: 12,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
  },
  itemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  sideNumberSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  sideNumberSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  plateText: {
    fontSize: 18,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 13,
    marginTop: 4,
  },
  itemStatus: {
    alignItems: 'flex-end',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metaText: {
    fontSize: 12,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
})
