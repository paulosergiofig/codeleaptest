import React, { createContext, useContext, useState } from 'react';

// Criar o contexto
const AuthContext = createContext(null);

// Componente Provider
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simular inicialização do Firebase Auth
  useEffect(() => {
    // Implementação simplificada
    setLoading(false);
  }, []);

  // Funções de autenticação simplificadas
  const login = (email, password) => {
    // Implementação simulada
    return Promise.resolve();
  };

  const register = (email, password) => {
    // Implementação simulada
    return Promise.resolve();
  };
  
  const logout = () => {
    // Implementação simulada
    return Promise.resolve();
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
