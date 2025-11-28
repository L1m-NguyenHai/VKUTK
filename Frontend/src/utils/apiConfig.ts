// Global API configuration
const API_ENDPOINT_KEY = "vku_api_endpoint";

// Detect if running on Android (Tauri mobile or browser)
const detectAndroid = (): boolean => {
  if (typeof navigator === "undefined") return false;

  // Check userAgent for Android
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return true;

  // Check if Tauri is available and we're on mobile
  // @ts-expect-error - Tauri's __TAURI__ may exist at runtime
  if (typeof window !== "undefined" && window.__TAURI__) {
    // Additional check for Tauri mobile
    const isTauriMobile = ua.includes("mobile") || ua.includes("wv");
    if (isTauriMobile) return true;
  }

  return false;
};

// For Android emulator: 10.0.2.2 points to host machine's localhost
// For physical Android device: use your computer's local IP or ngrok URL
const isAndroid = detectAndroid();
const DEFAULT_API_ENDPOINT = isAndroid
  ? "http://10.0.2.2:8000" // Android emulator -> host machine
  : "http://localhost:8000";

// Log for debugging
if (typeof console !== "undefined") {
  console.log("[apiConfig] Platform detection:", {
    isAndroid,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
    defaultEndpoint: DEFAULT_API_ENDPOINT,
  });
}

// Global variable for API endpoint
declare global {
  interface Window {
    VKU_API_ENDPOINT: string;
  }
}

export const getApiEndpoint = (): string => {
  if (typeof window !== "undefined") {
    // Check global variable first
    if (window.VKU_API_ENDPOINT) {
      return window.VKU_API_ENDPOINT;
    }
    // Then check localStorage
    const stored = localStorage.getItem(API_ENDPOINT_KEY);
    if (stored) {
      window.VKU_API_ENDPOINT = stored;
      return stored;
    }
  }
  return DEFAULT_API_ENDPOINT;
};

export const setApiEndpoint = (endpoint: string): void => {
  const cleanedEndpoint = endpoint.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") {
    window.VKU_API_ENDPOINT = cleanedEndpoint;
    localStorage.setItem(API_ENDPOINT_KEY, cleanedEndpoint);
  }
};

export const resetApiEndpoint = (): void => {
  if (typeof window !== "undefined") {
    window.VKU_API_ENDPOINT = DEFAULT_API_ENDPOINT;
    localStorage.setItem(API_ENDPOINT_KEY, DEFAULT_API_ENDPOINT);
  }
};

// Default headers for all API calls (includes ngrok bypass)
export const getApiHeaders = (): Record<string, string> => {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
};

// Fetch wrapper with automatic headers
export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const endpoint = getApiEndpoint();
  const url = `${endpoint}${path.startsWith("/") ? path : "/" + path}`;

  const headers = {
    ...getApiHeaders(),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

export const API_CONFIG = {
  DEFAULT_ENDPOINT: DEFAULT_API_ENDPOINT,
  STORAGE_KEY: API_ENDPOINT_KEY,
};
