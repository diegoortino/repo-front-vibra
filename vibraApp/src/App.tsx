/* 
  App.tsx
 */
/* Dependencies  */

/* Context */
import MusicProvider from './context/MusicProvider';


/* Components */
import Waves from './components/layouts/Canvas'
import Header from './components/layouts/Header'
import Main from './components/Main'
import { Waves } from './components/Waves'
import { Sidebar} from './components/Sidebar'
import { MusicPlayer} from './components/MusicPlayer'

/* types */
<<<<<<< HEAD

/* styles */
import './App.css'
=======
>>>>>>> feature/homePage

function App() {
  return (
      <MusicProvider>
<<<<<<< HEAD
        <Waves />
        <Sidebar />
        <Main />
        <MusicPlayer />
=======
        <Waves/>
        <div className="page-container">
          <Header/>
          <Sidebar />
          <Main/>
          <MusicPlayer/>
        </div>  
>>>>>>> feature/homePage
      </MusicProvider>
  );
}

export default App;