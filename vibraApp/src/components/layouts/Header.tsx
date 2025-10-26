import "./header.css"
export default function Header() {
const handleLogoutClick=()=>{};

 return(
         <>
          <header className="header">
             <div className="logo-container">
                 <h1 className="titulo">VIBRA</h1>
             </div>
             <div className="user-section">
                 <div className="user-avatar" title="Usuario">U</div>
                 <button className="logout-btn" onClick={handleLogoutClick}>Salir</button>
             </div>
          </header>
         </>
        )
}