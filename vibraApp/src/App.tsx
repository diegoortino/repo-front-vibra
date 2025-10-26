/* 
  App.tsx
 */
/* Dependencies  */

import MusicProvider from './context/MusicProvider';


/* Components */
import Main from './components/Main'
import { Waves } from './components/Waves'
import { Sidebar} from './components/Sidebar'
import { MusicPlayer} from './components/MusicPlayer'

/* types */

/* styles */
import './App.css'

function App() {
  return (
      <MusicProvider>
        <Waves />
        <Sidebar />
        <Main />
        <MusicPlayer />
      </MusicProvider>
  );
}

export default App;