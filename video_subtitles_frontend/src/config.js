//
// Frontend configuration for API base URL
//
// Reads the backend URL from environment (REACT_APP_BACKEND_URL) and
// falls back to a reasonable default for local development.
// No sensitive info is hardcoded; use .env to override in deployment.
//
// Usage:
//   import { BACKEND_URL } from './config';
//   fetch(`${BACKEND_URL}/videos`)
//

/**
 * Resolve backend base URL.
 * Priority:
 *  1. process.env.REACT_APP_BACKEND_URL (create-react-app env)
 *  2. window._BACKEND_URL (optional runtime injection)
 *  3. Default 'http://localhost:8000'
 */
const resolveBackendUrl = () => {
  // CRA exposes REACT_APP_* at build time
  const fromEnv = process?.env?.REACT_APP_BACKEND_URL;
  // Optional: allow runtime override (e.g., via <script> injection)
  const fromWindow = typeof window !== 'undefined' ? window._BACKEND_URL : undefined;

  const raw = fromEnv || fromWindow || 'http://localhost:8000';

  // Ensure no trailing slash to avoid double slashes when constructing paths
  return String(raw).replace(/\/+$/, '');
};

// PUBLIC_INTERFACE
export const BACKEND_URL = resolveBackendUrl();

// PUBLIC_INTERFACE
export function getBackendUrl() {
  /** Returns the currently resolved backend base URL without trailing slash. */
  return BACKEND_URL;
}
