/**
 * Error mapping helpers for user-friendly error messages
 */

export interface AppError {
  code: string
  message: string
  userMessage: string
  retryable: boolean
}

const ERROR_MESSAGES: Record<string, { message: string; retryable: boolean }> = {
  // Network errors
  NETWORK_ERROR: {
    message: 'Unable to connect. Please check your internet connection.',
    retryable: true,
  },
  TIMEOUT_ERROR: {
    message: 'Request timed out. Please try again.',
    retryable: true,
  },

  // Auth errors
  AUTH_INVALID_CREDENTIALS: {
    message: 'Invalid username or password. Please try again.',
    retryable: false,
  },
  AUTH_SESSION_EXPIRED: {
    message: 'Your session has expired. Please sign in again.',
    retryable: false,
  },
  AUTH_UNAUTHORIZED: {
    message: 'You are not authorized to perform this action.',
    retryable: false,
  },

  // Vehicle errors
  VEHICLE_NOT_FOUND: {
    message: 'Vehicle not found. Please check the code and try again.',
    retryable: false,
  },
  VEHICLE_INVALID_CODE: {
    message: 'Invalid vehicle code format.',
    retryable: false,
  },

  // Server errors
  SERVER_ERROR: {
    message: 'Something went wrong on our end. Please try again later.',
    retryable: true,
  },
  SERVICE_UNAVAILABLE: {
    message: 'Service temporarily unavailable. Please try again later.',
    retryable: true,
  },

  // Generic
  UNKNOWN_ERROR: {
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
  },
}

/**
 * Map an error from API or network to a user-friendly error object
 */
export function mapError(error: any): AppError {
  // Handle axios errors
  if (error?.isAxiosError || error?.response) {
    const status = error.response?.status
    const serverCode = error.response?.data?.code
    const serverMessage =
      error.response?.data?.message ??
      error.response?.data?.detail

    // First check for server-provided error code
    if (serverCode && ERROR_MESSAGES[serverCode]) {
      return {
        code: serverCode,
        message: serverMessage || ERROR_MESSAGES[serverCode].message,
        userMessage: ERROR_MESSAGES[serverCode].message,
        retryable: ERROR_MESSAGES[serverCode].retryable,
      }
    }

    // Map by HTTP status code
    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: serverMessage || 'Invalid request',
          userMessage: serverMessage || 'The request could not be processed. Please check your input.',
          retryable: false,
        }
      case 401:
        if (serverMessage && String(serverMessage).toLowerCase().includes('invalid credentials')) {
          return {
            code: 'AUTH_INVALID_CREDENTIALS',
            message: String(serverMessage),
            userMessage: ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS.message,
            retryable: ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS.retryable,
          }
        }
        return {
          code: 'AUTH_UNAUTHORIZED',
          message: serverMessage || 'Unauthorized',
          userMessage: ERROR_MESSAGES.AUTH_UNAUTHORIZED.message,
          retryable: false,
        }
      case 403:
        return {
          code: 'AUTH_FORBIDDEN',
          message: serverMessage || 'Forbidden',
          userMessage: 'You do not have permission to access this resource.',
          retryable: false,
        }
      case 404:
        return {
          code: 'NOT_FOUND',
          message: serverMessage || 'Not found',
          userMessage: serverMessage || 'The requested resource was not found.',
          retryable: false,
        }
      case 429:
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          userMessage: 'Too many requests. Please wait a moment and try again.',
          retryable: true,
        }
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVER_ERROR',
          message: serverMessage || 'Server error',
          userMessage: ERROR_MESSAGES.SERVER_ERROR.message,
          retryable: true,
        }
      default:
        // Network error (no response)
        if (!error.response && error.request) {
          return {
            code: 'NETWORK_ERROR',
            message: 'Network error',
            userMessage: ERROR_MESSAGES.NETWORK_ERROR.message,
            retryable: true,
          }
        }
    }
  }

  // Handle timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      code: 'TIMEOUT_ERROR',
      message: 'Request timeout',
      userMessage: ERROR_MESSAGES.TIMEOUT_ERROR.message,
      retryable: true,
    }
  }

  // Handle network errors
  if (error?.message?.includes('Network') || error?.message?.includes('network')) {
    return {
      code: 'NETWORK_ERROR',
      message: error.message,
      userMessage: ERROR_MESSAGES.NETWORK_ERROR.message,
      retryable: true,
    }
  }

  // Generic fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || 'Unknown error',
    userMessage: ERROR_MESSAGES.UNKNOWN_ERROR.message,
    retryable: true,
  }
}

/**
 * Get a user-friendly message for display
 */
export function getUserMessage(error: any): string {
  return mapError(error).userMessage
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: any): boolean {
  return mapError(error).retryable
}
