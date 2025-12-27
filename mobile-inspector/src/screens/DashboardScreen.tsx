import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Button from '../components/Button'
import Card from '../components/Card'
import { useTheme } from '../context/ThemeContext'
import * as Api from '../lib/api'
import * as Storage from '../lib/storage'
import { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>

type Stats = {
    total_vehicles: number
    valid_license: number
    expired_license: number
    expiring_soon_license: number
    unknown_license: number
}

export default function DashboardScreen({ navigation }: Props) {
    const { theme, isDark } = useTheme()
    const insets = useSafeAreaInsets()

    const [manualCode, setManualCode] = useState('')
    const [statsLoading, setStatsLoading] = useState(true)
    const [stats, setStats] = useState<Stats | null>(null)
    const [statsError, setStatsError] = useState<string | null>(null)

    const [authLoading, setAuthLoading] = useState(true)
    const [user, setUser] = useState<any | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userStatus, setUserStatus] = useState<string | null>(null)

    const isInspectorActive = useMemo(() => userRole === 'inspector' && userStatus === 'active', [userRole, userStatus])

    const loadAuth = async () => {
        setAuthLoading(true)
        try {
            const t = await Storage.getToken()
            if (!t) {
                setUser(null)
                setUserRole(null)
                setUserStatus(null)
                return
            }
            const u = await Api.me()
            setUser(u)
            setUserRole(u?.role ?? null)
            setUserStatus(u?.status ?? null)
        } catch (e) {
            setUser(null)
            setUserRole(null)
            setUserStatus(null)
        } finally {
            setAuthLoading(false)
        }
    }

    useEffect(() => {
        let mounted = true
            ; (async () => {
                if (!mounted) return
                await loadAuth()
            })()
        const unsub = navigation.addListener('focus', () => {
            loadAuth()
        })
        return () => {
            mounted = false
            unsub()
        }
    }, [navigation])

    const handleLogout = async () => {
        await Storage.clearToken()
        setUser(null)
        setUserRole(null)
        setUserStatus(null)
    }

    useEffect(() => {
        let mounted = true
        setStatsLoading(true)
        setStatsError(null)

        Api.getVehicleStats()
            .then((res: Stats) => {
                if (!mounted) return
                setStats(res)
            })
            .catch((e: any) => {
                if (!mounted) return
                setStatsError(e?.message ? String(e.message) : 'Failed to load stats')
                setStats(null)
            })
            .finally(() => {
                if (!mounted) return
                setStatsLoading(false)
            })

        return () => {
            mounted = false
        }
    }, [])

    const submitManual = () => {
        Keyboard.dismiss()
        const code = manualCode.trim()
        if (!code) return
        setManualCode('')
        navigation.navigate('Verify', { code })
    }

    const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
    )

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}
        >
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={[styles.logoCircle, { backgroundColor: theme.accent }]}>
                        <Text style={styles.logoText}>🚕</Text>
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Vehicle Inspector</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Verify plates, side numbers, and QR codes</Text>
                </View>

                <Card variant="outlined" style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Verify</Text>

                    <Button
                        title="Scan Vehicle QR"
                        onPress={() => navigation.navigate('Scanner')}
                        size="large"
                        style={{ marginTop: 8 }}
                        accessibilityLabel="Scan vehicle QR"
                    />

                    <View style={styles.manualRow}>
                        <TextInput
                            style={[
                                styles.manualInput,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                    color: theme.text,
                                },
                            ]}
                            placeholder="Enter plate / side number"
                            placeholderTextColor={theme.textMuted}
                            value={manualCode}
                            onChangeText={setManualCode}
                            returnKeyType="search"
                            onSubmitEditing={submitManual}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            onPress={submitManual}
                            style={[styles.manualButton, { backgroundColor: theme.accent }]}
                            accessibilityRole="button"
                            accessibilityLabel="Verify entered code"
                        >
                            <Text style={[styles.manualButtonText, { color: isDark ? '#0a1628' : '#ffffff' }]}>Go</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.linksRow}>
                        <Button
                            title="Recent"
                            onPress={() => navigation.navigate('Recent')}
                            variant="secondary"
                            style={{ flex: 1, marginRight: 8 }}
                        />
                        <Button
                            title="Settings"
                            onPress={() => navigation.navigate('Settings')}
                            variant="secondary"
                            style={{ flex: 1 }}
                        />
                    </View>
                </Card>

                <Card variant="outlined" style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>System Stats</Text>

                    {statsLoading ? (
                        <View style={styles.statsLoading}>
                            <ActivityIndicator color={theme.accent} />
                            <Text style={[styles.statsLoadingText, { color: theme.textSecondary }]}>Loading stats...</Text>
                        </View>
                    ) : statsError ? (
                        <Text style={[styles.statsErrorText, { color: theme.textSecondary }]}>{statsError}</Text>
                    ) : (
                        <View style={styles.statsGrid}>
                            <StatCard label="Total" value={stats?.total_vehicles ?? 0} color={theme.text} />
                            <StatCard label="Valid" value={stats?.valid_license ?? 0} color={theme.success} />
                            <StatCard label="Expired" value={stats?.expired_license ?? 0} color={theme.error} />
                            <StatCard label="Expiring" value={stats?.expiring_soon_license ?? 0} color={theme.warning} />
                        </View>
                    )}
                </Card>

                <Card variant="outlined" style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Inspector Tools</Text>
                    <Text style={[styles.sectionText, { color: theme.textSecondary }]}>Sign in as an inspector to submit inspections and upload evidence photos.</Text>

                    {isInspectorActive ? (
                        <View style={[styles.badge, { backgroundColor: theme.validLight }]}
                        >
                            <Text style={[styles.badgeText, { color: theme.success }]}>✓ Inspector mode enabled</Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: theme.warningLight }]}
                        >
                            <Text style={[styles.badgeText, { color: theme.warning }]}>Limited public mode</Text>
                        </View>
                    )}

                    {authLoading ? (
                        <View style={styles.statsLoading}>
                            <ActivityIndicator color={theme.accent} />
                            <Text style={[styles.statsLoadingText, { color: theme.textSecondary }]}>Checking account...</Text>
                        </View>
                    ) : user ? (
                        <Card variant="default" style={{ marginTop: 12 }}>
                            <Text style={[styles.sectionText, { color: theme.text }]}>Signed in as: {user?.username}</Text>
                            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>Role: {userRole || 'unknown'} • Status: {userStatus || 'unknown'}</Text>
                            <Button
                                title="Sign Out"
                                onPress={handleLogout}
                                variant="secondary"
                                style={{ marginTop: 12 }}
                            />
                        </Card>
                    ) : (
                        <View style={styles.linksRow}>
                            <Button
                                title="Sign In"
                                onPress={() => navigation.navigate('Login')}
                                variant="outline"
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <Button
                                title="Sign Up"
                                onPress={() => navigation.navigate('Register')}
                                style={{ flex: 1 }}
                            />
                        </View>
                    )}

                    {userRole === 'inspector' && userStatus !== 'active' ? (
                        <Button
                            title="Submit Verification Documents"
                            onPress={() => navigation.navigate('InspectorVerification')}
                            variant="secondary"
                            style={{ marginTop: 12 }}
                        />
                    ) : null}
                </Card>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20 },
    header: { alignItems: 'center', marginBottom: 20 },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    logoText: { fontSize: 38 },
    title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
    subtitle: { fontSize: 14, textAlign: 'center', marginTop: 6 },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
    sectionText: { fontSize: 13, lineHeight: 18 },
    manualRow: { flexDirection: 'row', marginTop: 12 },
    manualInput: {
        flex: 1,
        borderWidth: 2,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
    },
    manualButton: {
        marginLeft: 10,
        borderRadius: 12,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    manualButtonText: { fontSize: 16, fontWeight: '800' },
    linksRow: { flexDirection: 'row', marginTop: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    statCard: {
        width: '48%',
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        marginRight: '4%',
    },
    statLabel: { fontSize: 12, fontWeight: '700' },
    statValue: { fontSize: 22, fontWeight: '900', marginTop: 6 },
    statsLoading: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    statsLoadingText: { marginLeft: 10, fontSize: 13 },
    statsErrorText: { marginTop: 8, fontSize: 13 },
    badge: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginTop: 10 },
    badgeText: { fontSize: 13, fontWeight: '700' },
})
