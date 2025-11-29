import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import './RegisterModal.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpenLogin:()=>void;
}

export function RegisterModal({ isOpen, onClose,onOpenLogin }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null

    // Registro con email y contraseña
    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validar contraseñas
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        const startTime = Date.now();

        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const errorMsg = data.message || 'Error al registrarse';
                throw new Error(errorMsg);
            }

            const data = await response.json();

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 3000 - elapsed);

            setTimeout(() => {
                window.location.href = `https://vibra-app-ten.vercel.app/?token=${data.token}`;
            }, remaining);

        } catch (err) {
            console.error('❌ Error en registro:', err);
            setError(err instanceof Error ? err.message : 'Error al registrarse');
            setIsLoading(false);
        }
    };

    const handleSuccess = async(credentialResponse: CredentialResponse) => {
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

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 3000 - elapsed);

            setTimeout(() => {
                window.location.href = `https://vibra-app-ten.vercel.app/?token=${data.token}`;
            }, remaining);

        } catch (err) {
            console.error('❌ Error en registro con Google:', err);
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
                    <p className="spinner-text">Creando cuenta...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal-content" onClick={e=>e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h2 className='modal-title'>Crear cuenta</h2>
                <a className='register-subtitle' href='#' onClick={()=>{onOpenLogin(); onClose();}}>Inicia sesión si ya tienes una cuenta</a>
                {error && <p className='register-error'>{error}</p>}
                <form className='register-form' onSubmit={handleEmailRegister}>
                    <input
                        className='register-form-input'
                        type="text"
                        placeholder='Usuario'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        className='register-form-input'
                        type="email"
                        placeholder='Email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <div className='password-input-container'>
                        <input
                            className='register-form-input'
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
                    <div className='password-input-container'>
                        <input
                            className='register-form-input'
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Confirmar contraseña'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <button className='register-form-submit' type="submit">Registrarse</button>
                </form>
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