
interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeId?: string;
}

interface Playlist {
  id: string;
  name: string;
  genre?: string;
  playlistSongs?: Array<{
    song: Song;
  }>;
}

interface PlaylistCoverProps {
  playlist: Playlist;
}

/**
 * Componente que muestra un mosaico 2x2 con las primeras 4 canciones de la playlist
 * Estilo Spotify
 */
export function PlaylistCover({ playlist }: PlaylistCoverProps) {
  // Obtener las primeras 4 canciones con thumbnails
  const songs = playlist.playlistSongs?.slice(0, 4) || [];

  // Función para obtener thumbnail de YouTube
  const getThumbnail = (youtubeId?: string): string => {
    if (!youtubeId) {
      return '/placeholder-song.png'; // Imagen por defecto si no hay thumbnail
    }
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  };

  // Si no hay suficientes canciones, mostrar placeholder
  if (songs.length === 0) {
    return (
      <div className="playlistMosaic playlistMosaic--placeholder">
        <div className="playlistMosaic__letter">
          {playlist.genre?.charAt(0).toUpperCase() || 'P'}
        </div>
      </div>
    );
  }

  // Si hay menos de 4 canciones, rellenar con placeholders
  const thumbnails = Array(4).fill(null).map((_, index) => {
    const song = songs[index];
    if (song) {
      return getThumbnail(song.song.youtubeId);
    }
    return null;
  });

  return (
    <div className="playlistMosaic">
      {thumbnails.map((thumbnail, index) => (
        <div
          key={index}
          className="playlistMosaic__tile"
          style={{
            backgroundImage: thumbnail ? `url(${thumbnail})` : 'none',
            backgroundColor: thumbnail ? 'transparent' : '#2a2a2a'
          }}
        >
          {!thumbnail && (
            <div className="playlistMosaic__emptyTile">
              {playlist.genre?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
