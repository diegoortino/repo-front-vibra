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

export function Sidebar(){
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
                            <p>subs</p>
                        </div>
                    )}
                </NavLink>
                <NavLink to={"/account"}>
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