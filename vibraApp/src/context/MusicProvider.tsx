// src/context/MusicProvider.tsx
import type { ReactNode } from "react";
import { MusicProvider as BaseProvider, type Track } from "./MusicContext";

const seedSongs: Track[] = [
  { youtubeId: "dQw4w9WgXcQ", title: "Track Demo 1" },
  { youtubeId: "kxopViU98Xo", title: "Track Demo 2" },
  { youtubeId: "3JZ_D3ELwOQ", title: "Track Demo 3" },
];

const seedImages = [
  "https://picsum.photos/seed/vibra1/512/512",
  "https://picsum.photos/seed/vibra2/512/512",
  "https://picsum.photos/seed/vibra3/512/512",
];

export default function MusicProvider({ children }: { children: ReactNode }) {
  return (
    <BaseProvider
      playlistName="Demo"
      songs={seedSongs}
      images={seedImages}
      startIndex={0}
    >
      {children}
    </BaseProvider>
  );
}
