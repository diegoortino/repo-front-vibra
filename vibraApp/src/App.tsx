import './App.css'
import { Main } from './components/Main'
import { MusicPlayer } from './components/MusicPlayer'
import { Sidebar } from './components/Sidebar'
import { Waves } from './components/Waves'
import MusicProvider from './context/MusicProvider';

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

export default App
