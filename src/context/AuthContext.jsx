
import { createContext, useContext, useEffect, useState } from "react";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("unmodesty_token");

    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("unmodesty_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const register = async (userData) => {
    const data = await registerUser(userData);
    setUser(data.user);
    return data;
  };

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
