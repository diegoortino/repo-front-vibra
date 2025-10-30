import './App.css'
import Main from './components/Main'
import { MusicPlayer }  from './components/MusicPlayer'
import { Sidebar } from './components/Sidebar'
import { Waves } from './components/Waves'
import { UserProvider } from './context/currentUserContext'
import { MusicProvider } from './context/MusicContext';

function App() {
  return (
    <UserProvider>
      <MusicProvider>
        <Waves />
        <Sidebar />
        <Main />
        <MusicPlayer />
      </MusicProvider>
    </UserProvider>
  );
}

export default App
