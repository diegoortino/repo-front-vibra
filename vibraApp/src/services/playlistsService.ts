import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  async updatePlaylist(id: string): Promise<Playlist> {
    const response = await axios.patch(`${API_URL}/playlists/${id}/regenerate`);
    return response.data;
  }
};
