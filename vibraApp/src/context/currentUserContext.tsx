// src/context/UserContext.tsx
import { createContext, useEffect, useState, type ReactNode } from "react";

// Estructura del usuario
export interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
  privacy: "public" | "private" | "followers" | "followed" | "mutuals";
  following:number;
  followers:number
}

// Qué datos y funciones compartirá el contexto
interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// Creamos el contexto
export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

// Provider del usuario
export const UserProvider = ({ children }: UserProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadUser = async () => {
      try {
        const resp = await fetch("http://localhost:3000/auth/me", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${text}`);
        }

        const data = await resp.json();
        console.log("Current user data:", JSON.stringify(data, null, 2));
        setCurrentUser(data);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error(err);
      }
    };

    loadUser();
    return () => controller.abort();
  }, []);

  return (
    <UserContext.Provider value={{ user: currentUser, setUser: setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};
