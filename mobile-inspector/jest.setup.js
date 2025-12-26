require('@testing-library/jest-native/extend-expect')

// Optional: silence native modules warnings
// Mock as a virtual module so tests don't fail if the internal path isn't present
jest.mock(
	'react-native/Libraries/Animated/NativeAnimatedHelper',
	() => ({}),
	{ virtual: true }
)

// Mock AsyncStorage for Jest environment to avoid native module errors
jest.mock(
	'@react-native-async-storage/async-storage',
	() => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Provide safe defaults for react-native-safe-area-context in tests
jest.mock('react-native-safe-area-context', () => {
	const actual = jest.requireActual('react-native-safe-area-context')
	return {
		...actual,
		useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
		SafeAreaProvider: ({ children }: any) => children,
	}
})
