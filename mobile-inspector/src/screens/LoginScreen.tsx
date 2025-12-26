import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useRef, useState } from 'react'
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootStackParamList } from '../App'
import Button from '../components/Button'
import TextInput from '../components/TextInput'
import { useTheme } from '../context/ThemeContext'
import * as Api from '../lib/api'
import * as Storage from '../lib/storage'

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const { theme, isDark } = useTheme()
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
      const auth = await Api.login(username.trim(), password)
      if (!auth || !auth.token) throw new Error('Login failed')
      await Storage.saveAuth({
        token: auth.token,
        refreshToken: (auth as any).refreshToken,
        expiresAt: (auth as any).expiresAt,
      })
      navigation.replace('Scanner')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Login failed. Please try again.'
      Alert.alert('Sign In Failed', message)
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
          {/* Logo / Branding */}
          <View style={styles.brandingContainer}>
            <View style={[styles.logoCircle, { backgroundColor: theme.accent }]}>
              <Text style={styles.logoText}>🚕</Text>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Vehicle Inspector
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sidama Region • Hawassa
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.formTitle, { color: theme.text }]}>
              Sign in to your account
            </Text>

            <TextInput
              label="Username or Phone"
              placeholder="Enter your username"
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
              accessibilityHint="Enter your username or phone number"
            />

            <TextInput
              ref={passwordRef}
              label="Password"
              placeholder="Enter your password"
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
              accessibilityHint="Enter your password"
            />

            <Button
              title={loading ? 'Signing in...' : 'Sign In'}
              onPress={submit}
              loading={loading}
              size="large"
              style={{ marginTop: 8 }}
              accessibilityLabel="Sign in button"
              accessibilityHint="Tap to sign in to your account"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Transport Authority • Ethiopia
            </Text>
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
    fontSize: 28,
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
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
})
