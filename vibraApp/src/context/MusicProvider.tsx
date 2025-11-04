// src/context/MusicProvider.tsx
import type { ReactNode } from "react";
import { MusicProvider as BaseProvider, type Track } from "./MusicContext";


export default function MusicProvider({ children }: { children: ReactNode }) {
  return (
    <BaseProvider>
      {children}
    </BaseProvider>
  );
}
