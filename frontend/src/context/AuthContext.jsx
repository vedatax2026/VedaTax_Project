import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) { setReady(true); return; }
    api.me()
      .then(setUser)
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  const handleAuth = useCallback((res) => {
    tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback((email, password) => api.login({ email, password }).then(handleAuth), [handleAuth]);
  const register = useCallback((payload) => api.register(payload).then(handleAuth), [handleAuth]);
  const logout = useCallback(() => { tokenStore.set(null); setUser(null); }, []);

  const updateUser = useCallback((patch) => setUser((u) => (u ? { ...u, ...patch } : u)), []);

  const value = useMemo(() => ({ user, ready, login, register, logout, updateUser }),
    [user, ready, login, register, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
