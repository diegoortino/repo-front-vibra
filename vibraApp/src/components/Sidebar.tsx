import './Sidebar.css'
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faHome as faHomeSolid} from '@fortawesome/free-solid-svg-icons';
import {faHome as faHomeRegular} from '@fortawesome/free-regular-svg-icons';
import { faBell as faBellSolid } from '@fortawesome/free-solid-svg-icons';
import { faBell as faBellRegular } from '@fortawesome/free-regular-svg-icons';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { faUser as faUserSolid } from '@fortawesome/free-solid-svg-icons';
import { faUser as faUserRegular } from '@fortawesome/free-regular-svg-icons';
import { useContext } from 'react';
import { UserContext } from '../context/currentUserContext';

export function Sidebar(){
    const context = useContext(UserContext)
    if(!context) throw new Error("UserContext must be used inside a UserProvider");
    const { user } = context;
    if (!user) {
        return null;
    }
    return(
        <nav className='sideBarContainer'>
            <div className='navLinks'>
                <NavLink to={"/"}>
                    {({ isActive }) => (
                        <div className='navItem'>
                            <FontAwesomeIcon icon={isActive ? faHomeSolid : faHomeRegular} />
                            <p>Home</p>
                        </div>
                    )}
                </NavLink>
                <NavLink to={"/favorites"}>
                    {({ isActive }) => (
                        <div className='navItem'>
                            <FontAwesomeIcon icon={isActive ? faHeartSolid : faHeartRegular} />
                            <p className={isActive ? 'text-blue-500' : 'text-gray-400'} >Favs</p>
                        </div>
                    )}
                </NavLink>
                <NavLink to={"/follows"}>
                    {({ isActive }) => (
                        <div className='navItem'>
                            <FontAwesomeIcon icon={isActive ? faBellSolid : faBellRegular} />
                            <p>Subs</p>
                        </div>
                    )}  
                </NavLink>
                <NavLink onClick={()=>console.log(user)} to={user && user.userId ? `/user/${user.userId}` : '/a'} >
                    {({ isActive }) => (
                        <div className='navItem'>
                            <FontAwesomeIcon icon={isActive ? faUserSolid : faUserRegular} />
                            <p>User</p>
                        </div>
                    )}
                </NavLink>
            </div>
        </nav>
    )
}