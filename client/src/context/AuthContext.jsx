import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('quickbite_token');
    if (!token) {
      setReady(true);
      return;
    }
    api('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('quickbite_token'))
      .finally(() => setReady(true));
  }, []);

  async function signIn(credentials, mode) {
    const result = await api(`/auth/${mode}`, { method: 'POST', body: credentials });
    localStorage.setItem('quickbite_token', result.token);
    setUser(result.user);
    return result.user;
  }

  function signOut() {
    localStorage.removeItem('quickbite_token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);