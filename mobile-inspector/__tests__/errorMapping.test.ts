import { mapError, getUserMessage, isRetryable } from '../src/lib/errorMapping'

describe('errorMapping', () => {
  describe('mapError', () => {
    it('maps network error', () => {
      const error = { message: 'Network Error', isAxiosError: true, request: {} }
      const result = mapError(error)
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.retryable).toBe(true)
    })

    it('maps 401 unauthorized', () => {
      const error = { 
        response: { status: 401 }, 
        isAxiosError: true 
      }
      const result = mapError(error)
      expect(result.code).toBe('AUTH_UNAUTHORIZED')
      expect(result.retryable).toBe(false)
    })

    it('maps 404 not found', () => {
      const error = { 
        response: { status: 404, data: { message: 'Vehicle not found' } }, 
        isAxiosError: true 
      }
      const result = mapError(error)
      expect(result.code).toBe('NOT_FOUND')
      expect(result.retryable).toBe(false)
    })

    it('maps 500 server error', () => {
      const error = { 
        response: { status: 500 }, 
        isAxiosError: true 
      }
      const result = mapError(error)
      expect(result.code).toBe('SERVER_ERROR')
      expect(result.retryable).toBe(true)
    })

    it('maps 429 rate limited', () => {
      const error = { 
        response: { status: 429 }, 
        isAxiosError: true 
      }
      const result = mapError(error)
      expect(result.code).toBe('RATE_LIMITED')
      expect(result.retryable).toBe(true)
    })

    it('maps timeout error', () => {
      const error = { code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' }
      const result = mapError(error)
      expect(result.code).toBe('TIMEOUT_ERROR')
      expect(result.retryable).toBe(true)
    })

    it('uses server error code if provided', () => {
      const error = { 
        response: { 
          status: 400, 
          data: { code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' } 
        }, 
        isAxiosError: true 
      }
      const result = mapError(error)
      expect(result.code).toBe('VEHICLE_NOT_FOUND')
    })

    it('handles unknown errors', () => {
      const error = { someField: 'value' }
      const result = mapError(error)
      expect(result.code).toBe('UNKNOWN_ERROR')
      expect(result.retryable).toBe(true)
    })
  })

  describe('getUserMessage', () => {
    it('returns user-friendly message', () => {
      const error = { message: 'Network Error', isAxiosError: true, request: {} }
      const message = getUserMessage(error)
      expect(message).toBe('Unable to connect. Please check your internet connection.')
    })
  })

  describe('isRetryable', () => {
    it('returns true for network errors', () => {
      const error = { message: 'Network Error', isAxiosError: true, request: {} }
      expect(isRetryable(error)).toBe(true)
    })

    it('returns false for auth errors', () => {
      const error = { response: { status: 401 }, isAxiosError: true }
      expect(isRetryable(error)).toBe(false)
    })
  })
})
