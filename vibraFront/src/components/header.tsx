import "./header.css";

export function Header() {
  return (
    <header className="header">
      {/* Logo */}
      <div className="logo-container">
        
          <h1 className="titulo">VIBRA</h1>
          <p className="subtitulo">Tu música, tu universo</p>
        
      </div>

      {/* Navegación */}
      <nav className="nav-container">
        <ul className="nav-links">
          <li className="nav-link">
            <p>Sobre VIBRA</p>
          </li>
          <li className="nav-link">
           <p>Cómo funciona</p>
          </li>
          <li className="nav-link">
            <p>Contacto</p>
          </li>
        </ul>
          <button className="cta-button">Comenzar</button>
      </nav>
    </header>
  );
};

export default Header;
