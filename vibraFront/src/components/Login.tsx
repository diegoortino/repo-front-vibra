import { useState } from 'react';
import './Login.css'
import { LoginModal } from '../modal/Login/LoginModal';
import { RegisterModal } from '../modal/Register/RegisterModal';

export function Login() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openLoginModal = () => {
    setIsLoginOpen(true);
  };
  const closeLoginModal = () => {
    setIsLoginOpen(false);
  }
  const openRegisterModal = () => {
    setIsRegisterOpen(true);
  }
  const closeRegisterModal = () => {
    setIsRegisterOpen(false);
  }
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
        <button onClick={openLoginModal} className="login-button">Iniciar sesión</button>
        <button onClick={openRegisterModal} className="login-button secondary">Registrarse</button>
      </div>
      {isLoginOpen && (
        <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} onOpenRegister={openRegisterModal}/>
      )}

      {isRegisterOpen && (
        <RegisterModal isOpen={isRegisterOpen} onClose={closeRegisterModal} onOpenLogin={openLoginModal}/>
      )}
          
    </section>
  );
}
