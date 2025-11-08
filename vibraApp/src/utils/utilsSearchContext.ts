import { useState } from "react";

import { normalizeToSong } from './utilsMusic';
/* types */
import type { Song } from "../types";
import type {SearchProps} from "../types/searchProps";
import type {ResultProps} from "../types/resultProps";
import type {ReproduceProps} from "../types/reproduceProps";

/* hooks */
import { useMusicContext } from "../context/MusicContext";
import { useMusic}         from "../hooks";

const dataToSearch_0: Song[] = [{
    id: "",                   // UUID generado por la base de datos
    title: "",                // Título de la canción
    artist: "",               // Nombre del artista
    youtubeId: "",            // ID del video de YouTube
    duration: 0,              // Duración en segundos
    genre: "",               // Género musical (opcional)
    viewCount: 0,            // Número de reproducciones (opcional)
    publishedAt: "",         // Fecha de publicación (opcional)
    cloudinaryUrl: "",       // URL del audio en Cloudinary
    createdAt: "",           // Fecha de creación en BD
    updatedAt: ""            // Fecha de última actualización
  }];


// export const dataToSearch = (key: SearchProps) => {
//     // Obtener URL del backend desde variable de entorno o usar localhost por defecto
//     const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

//     // Usar search-smart: busca en BD + YouTube, auto-guarda resultados
//     fetch(apiUrl + "/music/search-smart?query=" + encodeURIComponent(key.search) + "&maxResults=20")
//       .then(response => response.json())
//       .then(data => {
//         // search-smart devuelve: { fromDatabase: [], fromYoutube: [], source: string, total: number }
//         if (data.fromDatabase || data.fromYoutube) {
//           // Combinar resultados de BD y YouTube
//           const allSongs = [
//             ...(data.fromDatabase || []),
//             ...(data.fromYoutube || [])
//           ];

//           // Mapear los datos al formato que espera el frontend
//           const mappedData: ResultProps[] = allSongs.map((song: any) => ({
//             id: song.id || song.youtubeId, // BD usa 'id' (UUID), YouTube usa 'id' (videoId)
//             title: song.title,
//             artist: song.artist,
//             duration: song.duration?.toString() || "0",
//             plays: song.viewCount?.toString() || song.plays?.toString() || "0",
//             youtubeId: song.youtubeId || song.id, // BD tiene 'youtubeId', YouTube solo tiene 'id'
//             cloudinaryUrl: song.cloudinaryUrl || null, // Solo las de BD tienen MP3
//             source: (song.cloudinaryUrl ? 'database' : 'youtube') as 'database' | 'youtube' // Para distinguir en el frontend
//           }));

//           setDataFromSearch(mappedData);
//         } else {
//           // Respuesta inesperada
//           setDataFromSearch([]);
//         }
//       })
//       .catch(() => {
//         setDataFromSearch([]);
//       });
//   };



  export const UtoSearch = async(key: SearchProps,toResoult:(key:ResultProps[])=>void) => {
  // Searchs by DB (canciones con Cloudinary ) and youtobe, return a state in case of...
    const music = useMusic();
    music.reset();
    const data= await music.searchSmart("?generic=" + encodeURIComponent(key.search) + "&limit=20");
    try {
      // Verificar si es un array (éxito) o un objeto con error
      if (music.error==null && music.totalCount>0) {
        console.log('📥 Datos recibidos del backend:', data);
        // Mapear los datos del backend al formato que espera el frontend
        const mappedData:ResultProps[] = normalizeToSong(data);
        console.log('✅ Datos mapeados para frontend:', mappedData);
        toResoult(mappedData);
      } else {
        // Es un error del backend
        console.log('❌ Error del backend:', music.error);
        toResoult(dataToSearch_0);
      }
    } catch (error) {
      console.log('❌ Error fetching data searchSmart:', error);
      toResoult(dataToSearch_0);
    }
  };

  
  export const UtoResoult = (key: ResultProps | ResultProps[],toResoult:(key:ResultProps[])=>void) => {
    if (Array.isArray(key)) {
      toResoult(key);
    } else {
      toResoult([key]);
    }
  };

  export const UtoReproduce = (key: ReproduceProps) => {
    // Conectar con el MusicPlayer real
    const {playSong}= useMusicContext();
    if (playSong && key.id) {
      // Necesitamos convertir el resultado de búsqueda a tipo Song
      const song = dataFromSearch.find(s => s.id === key.id);
      if (song) {
        // Mapear de ResultProps a Song con TODOS los campos necesarios
        playSong(song);
      }
    }
  };