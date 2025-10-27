import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import './RegisterModal.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpenLogin:()=>void;
}

export function RegisterModal({ isOpen, onClose,onOpenLogin }: Props) {
    if (!isOpen) return null

        const handleSuccess = async(credentialResponse: CredentialResponse) => {
            console.log('Logeado :thumbUp:');
    
            const googleToken =credentialResponse.credential
    
            const response = await fetch('http://localhost:3000/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_token: googleToken
                })
            });
    
            if (!response.ok) {
                throw new Error('Error en la autenticación');
            }
    
            const data= await response.json()
            console.log("respuesta del back" +  JSON.stringify(data, null, 2))
            localStorage.setItem("token_vibra",data.token)

            // Redirigir a la app principal (vibraApp)
            window.location.href = "http://localhost:5174"
        };
        const handleError = () => {
            console.log('Login Failed');
        };
    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal-content" onClick={e=>e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h2 className='modal-title'>Crear cuenta</h2>
                <a className='register-subtitle' href='#' onClick={()=>{onOpenLogin(); onClose();}}>Inicia sesión si ya tienes una cuenta</a>
                <form className='register-form'>
                    <input className='register-form-input' type="text" placeholder='Usuario' required />
                    <input className='register-form-input' type="text" placeholder='Email' required />
                    <input className='register-form-input' type="password" placeholder='Contraseña' required />
                    <input className='register-form-input' type="password" placeholder='Confirmar contraseña' required />
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