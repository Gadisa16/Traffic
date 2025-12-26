import { formatDaysRemaining, getDaysRemaining, getStatusColor, light, dark, getTheme } from '../src/theme'

describe('theme', () => {
  describe('getTheme', () => {
    it('returns light theme for light color scheme', () => {
      expect(getTheme('light')).toBe(light)
    })

    it('returns dark theme for dark color scheme', () => {
      expect(getTheme('dark')).toBe(dark)
    })

    it('returns light theme for null color scheme', () => {
      expect(getTheme(null)).toBe(light)
    })
  })

  describe('getStatusColor', () => {
    it('returns valid colors for valid status', () => {
      const result = getStatusColor('valid', light)
      expect(result.text).toBe('#1f7a3a')
    })

    it('returns expired colors for expired status', () => {
      const result = getStatusColor('expired', light)
      expect(result.text).toBe('#c0392b')
    })

    it('returns expiring colors for expiring_soon status', () => {
      const result = getStatusColor('expiring_soon', light)
      expect(result.text).toBe('#e67e22')
    })

    it('returns warning colors for suspended status', () => {
      const result = getStatusColor('suspended', light)
      expect(result.text).toBe('#f39c12')
    })

    it('handles case-insensitive status', () => {
      const result = getStatusColor('VALID', light)
      expect(result.text).toBe('#1f7a3a')
    })

    it('returns default colors for unknown status', () => {
      const result = getStatusColor('unknown_status', light)
      expect(result.text).toBe(light.text)
    })
  })

  describe('getDaysRemaining', () => {
    it('returns null for null input', () => {
      expect(getDaysRemaining(null)).toBe(null)
    })

    it('returns null for undefined input', () => {
      expect(getDaysRemaining(undefined)).toBe(null)
    })

    it('returns positive days for future date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const result = getDaysRemaining(futureDate.toISOString())
      expect(result).toBeGreaterThanOrEqual(29)
      expect(result).toBeLessThanOrEqual(31)
    })

    it('returns negative days for past date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)
      const result = getDaysRemaining(pastDate.toISOString())
      expect(result).toBeLessThanOrEqual(-9)
      expect(result).toBeGreaterThanOrEqual(-11)
    })

    it('returns 0 for today', () => {
      const today = new Date()
      const result = getDaysRemaining(today.toISOString())
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(1)
    })
  })

  describe('formatDaysRemaining', () => {
    it('returns Unknown for null', () => {
      expect(formatDaysRemaining(null)).toBe('Unknown')
    })

    it('returns Expires today for 0', () => {
      expect(formatDaysRemaining(0)).toBe('Expires today')
    })

    it('returns Expires tomorrow for 1', () => {
      expect(formatDaysRemaining(1)).toBe('Expires tomorrow')
    })

    it('returns days remaining for positive days', () => {
      expect(formatDaysRemaining(30)).toBe('30 days remaining')
    })

    it('returns expired message for negative days', () => {
      expect(formatDaysRemaining(-5)).toBe('Expired 5 days ago')
    })
  })
})
