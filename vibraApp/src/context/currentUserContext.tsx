// src/context/UserContext.tsx
import { createContext, useEffect, useState, type ReactNode } from "react";

// Definimos la estructura del usuario (puedes ajustarla según tu backend)
export interface User {
  userId: string;
  email: string;
  username: string;
  // otros campos opcionales...
}

// Definimos qué datos y funciones compartirá el contexto
interface UserContextType {
  user: User | null;
}

// Creamos el contexto, inicialmente sin valor (undefined)
export const UserContext = createContext<UserContextType | undefined>(undefined);

// Props del provider (acepta hijos)
interface UserProviderProps {
  children: ReactNode;
}

// Creamos el provider
export const UserProvider = ({ children }: UserProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
          const controller = new AbortController();
          const loadUser = async () => {
              try {
                  const resp = await fetch('http://localhost:3000/auth/me', {
                      method: 'GET',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      signal: controller.signal,
                  });
  
                  if (!resp.ok) {
                      const text = await resp.text();
                      throw new Error(`HTTP ${resp.status}: ${text}`);
                  }
  
                  const data = await resp.json();
                  // espera que data tenga la forma { sub, email, username }
                  setCurrentUser(data);
              } catch (err: any) {
                  if (err.name === 'AbortError') return;
                  console.error(err);
              }
          };
  
          loadUser();
          return () => controller.abort();
      }, []);

  return (
    <UserContext.Provider value={{ user: currentUser }}>
      {children}
    </UserContext.Provider>
  );
};
