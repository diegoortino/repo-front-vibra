import Header from "./components/header";
import { Footer } from "./components/footer";
import { BrowserRouter } from "react-router-dom";
import { Main } from "./components/Main";
import { Waves } from "./components/Waves";

function App() {
  return (
      <BrowserRouter>
        <Waves/>
        <Header></Header>
        <Main/>
        <Footer></Footer>    
      </BrowserRouter>
  );
}

export default App;
