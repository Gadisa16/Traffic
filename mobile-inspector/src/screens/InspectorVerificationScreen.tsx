import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Button from '../components/Button'
import Card from '../components/Card'
import { useTheme } from '../context/ThemeContext'
import * as Api from '../lib/api'
import { getUserMessage } from '../lib/errorMapping'
import * as Storage from '../lib/storage'
import { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'InspectorVerification'>

type UploadDocType = 'badge' | 'letter'

type UploadedDoc = {
    id: number
    doc_type: string
    file_url: string
    status: string
}

export default function InspectorVerificationScreen({ navigation }: Props) {
    const { theme } = useTheme()
    const insets = useSafeAreaInsets()

    const [loadingUser, setLoadingUser] = useState(true)
    const [user, setUser] = useState<any | null>(null)
    const [uploading, setUploading] = useState<UploadDocType | null>(null)
    const [lastUploaded, setLastUploaded] = useState<Record<string, UploadedDoc | null>>({
        badge: null,
        letter: null,
    })

    const isInspector = useMemo(() => user?.role === 'inspector', [user])
    const isActive = useMemo(() => user?.status === 'active', [user])
    const isPendingVerification = useMemo(() => user?.status === 'pending_verification', [user])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const token = await Storage.getToken()
                    if (!mounted) return
                    if (!token) {
                        setUser(null)
                        setLoadingUser(false)
                        return
                    }
                    const u = await Api.me()
                    if (!mounted) return
                    setUser(u)
                } catch (e) {
                    if (!mounted) return
                    setUser(null)
                } finally {
                    if (!mounted) return
                    setLoadingUser(false)
                }
            })()

        return () => {
            mounted = false
        }
    }, [])

    const pickAndUpload = async (docType: UploadDocType) => {
        setUploading(docType)
        try {
            if (!isInspector) {
                Alert.alert('Inspector Sign In Required', 'Please sign in as an inspector to upload verification documents.')
                navigation.navigate('Login')
                return
            }

            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (!perm.granted) {
                Alert.alert('Permission Required', 'Photo library access is needed to select documents')
                return
            }

            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            })
            if (res.canceled) return

            const uri = res.assets?.[0]?.uri
            if (!uri) return

            const out = await Api.uploadVerificationDocument(docType, uri)
            setLastUploaded((s) => ({ ...s, [docType]: out }))
            Alert.alert('Uploaded', 'Document uploaded successfully. It will be reviewed by an admin.')

            try {
                const u = await Api.me()
                setUser(u)
            } catch (e) {
            }
        } catch (err: any) {
            Alert.alert('Upload Failed', getUserMessage(err))
        } finally {
            setUploading(null)
        }
    }

    if (loadingUser) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: theme.surface }]}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Inspector Verification</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {!user ? (
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sign in required</Text>
                        <Text style={[styles.sectionText, { color: theme.textSecondary }]}>You need an inspector account to upload verification documents.</Text>
                        <Button title="Sign In" onPress={() => navigation.navigate('Login')} style={{ marginTop: 12 }} />
                    </Card>
                ) : !isInspector ? (
                    <Card variant="outlined" style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Not an inspector</Text>
                        <Text style={[styles.sectionText, { color: theme.textSecondary }]}>This account is not an inspector account.</Text>
                    </Card>
                ) : (
                    <>
                        <Card variant="outlined" style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Status</Text>
                            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>Role: {user?.role}</Text>
                            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>Status: {user?.status || 'unknown'}</Text>

                            {isActive ? (
                                <View style={[styles.badge, { backgroundColor: theme.validLight }]}>
                                    <Text style={[styles.badgeText, { color: theme.success }]}>✓ Verified and active</Text>
                                </View>
                            ) : isPendingVerification ? (
                                <View style={[styles.badge, { backgroundColor: theme.warningLight }]}>
                                    <Text style={[styles.badgeText, { color: theme.warning }]}>Pending admin review</Text>
                                </View>
                            ) : (
                                <View style={[styles.badge, { backgroundColor: theme.warningLight }]}>
                                    <Text style={[styles.badgeText, { color: theme.warning }]}>Upload documents to proceed</Text>
                                </View>
                            )}
                        </Card>

                        <Card variant="outlined" style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Upload documents</Text>
                            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>Upload clear photos of your badge and official letter. Admin will review and activate your account.</Text>

                            <Button
                                title={uploading === 'badge' ? 'Uploading...' : 'Upload Badge Photo'}
                                onPress={() => pickAndUpload('badge')}
                                loading={uploading === 'badge'}
                                disabled={uploading !== null}
                                style={{ marginTop: 12 }}
                            />

                            {lastUploaded.badge?.file_url ? (
                                <Text style={[styles.smallText, { color: theme.textMuted, marginTop: 8 }]}>Last badge upload: {lastUploaded.badge.status}</Text>
                            ) : null}

                            <Button
                                title={uploading === 'letter' ? 'Uploading...' : 'Upload Letter Photo'}
                                onPress={() => pickAndUpload('letter')}
                                loading={uploading === 'letter'}
                                disabled={uploading !== null}
                                variant="secondary"
                                style={{ marginTop: 10 }}
                            />

                            {lastUploaded.letter?.file_url ? (
                                <Text style={[styles.smallText, { color: theme.textMuted, marginTop: 8 }]}>Last letter upload: {lastUploaded.letter.status}</Text>
                            ) : null}
                        </Card>
                    </>
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: { fontSize: 18 },
    content: { paddingHorizontal: 20, paddingTop: 16 },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
    sectionText: { fontSize: 13, lineHeight: 18 },
    smallText: { fontSize: 12 },
    badge: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginTop: 10 },
    badgeText: { fontSize: 13, fontWeight: '700' },
})
