// src/contexts/AuthContext.tsx

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Définir les types pour plus de sécurité
type Role = 'admin' | 'manager' | 'directeur' | 'backoffice' | 'commercial';

interface User {
  id: string;
  name: string;
  nom?: string;
  role: Role;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void; // MODIFIÉ: Accepte un objet User
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // MODIFIÉ: La fonction de login met à jour avec l'objet utilisateur complet
  const login = (userData: User) => {
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