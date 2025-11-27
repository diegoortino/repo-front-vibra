import { useEffect, useState, useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../../context/currentUserContext';
import { useMusicContext } from '../../context/MusicContext';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import { Toast } from '../Toast/Toast';
import type { ToastType } from '../Toast/Toast';
import { NavLink } from 'react-router-dom';
import { Icons } from '../Icons';

interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  duration: number;
  genre?: string;
  viewCount?: number;
  publishedAt?: Date;
  cloudinaryUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface History {
  id: string;
  youtubeId: string;
  playedAt: Date;
  song?: Song;
}

interface SongToDelete {
  id: string;
  name?: string;
}

const ITEMS_PER_PAGE = 20;

export function SongHistory() {
  const { userId } = useParams<{ userId: string }>();
  const [history, setHistory] = useState<History[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [songToDelete, setSongToDelete] = useState<SongToDelete | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const context = useContext(UserContext);
  if (!context) throw new Error("UserContext must be used inside a UserProvider");
  const { user } = context;

  const { playSong } = useMusicContext();

  const fetchHistory = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!userId) return;

    try {
      if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const offset = pageNum * ITEMS_PER_PAGE;
      const resHistory = await fetch(
        `http://localhost:3000/user-history/user/${userId}?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          credentials: 'include',
        }
      );

      if (!resHistory.ok) throw new Error('Error fetching user history');
      const historyData = await resHistory.json();

      const normalizedHistory = Array.isArray(historyData)
        ? historyData
        : Array.isArray(historyData?.data)
        ? historyData.data
        : [];

      if (append) {
        setHistory(prev => [...prev, ...normalizedHistory]);
      } else {
        setHistory(normalizedHistory);
      }
      setHasMore(normalizedHistory.length === ITEMS_PER_PAGE);
      
    } catch (err) {
      console.error('Error al cargar historial:', err);
      if (!append) {
        setHistory([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userId]);

  useEffect(() => {
    setPage(0);
    fetchHistory(0, false);
          console.log(history.length)
  }, [userId, fetchHistory]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage, true);
    }
  };

  const handleItemClick = (song: Song) => {
    playSong(song);
  };

  const handleDeletePlaylist = (song: SongToDelete) => {
    setSongToDelete(song);
    setConfirmDelete(true);
  };

  const confirmDeletePlaylist = async () => {
    if (!songToDelete) return;
    setConfirmDelete(false);

    try {
      showToast('Eliminando canción...', 'loading');
      await fetch(`http://localhost:3000/user-history/${userId}/${songToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      // Remove from local state
      setHistory(prev => prev.filter(item => item.id !== songToDelete.id));

      showToast('Canción eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting song:', error);
      showToast('Error al eliminar canción', 'error');
    } finally {
      setSongToDelete(null);
    }
  };

  const cancelDeletePlaylist = () => {
    setConfirmDelete(false);
    setSongToDelete(null);
  };

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  };

  const hideToast = () => setIsToastVisible(false);

  const isOwnProfile = user && user.id === userId;

  if (isLoading) {
    return <div className="song-history-loading">Cargando historial...</div>;
  }

  return (
    <div className="song-history-container">
      <div className="song-history-header">
        <h1>Historial de Canciones</h1>
        <NavLink to={`/user/${userId}`} className="back-btn">
          ← Volver al perfil
        </NavLink>
      </div>

      <div className="song-history-list">
        {history.length === 0 ? (
          <p className="empty-message">
            🎧 Aún no se han escuchado canciones
          </p>
        ) : (
          <>
            {history.map((item) => (
              <div
                key={item.id}
                className="song-history-item"
                onClick={() => item.song && handleItemClick(item.song)}
                style={{ cursor: item.song ? "pointer" : "default" }}
              >
                <div className="song-cover">
                  <img
                    src={`https://img.youtube.com/vi/${item.song?.youtubeId}/hqdefault.jpg`}
                    alt="Cover"
                    onError={(e) => {
                      e.currentTarget.src = '/default-song-cover.png';
                    }}
                  />
                </div>
                <div className="song-info">
                  <div className="song-details">
                    <p className="song-title" title={item.song?.title || ""}>
                      {item.song?.title || "Canción no disponible"}
                    </p>
                    <p className="song-artist">
                      {item.song?.artist || "Artista desconocido"}
                    </p>
                    <p className="played-at">
                      Reproducida el {new Date(item.playedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                    {isOwnProfile && (
                      <button
                        className="delete-song-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist({
                            id: item.id,
                            name: item.song?.title,
                          });
                        }}
                      >
                        <Icons.Trash />
                      </button>
                    )}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="load-more-container">
                <button
                  className="load-more-btn"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        message={`¿Estás seguro de eliminar ${songToDelete?.name} del historial?`}
        onConfirm={confirmDeletePlaylist}
        onCancel={cancelDeletePlaylist}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={isToastVisible}
        onClose={hideToast}
      />

      <button
        className="scroll-to-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Volver arriba"
      >
        <Icons.ArrowUp />
      </button>
    </div>
  );
}

export default SongHistory;
