import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Définir les types pour plus de sécurité
type Role = 'admin' | 'manager' | 'directeur' | 'backoffice' | 'commercial';

interface User {
  id: string;
  name: string;
  role: Role;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Simule une connexion. Dans une vraie app, ça appellerait une API.
  const login = (role: Role) => {
    const userData: User = { 
        id: '31590edb-714a-4442-a907-5661e04f83ae', // Alice Martin's ID from seed
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`, 
        role 
    };
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const value = { user, isAuthenticated: !!user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personnalisé pour utiliser le contexte facilement
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};