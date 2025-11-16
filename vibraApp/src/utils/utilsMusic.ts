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

/**
 * Formatea un género de camelCase a formato legible
 * @param genre - Género en camelCase (ej: "popLatinoActual")
 * @returns Género formateado (ej: "Pop Latino Actual")
 */
export const formatGenre = (genre: string | null | undefined): string => {
  if (!genre) return 'Sin género';

  // Casos especiales
  const specialCases: Record<string, string> = {
    'sinCategoria': 'Sin Categoría',
    'rb': 'R&B',
    'jpop': 'J-Pop',
    'kpop': 'K-Pop',
    'edmActual': 'EDM Actual',
    'pop90s': 'Pop 90s',
  };

  // Verificar si es un caso especial
  if (specialCases[genre]) {
    return specialCases[genre];
  }

  // Convertir camelCase a palabras separadas
  // Ejemplo: "popLatinoActual" -> "Pop Latino Actual"
  return genre
    .replace(/([A-Z])/g, ' $1') // Agregar espacio antes de mayúsculas
    .replace(/^./, str => str.toUpperCase()) // Capitalizar primera letra
    .trim();
}

/**
 * Formatea un nombre de artista de camelCase a formato legible
 * @param artist - Artista en camelCase (ej: "luisFonsi", "acDc")
 * @returns Artista formateado (ej: "Luis Fonsi", "AC/DC")
 */
export const formatArtist = (artist: string | null | undefined): string => {
  if (!artist) return '';

  // Casos especiales conocidos (para artistas con formatos únicos)
  const specialCases: Record<string, string> = {
    'acDc': 'AC/DC',
    'acdc': 'AC/DC',
    '2pac': '2Pac',
    '50Cent': '50 Cent',
    'theRollingStones': 'The Rolling Stones',
    'theBeatles': 'The Beatles',
    'theWho': 'The Who',
    'theDoors': 'The Doors',
    'thePolice': 'The Police',
    'theKinks': 'The Kinks',
    'theCure': 'The Cure',
    'theClash': 'The Clash',
    'pinkFloyd': 'Pink Floyd',
    'ledZeppelin': 'Led Zeppelin',
    'blackSabbath': 'Black Sabbath',
    'ironMaiden': 'Iron Maiden',
    'gunsnRoses': 'Guns N\' Roses',
    'nWa': 'N.W.A',
    'runDmc': 'Run-DMC',
    'llCoolJ': 'LL Cool J',
    'aHa': 'A-ha',
    'bts': 'BTS',
    'exo': 'EXO',
  };

  // Verificar si es un caso especial
  const lowerArtist = artist.toLowerCase();
  for (const [key, value] of Object.entries(specialCases)) {
    if (lowerArtist === key.toLowerCase()) {
      return value;
    }
  }

  // Convertir camelCase a Title Case
  // "luisFonsi" -> "Luis Fonsi"
  // "theRollingStones" -> "The Rolling Stones"

  // Si el artista tiene mayúsculas, usar el formato normal
  if (/[A-Z]/.test(artist)) {
    return artist
      .replace(/([A-Z])/g, ' $1') // Agregar espacio antes de mayúsculas
      .replace(/^./, str => str.toUpperCase()) // Capitalizar primera letra
      .trim();
  }

  // Si está todo en minúsculas (mal normalizado), intentar separar palabras conocidas
  // "arcticmonkeys" -> "Arctic Monkeys"
  // "depechemode" -> "Depeche Mode"

  // Diccionario de palabras comunes en nombres de bandas (en minúsculas)
  const commonWords = [
    'the', 'and', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'from',
    'arctic', 'monkeys', 'depeche', 'mode', 'red', 'hot', 'chili', 'peppers',
    'rolling', 'stones', 'pink', 'floyd', 'led', 'zeppelin', 'black', 'sabbath',
    'iron', 'maiden', 'guns', 'roses', 'nirvana', 'metallica', 'beatles',
    'doors', 'who', 'clash', 'cure', 'smiths', 'oasis', 'blur', 'radiohead',
    'coldplay', 'muse', 'foo', 'fighters', 'pearl', 'jam', 'soundgarden',
    'alice', 'chains', 'stone', 'temple', 'pilots', 'rage', 'against', 'machine',
    'system', 'down', 'linkin', 'park', 'green', 'day', 'blink', 'offspring',
    'los', 'cadetes', 'de', 'linares', 'del', 'norte', 'huracanes', 'diablitos',
    'hermanos', 'banda', 'grupo', 'conjunto'
  ];

  let result = artist.toLowerCase();

  // Intentar separar palabras conocidas
  for (const word of commonWords) {
    const regex = new RegExp(word, 'g');
    result = result.replace(regex, ` ${word} `);
  }

  // Limpiar espacios múltiples y capitalizar cada palabra
  result = result
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Si no se separó nada (no había palabras conocidas), solo capitalizar la primera letra
  if (result === artist.charAt(0).toUpperCase() + artist.slice(1).toLowerCase()) {
    return artist.charAt(0).toUpperCase() + artist.slice(1);
  }

  return result;
}

/**
 * Formatea un título de canción (actualmente sin transformación especial)
 * @param title - Título de la canción
 * @returns Título formateado
 */
export const formatTitle = (title: string | null | undefined): string => {
  if (!title) return '';
  // Por ahora los títulos se guardan ya limpios en la DB
  // Esta función existe por si en el futuro necesitamos formateo adicional
  return title.trim();
}