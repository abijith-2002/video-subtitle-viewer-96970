/**
 * Frontend configuration for API base URL.
 *
 * Reads the backend URL from environment and falls back to a reasonable default for local development.
 * Supports:
 *  - Create React App build-time env: process.env.REACT_APP_BACKEND_URL (injected at build time)
 *  - Optional runtime override: window._BACKEND_URL (set via a script tag before the bundle)
 *  - Default: http://localhost:8000
 *
 * Note:
 * - Directly referencing `process` in the browser can cause "process is not defined" errors in some bundlers.
 *   We therefore guard access via `typeof process !== 'undefined'`.
 */

// Safely read CRA env at build-time if available; guard for browsers where `process` is not defined
function safeReadCraEnv() {
  try {
    // Only attempt if `process` exists and has an env object
    if (typeof process !== 'undefined' && process && typeof process.env !== 'undefined') {
      return process.env.REACT_APP_BACKEND_URL;
    }
  } catch {
    // ignore and fall back
  }
  return undefined;
}

/**
 * Resolve backend base URL with the following priority:
 *  1. process.env.REACT_APP_BACKEND_URL (Create React App build-time)
 *  2. window._BACKEND_URL (optional runtime injection)
 *  3. Default 'http://localhost:8000'
 */
const resolveBackendUrl = () => {
  const fromEnv = safeReadCraEnv();
  const fromWindow = typeof window !== 'undefined' ? window._BACKEND_URL : undefined;

  const raw = fromEnv || fromWindow || 'http://localhost:8000';

  // Ensure no trailing slash to avoid double slashes when constructing paths
  return String(raw).replace(/\/+$/, '');
};

// PUBLIC_INTERFACE
export const BACKEND_URL = resolveBackendUrl();

/**
 * PUBLIC_INTERFACE
 * Returns the currently resolved backend base URL without trailing slash.
 */
export function getBackendUrl() {
  /** Returns the currently resolved backend base URL without trailing slash. */
  return BACKEND_URL;
}
