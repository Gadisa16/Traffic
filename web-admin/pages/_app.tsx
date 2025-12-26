import type { AppProps } from 'next/app'
import { ThemeProvider } from '../components/ThemeProvider'
import { ToastProvider } from '../components/Toast'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </ThemeProvider>
  )
}
