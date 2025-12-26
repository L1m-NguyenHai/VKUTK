import { Platform } from "react-native";

// API Configuration
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://10.0.2.2:8000";
    } else if (Platform.OS === "web") {
      return "http://localhost:8000";
    } else {
      return "http://localhost:8000"; // iOS
    }
  }
  return "https://your-production-api.com";
};

export const API_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SIGN_IN: `${API_BASE_URL}/api/auth/signin`,
    SIGN_UP: `${API_BASE_URL}/api/auth/signup`,
    SIGN_OUT: `${API_BASE_URL}/api/auth/signout`,
    GET_USER: `${API_BASE_URL}/api/auth/user`,
  },
  CHAT: {
    SEND: `${API_BASE_URL}/api/plugins/chat/send`,
  },

  // Other endpoints can be added here
  STUDENTS: `${API_BASE_URL}/api/students`,
  GRADES: `${API_BASE_URL}/api/grades`,
  SCHEDULE: `${API_BASE_URL}/api/schedule`,
  PROGRESS: `${API_BASE_URL}/api/students`, // Will append /{studentId}/tien-do-hoc-tap
};

export const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export default API_BASE_URL;
