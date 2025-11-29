import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import './LoginModal.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpenRegister: () => void;
}

export function LoginModal({ isOpen, onClose, onOpenRegister}: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null

    // Login con email y contraseña
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const startTime = Date.now();

        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const errorMsg = data.message || 'Error al iniciar sesión';
                throw new Error(errorMsg);
            }

            const data = await response.json();

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 3000 - elapsed);

            setTimeout(() => {
                window.location.href = `https://vibra-app-ten.vercel.app/?token=${data.token}`;
            }, remaining);

        } catch (err) {
            console.error('❌ Error en login:', err);
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
            setIsLoading(false);
        }
    };

    const handleSuccess = async (credentialResponse: CredentialResponse) => {
        setIsLoading(true);
        const startTime = Date.now();

        try {
            const googleToken = credentialResponse.credential;
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            const response = await fetch(`${backendUrl}/auth/google`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: googleToken }),
            });

            if (!response.ok) {
                throw new Error('Error en la autenticación');
            }

            const data = await response.json();

            if (!data.token) {
                throw new Error('No se recibió token del servidor');
            }

            // Asegurar mínimo 3 segundos de spinner
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 3000 - elapsed);

            setTimeout(() => {
                window.location.href = `https://vibra-app-ten.vercel.app/?token=${data.token}`;
            }, remaining);

        } catch (error) {
            console.error('❌ Error en login:', error);
            setIsLoading(false);
        }
    };

    const handleError = () => {
        console.log('Login Failed');
        setIsLoading(false);
    };

    // Mostrar spinner mientras carga
    if (isLoading) {
        return (
            <div className="overlay">
                <div className="spinner-container">
                    <div className="spinner"></div>
                    <p className="spinner-text">Iniciando sesión...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal-content" onClick={e=>e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h2 className='modal-title'>Bienvenido</h2>
                <p className='modal-subtitle'>Inicia sesión para continuar a la App</p>
                {error && <p className='login-error'>{error}</p>}
                <form className='loginModal-form' onSubmit={handleEmailLogin}>
                    <input
                        className='loginModal-form-input'
                        type="email"
                        placeholder='Email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <div className='password-input-container'>
                        <input
                            className='loginModal-form-input'
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Contraseña'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className='password-toggle'
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                    <button className='loginModal-form-submit' type="submit">Iniciar sesión</button>
                </form>
                <button className='loginModal-register-btn' onClick={()=>{onOpenRegister(); onClose();}}>Registrarse</button>
                <div className='loginModal-lineas-container'>
                    <div className='loginModal-lineas'></div>
                    <p>O continuar con</p>
                    <div className='loginModal-lineas'></div>
                </div>
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                />
            </div>
        </div>
    );
}