import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FollowSkeleton } from './FollowSkeleton';
import { UserContext } from '../../context/currentUserContext';
import { useMusicContext } from '../../context/MusicContext';
import { playlistService } from '../../services/playlistService';
import type { Playlist } from '../../types';

interface FollowedUser {
    id: string;
    username: string;
    profileImage?: string;
}

export function Follows(){
    const navigate = useNavigate();
    const { playSong, setCurrentPlaylistId } = useMusicContext();

    const [isLoading, setIsLoading] = useState(true);
    const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [playlistCovers, setPlaylistCovers] = useState<Record<string, string>>({});
    const [stats, setStats] = useState({
        followed: 0,
        todayActivity: 0,
        weekActivity: 0
    });

    const userContext = useContext(UserContext);
    const currentUser = userContext?.user;

    // Helper function to format dates
    const formatDate = (date: string | Date | undefined): string => {
        if (!date) return 'hace tiempo';

        const now = new Date();
        const dateObj = new Date(date);
        const diffMs = now.getTime() - dateObj.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'hace menos de 1h';
        if (diffHours < 24) return `hace ${diffHours}h`;
        if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;

        return `hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
    };

    // Function to play playlist
    const handlePlayPlaylist = async (playlistId: string) => {
        try {
            console.log('🎵 Intentando reproducir playlist:', playlistId);

            const playlistData = await playlistService.getPlaylistWithSongs(playlistId);
            console.log('📋 Playlist data:', playlistData);
            console.log('🎶 Canciones en playlist:', playlistData.songs?.length || 0);

            if (playlistData.songs && playlistData.songs.length > 0) {
                // Extraer objetos de canciones anidadas (estructura: { song: { title, artist, ... } })
                const songs = playlistData.songs.map((item: any) => item.song || item);
                const firstSong = songs[0];
                console.log('▶️ Primera canción:', firstSong.title);
                setCurrentPlaylistId(playlistId);
                playSong(firstSong, songs);
            } else {
                console.warn('⚠️ Playlist sin canciones');
            }
        } catch (error) {
            console.error('❌ Error playing playlist:', error);
        }
    };

    // Load followed users and their playlists
    useEffect(() => {
        const loadData = async () => {
            if (!currentUser?.id) return;

            try {
                setIsLoading(true);

                // Get followed users
                const followingResponse = await fetch(`http://localhost:3000/users/${currentUser.id}/following`, {
                    credentials: 'include',
                });

                if (followingResponse.ok) {
                    const followedUsersData = await followingResponse.json();
                    setFollowedUsers(followedUsersData);
                    setStats(prev => ({ ...prev, followed: followedUsersData.length }));

                    // Get playlists from followed users
                    const followedUserIds = followedUsersData.map((user: FollowedUser) => user.id);

                    if (followedUserIds.length === 0) {
                        setPlaylists([]);
                        return;
                    }

                    const allPlaylists: Playlist[] = [];

                    for (const userId of followedUserIds) {
                        try {
                            const userPlaylists = await playlistService.getUserPlaylists(userId);
                            // Show all playlists from followed users (both public and private)
                            allPlaylists.push(...userPlaylists);
                        } catch (error) {
                            console.error(`Error loading playlists for user ${userId}:`, error);
                        }
                    }

                    // Remove duplicates, filter for public playlists, and sort by creation date (newest first)
                    const uniquePlaylists = allPlaylists.filter((playlist, index, self) =>
                        index === self.findIndex(p => p.id === playlist.id)
                    );

                    const publicPlaylists = uniquePlaylists.filter(playlist => playlist.isPublic);

                    publicPlaylists.sort((a, b) =>
                        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                    );

                    setPlaylists(publicPlaylists);

                    // Fetch covers and accurate song data for playlists
                    const coverPromises = publicPlaylists.map(async (playlist) => {
                        try {
                            const songs = await playlistService.getPlaylistSongs(playlist.id);
                            const songCount = songs.length;
                            const totalDuration = songs.reduce((sum, song) => sum + song.duration, 0);
                            let coverUrl: string | undefined;
                            if (songs.length > 0) {
                                const firstSong = songs[0];
                                coverUrl = `https://img.youtube.com/vi/${firstSong.youtubeId}/hqdefault.jpg`;
                            }
                            return { id: playlist.id, coverUrl, songCount, totalDuration };
                        } catch (error) {
                            console.error(`Error fetching songs for playlist ${playlist.id}:`, error);
                            return { id: playlist.id, coverUrl: undefined, songCount: 0, totalDuration: 0 };
                        }
                    });

                    const covers = await Promise.all(coverPromises);
                    const coversMap: Record<string, string> = {};
                    const updatedPlaylists = publicPlaylists.map(playlist => {
                        const data = covers.find(c => c.id === playlist.id);
                        if (data) {
                            if (data.coverUrl) coversMap[playlist.id] = data.coverUrl;
                            return { ...playlist, songCount: data.songCount, totalDuration: data.totalDuration };
                        }
                        return playlist;
                    });
                    setPlaylists(updatedPlaylists);
                    setPlaylistCovers(coversMap);

                    // Calculate activity stats based on public playlists
                    const now = new Date();
                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

                    const todayActivityCount = publicPlaylists.filter(p => {
                        const created = new Date(p.createdAt || 0);
                        return created >= startOfToday;
                    }).length;

                    const weekActivityCount = publicPlaylists.filter(p => {
                        const created = new Date(p.createdAt || 0);
                        return created >= startOfWeek;
                    }).length;

                    setStats(prev => ({
                        ...prev,
                        todayActivity: todayActivityCount,
                        weekActivity: weekActivityCount
                    }));
                } // end if (followingResponse.ok)
            } catch (error) {
                console.error('Error loading follows data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentUser?.id]);

    return(
        <>
            {isLoading? <FollowSkeleton/> :(
                <div className='followsContainer'>
                    <h3 className="followsTitle">Seguidos</h3>
                    <p className="followsSubTitle">Descubre lo último de los artistas a los que sigues</p>
                    <div className="divCards">
                        <div className="card">
                            <p className="cardNumber">{stats.followed}</p>
                            <p className="cardText">Seguidos</p>
                        </div>
                        <div className="card">
                            <p className="cardNumber">{stats.todayActivity}</p>
                            <p className="cardText">Actividad Hoy</p>
                        </div>
                        <div className="card">
                            <p className="cardNumber">{stats.weekActivity}</p>
                            <p className="cardText">Esta Semana</p>
                        </div>
                    </div>

                    <div className='cancionesDiv'>
                        {playlists.length === 0 ? (
                            <p className="no-playlists">No hay playlists nuevas de tus seguidos ({followedUsers.length} seguidos)</p>
                        ) : (
                            playlists.map(playlist => {
                                const creator = followedUsers.find(u => u.id === playlist.userId);
                                return (
                                    <div key={playlist.id} className="tarjetaCancion" onClick={() => handlePlayPlaylist(playlist.id)} style={{cursor: 'pointer'}}>
                                        {/* Imagen y datos */}
                                        <div className="cancionHeader">
                                        <div className="avatar" style={{ backgroundImage: creator?.profileImage ? `url(${creator.profileImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                        <div className="info">
                                            <div className='artistaNuevo'>
                                                <h3>{playlist.name}</h3>
                                                <span className="nuevo">{playlist.isPublic ? 'Pública' : 'Privada'}</span>
                                            </div>
                                            <p>by {creator?.username || 'Unknown'} - {formatDate(playlist.createdAt || playlist.updatedAt)}</p>
                                            {playlist.description && <p>{playlist.description}</p>}
                                        </div>
                                        </div>

                                    <div className="cancionBody">
                                    <div className="cover" style={{ backgroundImage: playlistCovers[playlist.id] ? `url(${playlistCovers[playlist.id]})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                    <div className="detalles">
                                        <p>{playlist.songCount || 0} canciones</p>
                                        <p>Duración total: {Math.floor((playlist.totalDuration || 0) / 60)} min</p>
                                    </div>
                                    </div>

                                    <div className="cancionFooter">
                                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/playlist/${playlist.id}`); }}>Compartir</button>
                                    <button onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(playlist.id); }}>🎵 Reproducir</button>
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>

                </div>
            )}
        </>
    )
}
