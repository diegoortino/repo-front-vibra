import './Login.css'

export function Login() {
  return (
    <section className="login-section">
      <div className="login-text">
        <h2 className="login-title">Bienvenido a VIBRA</h2>
        <p className="login-description">
          Combina el poder de tus canciones favoritas con la creatividad
          ilimitada de la inteligencia artificial. Una forma innovadora,
          personal y emocionante de disfrutar música.
        </p>
      </div>

      <div className="login-form">
        <button className="login-button">Iniciar sesión</button>
        <button className="login-button secondary">Registrarse</button>
      </div>
    </section>
  );
}
