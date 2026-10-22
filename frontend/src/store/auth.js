import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("brandguard_token");
    if (savedToken) {
      setToken(savedToken);
      api
        .getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem("brandguard_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem("brandguard_token", res.access_token);
    setToken(res.access_token);
    const me = await api.getMe();
    setUser(me);
    return me;
  };

  const register = async (data) => {
    const res = await api.register(data);
    localStorage.setItem("brandguard_token", res.access_token);
    setToken(res.access_token);
    const me = await api.getMe();
    setUser(me);
    return me;
  };

  const logout = () => {
    localStorage.removeItem("brandguard_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const switchRole = async (newRole) => {
    if (!user) return;
    try {
      const updated = await api.updateSettings({ role: newRole });
      setUser(updated);
    } catch (err) {
      console.error("Failed to switch role:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchRole,
        refreshUser: () => api.getMe().then(setUser),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
