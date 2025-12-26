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
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({})

    const passwordRef = useRef<RNTextInput>(null)

    const validate = () => {
        const newErrors: typeof errors = {}
        if (!username.trim()) {
            newErrors.username = 'Username is required'
        }
        if (!password) {
            newErrors.password = 'Password is required'
        } else if (password.length < 4) {
            newErrors.password = 'Password must be at least 4 characters'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const submit = async () => {
        Keyboard.dismiss()
        if (!validate()) return

        setLoading(true)
        try {
            const auth = await Api.register(username.trim(), password)
            if (!auth?.token) throw new Error('Registration failed')
            navigation.replace('Scanner')
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
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            accessibilityLabel="Username input"
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
