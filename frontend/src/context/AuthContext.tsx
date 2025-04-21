"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, LoginCredentials } from "../types/user";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from "../lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const loggedInUser = await apiLogin(credentials);
      setUser(loggedInUser);
      router.push("/");
    } catch (error) {
      throw error;
    }
  };

  const register = async (credentials: LoginCredentials) => {
    try {
      const registeredUser = await apiRegister(credentials);
      setUser(registeredUser);
      router.push("/");
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
