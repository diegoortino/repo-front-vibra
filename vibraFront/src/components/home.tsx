import { Link } from "react-router-dom";
import "./home.css";

export function Home(){
  const features = [
    'Visualizaciones generadas por IA en tiempo real',
    'Integración perfecta con YouTube',
    'Experiencias personalizadas para cada canción',
    'Interface intuitiva y moderna'
  ];

  return (
    <>
        <main>
            <section className="hero-section">
            <div className="hero-content">
                <h1 className="hero-title">
                Descubrí una nueva forma de escuchar música
                </h1>
                <p className="hero-subtitle">
                ¿Quieres vivir tu música como nunca antes? VIBRA te permite buscar tu canción favorita en YouTube y disfrutarla acompañada de imágenes únicas, creadas en tiempo real por inteligencia artificial.
                </p>
                <button className="hero-cta">
                    <Link to='/login'>
                        Comenzar experiencia
                    </Link>
                </button>
            </div>
            </section>

            <section className="features-section">
            <div className="features-container">
                <div className="features-text">
                <h2 className="features-title">
                    Transforma cada canción en una experiencia única
                </h2>
                <p className="features-description">
                    Combina el poder de tus canciones favoritas con la creatividad ilimitada de la inteligencia artificial. Una forma innovadora, personal y emocionante de disfrutar música.
                </p>
                <ul className="features-list">
                    {features.map((item, index) => (
                    <li key={index}>{item}</li>
                    ))}
                </ul>
                </div>
                <div className="features-visual">
                <div className="visual-placeholder">
                    <span className="placeholder-icon">🎵</span>
                </div>
                </div>
            </div>
            </section>
        </main>
    </>
  );
}

export default Home;