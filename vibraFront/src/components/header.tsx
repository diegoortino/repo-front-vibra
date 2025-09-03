import { Link } from "react-router-dom";
import "./header.css";

export function Header() {
  return (
    <header className="header">
      {/* Logo */}
      <div className="logo-container">
        <Link to="/">
          <h1 className="titulo">VIBRA</h1>
          <p className="subtitulo">Tu música, tu universo</p>
        </Link>
        
      </div>

      {/* Navegación */}
      <nav className="nav-container">
        <ul className="nav-links">
          <li className="nav-link">
            <Link to="/vibra">
              <p>Sobre VIBRA</p>
            </Link>
          </li>
          <li className="nav-link">
            <Link to="/how">
              <p>Cómo funciona</p>
            </Link>
          </li>
          <li className="nav-link">
            <Link to="/contact">
              <p>Contacto</p>
            </Link>
          </li>
        </ul>
          <button className="cta-button"><Link to="/login" >Comenzar</Link></button>
      </nav>
    </header>
  );
};

export default Header;
