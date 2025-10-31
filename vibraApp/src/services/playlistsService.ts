import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configurar axios para incluir el token automáticamente
axios.interceptors.request.use((config) => {
  config.withCredentials= true
  return config;
}, (error) => {
  return Promise.reject(error);
});

export interface Playlist {
  id: string;
  name: string;
  coverUrl?: string;
  genre?: string;
  songCount?: number;
  duration?: number;
  isPublic: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  playlistSongs?: Array<{
    song: {
      id: string;
      title: string;
      artist: string;
      youtubeId?: string;
    };
  }>;
}

export interface PlaylistWithSongs extends Playlist {
  songs: any[];
}

export const playlistsService = {
  async getAllPlaylists(): Promise<Playlist[]> {
    const response = await axios.get(`${API_URL}/playlists`);
    return response.data;
  },

  async getPlaylistById(id: string): Promise<PlaylistWithSongs> {
    const response = await axios.get(`${API_URL}/playlists/${id}?includeSongs=true`);
    const data = response.data;

    // Transform playlistSongs to songs array
    if (data.playlistSongs && Array.isArray(data.playlistSongs)) {
      data.songs = data.playlistSongs.map((ps: any) => ps.song);
    }

    return data;
  },

  async updatePlaylist(id: string, name: string, songIds: string[]): Promise<Playlist> {
    // Paso 1: Actualizar el nombre de la playlist
    await axios.put(`${API_URL}/playlists/${id}`, {
      name
    });

    // Paso 2: Obtener playlist actual con relaciones playlistSongs
    const response = await axios.get(`${API_URL}/playlists/${id}?includeSongs=true`);
    const currentPlaylist = response.data;

    // Paso 3: Eliminar todas las canciones actuales usando el ID de playlistSongs
    if (currentPlaylist.playlistSongs && currentPlaylist.playlistSongs.length > 0) {
      for (const playlistSong of currentPlaylist.playlistSongs) {
        await axios.delete(`${API_URL}/playlists/${id}/songs/${playlistSong.songId}`);
      }
    }

    // Paso 4: Agregar las nuevas canciones
    for (const songId of songIds) {
      await axios.post(`${API_URL}/playlists/${id}/songs`, {
        songId
      });
    }

    // Paso 5: Obtener la playlist actualizada
    const updatedPlaylist = await this.getPlaylistById(id);
    return updatedPlaylist;
  },

  async regeneratePlaylist(id: string): Promise<Playlist> {
    const response = await axios.patch(`${API_URL}/playlists/${id}/regenerate`);
    return response.data;
  },

  async createPlaylist(name: string, songIds: string[], userId?: string): Promise<Playlist> {
    // Paso 1: Crear la playlist vacía
    const url = userId
      ? `${API_URL}/playlists?userId=${userId}`
      : `${API_URL}/playlists`;

    const createResponse = await axios.post(url, {
      name,
      isPublic: false
    });

    const playlist = createResponse.data;

    // Paso 2: Agregar las canciones una por una
    for (const songId of songIds) {
      await axios.post(`${API_URL}/playlists/${playlist.id}/songs`, {
        songId
      });
    }

    // Paso 3: Obtener la playlist actualizada con las canciones
    const updatedPlaylist = await this.getPlaylistById(playlist.id);
    return updatedPlaylist;
  },

  async deletePlaylist(id: string): Promise<void> {
    await axios.delete(`${API_URL}/playlists/${id}`);
  }
};
