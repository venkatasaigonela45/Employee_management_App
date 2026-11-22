export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  username: string;
  role: string;
  employeeId?: number | null;
  expiresInMs: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
