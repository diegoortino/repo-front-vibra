import './App.css'
import { Main } from './components/Main'
import { MusicPlayer } from './components/MusicPlayer'
import { Sidebar } from './components/Sidebar'
import { MusicProvider } from './context'

function App() {
  return (
    <MusicProvider>
      <Sidebar />
      <Main />
      <MusicPlayer />
    </MusicProvider>
  );
}

export default App
