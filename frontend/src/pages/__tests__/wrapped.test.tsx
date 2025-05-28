import { render, screen } from '@testing-library/react';
import Wrapped from '../wrapped';
import { MemoryRouter } from 'react-router-dom';

// Ortak mock veri
const mockWrappedData = {
  user: {
    displayName: 'Test User',
    email: 'test@example.com',
  },
  stories: [
    { type: 'topTrack', title: 'Track 1', data: { name: 'Şarkı 1', artists: [{ name: 'Sanatçı 1' }, { name: 'Sanatçı 2' }] } },
    { type: 'topArtist', title: 'Artist 2', artistName: 'Sanatçı 2', data: {} },
    { type: 'mlCluster', title: 'Tarzlar', genres: ['pop', 'rock'], data: {} },
  ],
};

// fetch global mock
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockWrappedData),
  })
));

describe('Wrapped bileşeni', () => {
  test('Kullanıcı ID yoksa hata mesajı gösterir', () => {
    render(
      <MemoryRouter initialEntries={['/wrapped']}>
        <Wrapped />
      </MemoryRouter>
    );
    expect(screen.getByText(/Kullanıcı ID bulunamadı/i)).toBeInTheDocument();
  });

  test('Kullanıcı ID varsa yükleniyor mesajı görünür', () => {
    render(
      <MemoryRouter initialEntries={['/wrapped?userId=test']}>
        <Wrapped />
      </MemoryRouter>
    );
    expect(screen.getByText(/Yükleniyor/i)).toBeInTheDocument();
  });

  test('Veri geldiğinde hikaye başlığı ve içerik görünür', async () => {
    render(
      <MemoryRouter initialEntries={['/wrapped?userId=test123']}>
        <Wrapped />
      </MemoryRouter>
    );

    const heading = await screen.findByText('Track 1');
    expect(heading).toBeInTheDocument();

    const trackName = screen.getByText('Şarkı 1');
    const artists = screen.getByText('Sanatçı 1, Sanatçı 2');
    expect(trackName).toBeInTheDocument();
    expect(artists).toBeInTheDocument();
  });
});
