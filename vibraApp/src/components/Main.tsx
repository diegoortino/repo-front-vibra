import { Route, Routes } from "react-router-dom";
import Profile from "./UserPage/Profile"
import Favorites from "./FavPage/FavoritePage";

export function Main(){
    return(
        <div>
            <Routes>
                <Route path="/account" element={<Profile/>} />
                <Route path="/favorites" element={<Favorites/>} />
            </Routes>
        </div>

    )
}