import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { AuthUser } from '@workspace/api-client-react';

// Extend AuthUser to include employeeId (returned by login but not in generated schema)
export type ExtendedAuthUser = AuthUser & { employeeId?: number | null };

interface AuthContextType {
  user: ExtendedAuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (user: ExtendedAuthUser, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export function useAuthState(): AuthContextType {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<ExtendedAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error('Failed to parse user from localStorage');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newUser: ExtendedAuthUser, newToken: string) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', newToken);
    setUser(newUser);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setLocation('/login');
  }, [setLocation]);

  return { user, token, isLoading, login, logout };
}
