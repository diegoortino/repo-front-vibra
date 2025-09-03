import { Route, Routes } from "react-router-dom";
import Home from "./home";
import { Vibra } from "./Vibra";
import How from "./How";
import { Contact } from "./Contact";
import { Login } from "./Login";

export function Main(){

    return (
        <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/vibra" element={<Vibra/>} />
            <Route path="/how" element={<How/>}/>
            <Route path="contact" element={<Contact/>}/>
            <Route path="login" element={<Login/>}/>
        </Routes>
    )
}