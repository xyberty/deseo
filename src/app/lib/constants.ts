export const APP_NAME = "Deseo";
export const APP_VERSION = "0.8.0-alpha.5";
export const GITHUB_URL = "https://github.com/xyberty/deseo";
export const BASE_URL = "https://example.com";

/**
 * Get the base URL for the application.
 * Works on both server and client side.
 * 
 * Priority:
 * 1. NEXT_PUBLIC_BASE_URL environment variable
 * 2. window.location.origin (client-side only)
 * 3. BASE_URL constant (fallback)
 */
export function getBaseUrl(): string {
  // Server-side: use env var or fallback to constant
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_URL || BASE_URL;
  }
  
  // Client-side: prefer window.location.origin, then env var, then constant
  return window.location.origin || process.env.NEXT_PUBLIC_BASE_URL || BASE_URL;
}

/**
 * Get the base URL for server-side usage only.
 * Does not use window.location.origin (which is undefined on server).
 */
export function getServerBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || BASE_URL;
}

