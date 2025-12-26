import React, { forwardRef } from 'react'
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from 'react-native'
import { useTheme } from '../context/ThemeContext'

interface TextInputProps extends RNTextInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
}

const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, containerStyle, style, ...props }, ref) => {
    const { theme } = useTheme()

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {label}
          </Text>
        )}
        <RNTextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: error ? theme.error : theme.border,
              color: theme.text,
            },
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          {...props}
        />
        {error && (
          <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
        )}
      </View>
    )
  }
)

TextInput.displayName = 'TextInput'

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
})

export default TextInput
