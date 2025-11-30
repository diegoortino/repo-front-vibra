import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

export function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (!tokenParam) {
            setError('Token inválido o expirado');
        } else {
            setToken(tokenParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

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
            const response = await fetch(`${backendUrl}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Error al restablecer la contraseña');
            }

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="spinner"></div>
                    <p className="spinner-text">Actualizando contraseña...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <h2 className="reset-title">Contraseña actualizada</h2>
                    <p className="reset-success">Tu contraseña ha sido restablecida exitosamente.</p>
                    <button className="reset-btn" onClick={() => navigate('/')}>
                        Ir al inicio
                    </button>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <h2 className="reset-title">Error</h2>
                    <p className="reset-error">{error || 'Token inválido o expirado'}</p>
                    <button className="reset-btn" onClick={() => navigate('/')}>
                        Ir al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <h2 className="reset-title">Nueva contraseña</h2>
                <p className="reset-subtitle">Ingresa tu nueva contraseña</p>
                {error && <p className="reset-error">{error}</p>}
                <form className="reset-form" onSubmit={handleSubmit}>
                    <div className="password-input-wrapper">
                        <input
                            className="reset-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Nueva contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                    <div className="password-input-wrapper">
                        <input
                            className="reset-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirmar contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                    <button className="reset-btn" type="submit">
                        Restablecer contraseña
                    </button>
                </form>
            </div>
        </div>
    );
}
