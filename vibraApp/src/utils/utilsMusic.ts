import { type Song, type YouTubeSearchResult,type SmartSearchResponse, MusicGenre } from '../types';

export const youtobeToSong = (song: YouTubeSearchResult): Song => ({
  id: song.id,
  title: song.title,
  artist: song.artist, // Ya viene extraído por el backend desde el título
  youtubeId: song.id,
  duration: song.duration,
  genre: MusicGenre.OTHER,
  viewCount: song.viewCount ?? 0,
  publishedAt: song.publishedAt,
  cloudinaryUrl: "",
  createdAt: song.publishedAt,
  updatedAt: "",
});
/**
 * Normaliza la respuesta de búsqueda smart combinando resultados de BD y YouTube
 * @param results - Respuesta del backend con fromDatabase y fromYoutube
 * @returns Array combinado de canciones
 */
export const normalizeToSong = (results: SmartSearchResponse): Song[] => {
  const fromDB = results.fromDatabase || [];
  const fromYT = (results.fromYoutube || []).map(song => youtobeToSong(song));
  return [...fromDB, ...fromYT];
}