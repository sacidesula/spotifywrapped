import 'swiper/css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login'; // Login componentin yolu (dosya adı küçük harf mi büyük harf mi kontrol et)
import Wrapped from './pages/wrapped'; // Wrapped componentin yolu


function App() {
  return (
    <Router>
      <Routes>
        {/* Ana sayfa "/" olarak login ekranını göster */}
        <Route path="/" element={<Login />} />

        {/* Eğer istersen /login yolu da login ekranını gösterebilir (opsiyonel, / ile aynı) */}
        {/* <Route path="/login" element={<Login />} /> */}

        {/* Wrapped sayfan */}
        <Route path="/wrapped" element={<Wrapped />} />

        {/* Diğer route'lar buraya eklenebilir */}
      </Routes>
    </Router>
  );
}

export default App;