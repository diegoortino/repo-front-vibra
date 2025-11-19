import Header from "./components/header";
import { Footer } from "./components/footer";
import { BrowserRouter } from "react-router-dom";
import { Main } from "./components/main";
import { Waves } from "./components/waves";
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "881144321895-esh95d9nnokqigh4dv20upmcfqvg9vjd.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <Waves/>
        <Header></Header>
        <Main/>
        <Footer></Footer>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
