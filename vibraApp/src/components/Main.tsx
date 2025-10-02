import { Route, Routes } from "react-router-dom";
import Profile from "./UserPage/Profile"
import Favorites from "./FavPage/FavoritePage";
import './Main.css'
export function Main(){
    return(
        <div className="MainContainer">
            <Routes>
                <Route path="/account" element={<Profile/>} />
                <Route path="/favorites" element={<Favorites/>} />
            </Routes>
        </div>

    )
}