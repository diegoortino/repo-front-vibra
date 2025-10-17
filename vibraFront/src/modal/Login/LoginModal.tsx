import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import './LoginModal.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpenRegister: () => void;
}

export function LoginModal({ isOpen, onClose, onOpenRegister}: Props) {
    if (!isOpen) return null

    const handleSuccess = async(credentialResponse: CredentialResponse) => {
        console.log('Logeado :thumbUp:');

        const googleToken =credentialResponse.credential

        const response = await fetch('', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: googleToken
            })
        });

        if (!response.ok) {
            throw new Error('Error en la autenticación');
        }

        const data= await response.json()
        console.log("respuesta del back" + data)

        //redireccion
        //window.location.href="Otro Dominio"
    };
    const handleError = () => {
        console.log('Login Failed');
    };
    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal-content" onClick={e=>e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h2 className='modal-title'>Bienvenido</h2>
                <p className='modal-subtitle'>Inicia sesión para continuar a la App</p>
                <form className='loginModal-form' onSubmit={(e) => { e.preventDefault(); /* Aquí iría la lógica de autenticación */ }}>
                    <input className='loginModal-form-input' type="text" id="username" name="username" placeholder='Usuario o Email' required />
                    <input className='loginModal-form-input' type="password" id="password" name="password" placeholder='Contraseña' required />
                    <button className='loginModal-form-submit' type="submit">Iniciar sesión</button>
                </form>
                <button className='loginModal-register-btn' onClick={()=>{onOpenRegister(); onClose();}}>Registrarse</button> {/*te lleva al modal de registro*/}
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