import { API_ENDPOINTS } from "./apiConfig";

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    email_confirmed: boolean;
    created_at: string;
    metadata?: Record<string, any>;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
  };
  message?: string;
}

class AuthAPI {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.SIGN_IN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      return data;
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw new Error(error.message || "Không thể kết nối đến server");
    }
  }

  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.SIGN_UP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, metadata }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      return data;
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw new Error(error.message || "Không thể kết nối đến server");
    }
  }

  async signOut(
    accessToken: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.SIGN_OUT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng xuất thất bại");
      }

      return data;
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw new Error(error.message || "Không thể kết nối đến server");
    }
  }

  async getUser(accessToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.GET_USER, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể lấy thông tin người dùng");
      }

      return data;
    } catch (error: any) {
      console.error("Get user error:", error);
      throw new Error(error.message || "Không thể kết nối đến server");
    }
  }
}

export const authAPI = new AuthAPI();
