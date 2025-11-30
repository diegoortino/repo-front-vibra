import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import './LoginModal.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpenRegister: () => void;
}

type Step = 'login' | 'forgotPassword' | 'forgotSuccess' | 'verifyEmail';

export function LoginModal({ isOpen, onClose, onOpenRegister}: Props) {
    const [step, setStep] = useState<Step>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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

                // Si el email no está verificado, mostrar paso de verificación
                if (errorMsg.includes('no verificado') || errorMsg.includes('not verified')) {
                    setStep('verifyEmail');
                    setSuccess('');
                    setError('Tu email no está verificado. Ingresa el código o solicita uno nuevo.');
                    setIsLoading(false);
                    return;
                }

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

    // Reenviar código de verificación
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

    // Solicitar reset de contraseña
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Error al enviar solicitud');
            }

            setStep('forgotSuccess');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar solicitud');
        } finally {
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

    const handleClose = () => {
        setStep('login');
        setError('');
        setSuccess('');
        setForgotEmail('');
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
                        {step === 'forgotPassword' ? 'Enviando...' :
                         step === 'verifyEmail' ? 'Verificando...' :
                         'Iniciando sesión...'}
                    </p>
                </div>
            </div>
        );
    }

    // Paso: Verificar Email (cuando login falla por email no verificado)
    if (step === 'verifyEmail') {
        return (
            <div className="overlay" onClick={handleClose}>
                <div className="modal-content" onClick={e=>e.stopPropagation()}>
                    <span className="close" onClick={handleClose}>&times;</span>
                    <h2 className='modal-title'>Verifica tu email</h2>
                    <p className='modal-subtitle'>Ingresa el código de 6 dígitos que enviamos a:</p>
                    <p className='register-email-highlight'>{email}</p>
                    {error && <p className='login-error'>{error}</p>}
                    {success && <p className='login-success-msg'>{success}</p>}
                    <form className='loginModal-form' onSubmit={handleVerifyCode}>
                        <input
                            className='loginModal-form-input verification-code-input'
                            type="text"
                            placeholder='000000'
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            required
                            autoFocus
                        />
                        <button className='loginModal-form-submit' type="submit">Verificar</button>
                    </form>
                    <button className='forgot-password-btn' onClick={handleResendCode}>
                        ¿No recibiste el código? Reenviar
                    </button>
                    <button className='forgot-back-btn' onClick={() => setStep('login')}>
                        Volver al login
                    </button>
                </div>
            </div>
        );
    }

    // Paso: Forgot Password Success
    if (step === 'forgotSuccess') {
        return (
            <div className="overlay" onClick={handleClose}>
                <div className="modal-content" onClick={e=>e.stopPropagation()}>
                    <span className="close" onClick={handleClose}>&times;</span>
                    <h2 className='modal-title'>Revisa tu email</h2>
                    <p className='login-success-msg'>
                        Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
                    </p>
                    <p className='login-subtitle-info'>Revisa también tu carpeta de spam.</p>
                    <button
                        className='loginModal-form-submit'
                        onClick={() => setStep('login')}
                        style={{ marginTop: '1rem', width: '90%' }}
                    >
                        Volver al login
                    </button>
                </div>
            </div>
        );
    }

    // Paso: Forgot Password Form
    if (step === 'forgotPassword') {
        return (
            <div className="overlay" onClick={handleClose}>
                <div className="modal-content" onClick={e=>e.stopPropagation()}>
                    <span className="close" onClick={handleClose}>&times;</span>
                    <h2 className='modal-title'>Recuperar contraseña</h2>
                    <p className='modal-subtitle'>Ingresa tu email para recibir un enlace de recuperación</p>
                    {error && <p className='login-error'>{error}</p>}
                    <form className='loginModal-form' onSubmit={handleForgotPassword}>
                        <input
                            className='loginModal-form-input'
                            type="email"
                            placeholder='Email'
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                            autoFocus
                        />
                        <button className='loginModal-form-submit' type="submit">Enviar enlace</button>
                    </form>
                    <button className='forgot-back-btn' onClick={() => setStep('login')}>
                        Volver al login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e=>e.stopPropagation()}>
                <span className="close" onClick={handleClose}>&times;</span>
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
                <button className='forgot-password-btn' onClick={() => setStep('forgotPassword')}>
                    ¿Olvidaste tu contraseña?
                </button>
                <button className='loginModal-register-btn' onClick={()=>{onOpenRegister(); handleClose();}}>Registrarse</button>
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
