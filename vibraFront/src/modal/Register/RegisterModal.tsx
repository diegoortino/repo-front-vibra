import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import './RegisterModal.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpenLogin:()=>void;
}

type Step = 'register' | 'verify';

export function RegisterModal({ isOpen, onClose,onOpenLogin }: Props) {
    const [step, setStep] = useState<Step>('register');
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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

            // Si requiere verificación, mostrar paso de verificación
            if (data.requiresVerification) {
                setStep('verify');
                setSuccess('Te enviamos un código de 6 dígitos a tu email');
            }

        } catch (err) {
            console.error('❌ Error en registro:', err);
            setError(err instanceof Error ? err.message : 'Error al registrarse');
        } finally {
            setIsLoading(false);
        }
    };

    // Verificar código de email
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (verificationCode.length !== 6) {
            setError('El código debe tener 6 dígitos');
            return;
        }

        setIsLoading(true);

        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/auth/verify-email`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: verificationCode }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Código incorrecto');
            }

            const data = await response.json();

            // Verificación exitosa, redirigir a la app
            setSuccess('Email verificado correctamente');
            setTimeout(() => {
                window.location.href = `https://vibra-app-ten.vercel.app/?token=${data.token}`;
            }, 1500);

        } catch (err) {
            console.error('❌ Error en verificación:', err);
            setError(err instanceof Error ? err.message : 'Error al verificar');
            setIsLoading(false);
        }
    };

    // Reenviar código
    const handleResendCode = async () => {
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/auth/resend-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Error al reenviar código');
            }

            setSuccess('Código reenviado. Revisa tu email.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al reenviar');
        } finally {
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

    const handleClose = () => {
        setStep('register');
        setError('');
        setSuccess('');
        setVerificationCode('');
        onClose();
    };

    // Mostrar spinner mientras carga
    if (isLoading) {
        return (
            <div className="overlay">
                <div className="spinner-container">
                    <div className="spinner"></div>
                    <p className="spinner-text">
                        {step === 'verify' ? 'Verificando...' : 'Creando cuenta...'}
                    </p>
                </div>
            </div>
        );
    }

    // Paso de verificación
    if (step === 'verify') {
        return (
            <div className="overlay" onClick={handleClose}>
                <div className="modal-content" onClick={e=>e.stopPropagation()}>
                    <span className="close" onClick={handleClose}>&times;</span>
                    <h2 className='modal-title'>Verifica tu email</h2>
                    <p className='register-subtitle'>Ingresa el código de 6 dígitos que enviamos a:</p>
                    <p className='register-email-highlight'>{email}</p>
                    {error && <p className='register-error'>{error}</p>}
                    {success && <p className='register-success'>{success}</p>}
                    <form className='register-form' onSubmit={handleVerifyCode}>
                        <input
                            className='register-form-input verification-code-input'
                            type="text"
                            placeholder='000000'
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            required
                            autoFocus
                        />
                        <button className='register-form-submit' type="submit">Verificar</button>
                    </form>
                    <button className='resend-code-btn' onClick={handleResendCode}>
                        ¿No recibiste el código? Reenviar
                    </button>
                    <button className='back-to-register-btn' onClick={() => setStep('register')}>
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e=>e.stopPropagation()}>
                <span className="close" onClick={handleClose}>&times;</span>
                <h2 className='modal-title'>Crear cuenta</h2>
                <a className='register-subtitle' href='#' onClick={()=>{onOpenLogin(); handleClose();}}>Inicia sesión si ya tienes una cuenta</a>
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
