import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    setUser(data.user);
    return data.user;
  }, []);

  // Two-step signup: register() only sends the OTP email - no account exists
  // yet. verifyRegistrationOtp() is what actually creates the user and logs
  // them in.
  const register = useCallback(async (payload) => {
    return authApi.register(payload);
  }, []);

  const verifyRegistrationOtp = useCallback(async (email, otp) => {
    const data = await authApi.verifyRegistrationOtp({ email, otp });
    setUser(data.user);
    return data.user;
  }, []);

  const resendRegistrationOtp = useCallback(async (email) => {
    return authApi.resendRegistrationOtp({ email });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyRegistrationOtp, resendRegistrationOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
