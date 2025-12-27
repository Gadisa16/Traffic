import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useRef, useState } from 'react'
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    TextInput as RNTextInput,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../App'
import Button from '../components/Button'
import TextInput from '../components/TextInput'
import { useTheme } from '../context/ThemeContext'
import * as Api from '../lib/api'
import { getUserMessage } from '../lib/errorMapping'

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

export default function RegisterScreen({ navigation }: Props) {
    const { theme } = useTheme()
    const insets = useSafeAreaInsets()

    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<'public' | 'inspector'>('public')
    const [errors, setErrors] = useState<{ username?: string; email?: string; phone?: string; password?: string }>({})

    const emailRef = useRef<RNTextInput>(null)
    const phoneRef = useRef<RNTextInput>(null)
    const passwordRef = useRef<RNTextInput>(null)

    const validate = () => {
        const newErrors: typeof errors = {}
        if (!username.trim()) {
            newErrors.username = 'Username is required'
        }
        if (!email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Enter a valid email'
        }
        if (!phone.trim()) {
            newErrors.phone = 'Phone is required'
        } else if (phone.trim().length < 7) {
            newErrors.phone = 'Enter a valid phone'
        }
        if (!password) {
            newErrors.password = 'Password is required'
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const submit = async () => {
        Keyboard.dismiss()
        if (!validate()) return

        setLoading(true)
        try {
            const auth = await Api.register(username.trim(), password, email.trim(), phone.trim(), role)
            if (!auth?.token) throw new Error('Registration failed')
            navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] })
        } catch (err: any) {
            Alert.alert('Sign Up Failed', getUserMessage(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                style={[styles.container, { backgroundColor: theme.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.brandingContainer}>
                        <View style={[styles.logoCircle, { backgroundColor: theme.accent }]}>
                            <Text style={styles.logoText}>🚕</Text>
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>Create an account</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Vehicle Inspector</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={[styles.formTitle, { color: theme.text }]}>Sign up</Text>

                        <TextInput
                            label="Username"
                            placeholder="Choose a username"
                            value={username}
                            onChangeText={(text) => {
                                setUsername(text)
                                if (errors.username) setErrors({ ...errors, username: undefined })
                            }}
                            error={errors.username}
                            autoCapitalize="none"
                            autoComplete="username"
                            autoCorrect={false}
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                            accessibilityLabel="Username input"
                        />

                        <TextInput
                            ref={emailRef}
                            label="Email"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text)
                                if (errors.email) setErrors({ ...errors, email: undefined })
                            }}
                            error={errors.email}
                            autoCapitalize="none"
                            autoComplete="email"
                            keyboardType="email-address"
                            autoCorrect={false}
                            returnKeyType="next"
                            onSubmitEditing={() => phoneRef.current?.focus()}
                            accessibilityLabel="Email input"
                        />

                        <TextInput
                            ref={phoneRef}
                            label="Phone"
                            placeholder="+251..."
                            value={phone}
                            onChangeText={(text) => {
                                setPhone(text)
                                if (errors.phone) setErrors({ ...errors, phone: undefined })
                            }}
                            error={errors.phone}
                            autoCapitalize="none"
                            autoComplete="tel"
                            keyboardType="phone-pad"
                            autoCorrect={false}
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            accessibilityLabel="Phone input"
                        />

                        <TextInput
                            ref={passwordRef}
                            label="Password"
                            placeholder="Choose a password"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text)
                                if (errors.password) setErrors({ ...errors, password: undefined })
                            }}
                            error={errors.password}
                            secureTextEntry
                            autoComplete="password"
                            returnKeyType="go"
                            onSubmitEditing={submit}
                            accessibilityLabel="Password input"
                        />

                        <View style={styles.roleRow}>
                            <TouchableOpacity
                                onPress={() => setRole('public')}
                                style={[styles.rolePill, styles.rolePillLeft, { backgroundColor: role === 'public' ? theme.accent : theme.surface }]}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: role === 'public' }}
                            >
                                <Text style={[styles.roleText, { color: role === 'public' ? '#ffffff' : theme.text }]}>Public</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setRole('inspector')}
                                style={[styles.rolePill, { backgroundColor: role === 'inspector' ? theme.accent : theme.surface }]}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: role === 'inspector' }}
                            >
                                <Text style={[styles.roleText, { color: role === 'inspector' ? '#ffffff' : theme.text }]}>Inspector</Text>
                            </TouchableOpacity>
                        </View>

                        <Button
                            title={loading ? 'Creating...' : 'Create Account'}
                            onPress={submit}
                            loading={loading}
                            size="large"
                            style={{ marginTop: 8 }}
                            accessibilityLabel="Create account button"
                        />

                        <TouchableOpacity
                            onPress={() => navigation.replace('Login')}
                            style={styles.linkContainer}
                            accessibilityRole="button"
                            accessibilityLabel="Back to sign in"
                        >
                            <Text style={[styles.linkText, { color: theme.accent }]}>Already have an account? Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    brandingContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoText: {
        fontSize: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    formContainer: {
        flex: 1,
    },
    roleRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    rolePill: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    rolePillLeft: {
        marginRight: 8,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '700',
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 24,
    },
    linkContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
    },
})
