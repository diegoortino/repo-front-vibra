import { useState, useEffect } from 'react';
import './followModal.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

interface followModalProps{
    isOpen:boolean;
    onClose:()=>void;
    type:"followers" | "following";
    targetUserId: string;
    currentUserId?: string;
    onFollowChange?: (isFollowing: boolean) => void;
}

interface User{
    id: string;
    username: string;
    profileImage?: string;
    isFollowedByCurrentUser: boolean;
}
export function FollowModal({isOpen, onClose, type, targetUserId, currentUserId, onFollowChange}:followModalProps){
    if(!isOpen) return null;
    const [usersList, setUsersList]=useState<User[]>([])
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = `http://localhost:3000/users/${targetUserId}/${type}`;
            const response = await fetch(endpoint, {
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                },
            });
            if (!response.ok) throw new Error('Error fetching users');
            const data = await response.json();
            setUsersList(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Error al cargar la lista');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && targetUserId) {
            fetchUsers();
        }
    }, [isOpen, type, targetUserId]);

    const handleFollowUser = async (userId: string, isCurrentlyFollowing: boolean) => {
        try {
            const method = isCurrentlyFollowing ? "DELETE" : "POST";
            const endpoint = isCurrentlyFollowing
                ? `http://localhost:3000/users/${userId}/unfollow`
                : `http://localhost:3000/users/${userId}/follow`;

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            // Update the local state
            setUsersList(prev => prev.map(user =>
                user.id === userId
                    ? { ...user, isFollowedByCurrentUser: !isCurrentlyFollowing }
                    : user
            ));

            // Notify parent component about follow change
            if (onFollowChange) {
                onFollowChange(!isCurrentlyFollowing);
            }
        } catch (err) {
            console.error("Error en handleFollowUser:", err);
            setError("Error al cambiar seguimiento");
        }
    };

    return(
        <div className="follow-modal" onClick={onClose}>
            <div className="follow-modal-content" onClick={(e)=>e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h2 className='follows-modal-title'>{(type === "following")? "Seguidos":"Seguidores"}</h2>
                {isLoading && <p>Cargando...</p>}
                {error && <p className="error">{error}</p>}
                <div className="user-list">
                    {usersList.length === 0 && !isLoading ? (
                        <p className="empty-message">
                            {type === "following"
                                ? "Este perfil no sigue a nadie"
                                : "Este perfil no tiene seguidores"}
                        </p>
                    ) : (
                        usersList.map((user, index) => (
                            <div key={user.id || index} className="user-item">
                                <div className="user-info" onClick={() => window.location.href = `/user/${user.id}`}>
                                    <div className="profile-avatar">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt="foto perfil" />
                                        ) : (
                                            <FontAwesomeIcon icon={faUser} />
                                        )}
                                    </div>
                                    <span className="follow-modal-username">{user.username}</span>
                                </div>
                                {currentUserId !== user.id ? (
                                    <button
                                        className="follow-btn"
                                        onClick={() => handleFollowUser(user.id, user.isFollowedByCurrentUser)}
                                    >
                                        {user.isFollowedByCurrentUser ? "Dejar de seguir" : "Seguir"}
                                    </button>
                                ):(
                                    <p className='paragraph-tú'>Tú</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}