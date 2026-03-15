/**
 * modules/errorMapper.js
 * Maps technical API errors to friendly user-facing messages.
 */

export const ErrorType = {
  BILLING: 'billing',
  UNAUTHORIZED: 'unauthorized',
  QUOTA: 'quota',
  RATE_LIMIT: 'rate_limit',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
};

/**
 * Categorizes an error and provides a friendly message.
 * @param {Error|string|Object} error - The caught error
 * @returns {{ message: string, type: string, action: 'settings'|'retry'|'none' }}
 */
export function mapError(error) {
  const msg = (error?.message || String(error)).toLowerCase();
  
  // 1. Billing / Payment
  if (msg.includes('billing') || msg.includes('payment')) {
    return {
      type: ErrorType.BILLING,
      message: 'The AI service is not available right now because billing appears to be disabled on the connected API project.',
      action: 'settings'
    };
  }

  // 2. Unauthorized / Invalid Key
  if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('401') || msg.includes('403')) {
    return {
      type: ErrorType.UNAUTHORIZED,
      message: 'The API key appears to be missing or invalid. Please check your extension settings.',
      action: 'settings'
    };
  }

  // 3. Quota / Request Limit
  if (msg.includes('quota') || msg.includes('limit') && msg.includes('reached')) {
    return {
      type: ErrorType.QUOTA,
      message: 'The AI request limit has been reached for this API project. Please try again later or check your quota.',
      action: 'retry'
    };
  }

  // 4. Rate Limit
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: 'Too many requests were sent in a short time. Please wait a moment and try again.',
      action: 'retry'
    };
  }

  // 5. Network / Reachability
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('cannot reach')) {
    return {
      type: ErrorType.NETWORK,
      message: 'The app could not reach the AI service. Please check your internet connection and try again.',
      action: 'retry'
    };
  }

  // 6. Timeout
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('took too long')) {
    return {
      type: ErrorType.TIMEOUT,
      message: 'The AI service took too long to respond. Please try again.',
      action: 'retry'
    };
  }

  // 7. Unknown / Fallback
  return {
    type: ErrorType.UNKNOWN,
    message: 'Something went wrong while contacting the AI service.',
    action: 'retry'
  };
}
