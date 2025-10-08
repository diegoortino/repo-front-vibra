import { useState } from 'react';
import './Follows.css'
import { FollowSkeleton } from './FollowSkeleton';
export function Follows(){
    const [isLoading, setIsLoading]= useState<Boolean>(false) //false mientras conectamos front y back

    const canciones = [
        {
            id: 1,
            artista: "Artista 1",
            titulo: "Canción A",
            tipo: "álbum",
            tiempo: "hace 2h",
            duracion: "3:45",
            likes: 1200
        },
        {
            id: 2,
            artista: "Artista 2",
            titulo: "Canción B",
            tipo: "sencillo",
            tiempo: "hace 5h",
            duracion: "4:10",
            likes: 890
        },
        {
            id: 3,
            artista: "Artista 3",
            titulo: "Canción C",
            tipo: "álbum",
            tiempo: "hace 1 día",
            duracion: "2:58",
            likes: 560
        },
        {
            id: 4,
            artista: "Artista 4",
            titulo: "Canción D",
            tipo: "sencillo",
            tiempo: "hace 3 días",
            duracion: "5:20",
            likes: 2400
        },
        {
            id: 5,
            artista: "Artista 5",
            titulo: "Canción E",
            tipo: "álbum",
            tiempo: "hace 1 semana",
            duracion: "3:15",
            likes: 1750
        }
    ];

    return(
        <>
            {isLoading? <FollowSkeleton/> :(
                <div className='followsContainer'>
                    <h3 className="followsTitle">Seguidos</h3>
                    <p className="followsSubTitle">Descubre lo último de los artistas a los que sigues</p>
                    <div className="divCards">
                        <div className="card">
                            <p className="cardNumber">999</p>
                            <p className="cardText">Seguidos</p>
                        </div>
                        <div className="card">
                            <p className="cardNumber">111</p>
                            <p className="cardText">Actividad Hoy</p>
                        </div>
                        <div className="card">
                            <p className="cardNumber">777</p>
                            <p className="cardText">Esta Semana</p>
                        </div>
                    </div>

                    <div className='cancionesDiv'>
                        {canciones.map(cancion => (
                            <div key={cancion.id} className="tarjetaCancion">
                                {/* Imagen y datos */}
                                <div className="cancionHeader">
                                <div className="avatar"></div>
                                <div className="info">
                                    <div className='artistaNuevo'>
                                        <h3>{cancion.artista}</h3>
                                        <span className="nuevo">Nuevo</span>

                                    </div>
                                    <p>Nuevo {cancion.tipo} - {cancion.tiempo}</p>
                                </div>
                                </div>
                                
                                <div className="cancionBody">
                                <div className="cover"></div>
                                <div className="detalles">
                                    <p>{cancion.titulo}</p>
                                    <p>Duración: {cancion.duracion}</p>
                                </div>
                                </div>
                                
                                <div className="cancionFooter">
                                <span>💖 {cancion.likes}</span>
                                <button>Compartir</button>
                                <button>🎵 Reproducir</button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </>
    )
}