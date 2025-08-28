import "./footer.css"

export function Footer() {
    // Define the toggleTheme function
    const toggleTheme = () => {
        console.log("Toggle theme");
    };

    return (
    <footer className="footer">
      {/* Texto */}
      <div>
        <p>© 2024 VIBRA. Todos los derechos reservados.</p>
      </div>

      {/* Botón de tema */}
      <button className="theme-toggle" onClick={toggleTheme}>🌙</button>
    </footer>
    )
}