import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Coupons from './pages/Coupons';
import GameDetail from './pages/GameDetail';
import Characters from './pages/Characters';
import CharacterDetail from './pages/CharacterDetail';
import Play from './pages/Play';
import Resell from './pages/Resell';
import Memorial from './pages/Memorial';

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/games/:slug" element={<GameDetail />} />
            <Route path="/games/:slug/characters" element={<Characters />} />
            <Route path="/games/:slug/characters/:id" element={<CharacterDetail />} />
            <Route path="/games/:slug/play" element={<Play />} />
            <Route path="/play" element={<Play />} />
            <Route path="/resell" element={<Resell />} />
            <Route path="/resell/:gameSlug" element={<Resell />} />
            <Route path="/memorial" element={<Memorial />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
