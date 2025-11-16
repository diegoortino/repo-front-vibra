import { useMemo } from 'react';

interface GenreFamily {
  id: string;
  name: string;
  genres: string[];
}

export function useGenres() {
  const genreFamilies: GenreFamily[] = useMemo(() => [
    { id: 'metal', name: 'Metal', genres: ['heavyMetal', 'heavyMetalArgentino', 'heavyMetalLatino', 'deathMetal', 'thrashMetal', 'blackMetal', 'industrialMetal'] },
    { id: 'rock', name: 'Rock', genres: ['rock', 'rockArgentino', 'rockLatino', 'alternativeRock', 'indieRock', 'softRock', 'glamRock', 'bluesRock', 'grunge', 'progressiveRock'] },
    { id: 'cumbia', name: 'Cumbia', genres: ['cumbia', 'cumbiaVillera', 'cumbia420', 'cuarteto'] },
    { id: 'latin', name: 'Latin', genres: ['bachata', 'merengue', 'tango', 'vallenato', 'sertanejo'] },
    { id: 'urban', name: 'Urban', genres: ['trap', 'trapArgentino', 'hiphop', 'rap', 'drill', 'reggaeton', 'dembow', 'urbanoLatino', 'funkRap'] },
    { id: 'electronic', name: 'Electronic', genres: ['edmActual', 'house', 'trance', 'electronicaArgentina'] },
    { id: 'pop', name: 'Pop', genres: ['pop', 'popLatinoActual', 'popLatinoClasico', 'popPunk', 'hyperpop', 'kpop', 'jpop'] },
    { id: 'punk', name: 'Punk', genres: ['punk', 'popPunk'] },
    { id: 'folk', name: 'Folk & Country', genres: ['folkloreArgentino', 'folkloreColombia', 'country', 'bluegrass', 'autoresCompositores'] },
    { id: 'latin_traditional', name: 'Regional Mexicano', genres: ['ranchera', 'corrido', 'corridosTumbados'] },
    { id: 'afro_caribbean', name: 'Afro/Caribe', genres: ['reggae', 'dancehall', 'musicaBrasilera'] },
    { id: 'soul_funk', name: 'Soul/Funk', genres: ['soul', 'rb', 'disco'] },
    { id: 'alternative', name: 'Alternative/Indie', genres: ['alternativeRock', 'indieRock', 'latinIndie'] },
    { id: 'chill', name: 'Chill', genres: ['blues', 'balada', 'instrumental'] }
  ], []);

  const allIndividualGenres = useMemo(() => {
    return genreFamilies
      .flatMap(family => family.genres)
      .sort((a, b) => a.localeCompare(b));
  }, [genreFamilies]);

  return {
    genreFamilies,
    allIndividualGenres
  };
}
