import { Route, Routes } from "react-router-dom";
import Profile from "./UserPage/Profile"

export function Main(){
    return(
        <div>
            <Routes>
                <Route path="/account" element={<Profile/>} />
            </Routes>
        </div>

    )
}