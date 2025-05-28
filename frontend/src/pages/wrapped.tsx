import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import bgImage from '../assets/images2.png';

interface StoryData {
  type: string;
  title: string;
  data: any;
  image?: string;
  artist?: string;
  trackName?: string;
  artistName?: string;
  genres?: string[];
}

interface WrappedApiResponse {
  user: {
    displayName: string;
    email: string;
  };
  stories: StoryData[];
}

const Wrapped = () => {
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [wrappedData, setWrappedData] = useState<WrappedApiResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('userId');
    if (id) setUserId(id);
    else {
      setError("Kullanıcı ID bulunamadı.");
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    fetch(`http://localhost:3001/api/user/wrapped/${userId}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then((data: WrappedApiResponse) => {
        setWrappedData(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Wrapped verileri yüklenirken bir hata oluştu.");
        setLoading(false);
      });
  }, [userId]);

  const handleNext = () => {
    if (wrappedData && currentIndex < wrappedData.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Yükleniyor...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-500">{error}</div>;
  if (!wrappedData || !wrappedData.stories.length) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-500">Veri bulunamadı.</div>;

  const story = wrappedData.stories[currentIndex];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-xl bg-white bg-opacity-90 !text-black rounded-lg shadow-lg p-8 text-center">
        <h2 style={{ color: 'black' }} className="text-xs font-light tracking-widest uppercase mb-4  mx-auto">
  {story.title}
</h2>


        

        {story.image && (
         <img
    src={story.image}
    alt="story"
    className="w-20 h-20 object-cover rounded-lg mb-4 shadow-md"
    style={{ maxWidth: '360px', maxHeight: '360px' }}
  />
        )}

        {story.type === 'topTrack' && story.data?.name && (
          <>
            <p className="text-2xl font-bold mb-1">{story.data.name}</p>
            <p className="text-sm text-gray-300">
              {story.data.artists?.map((a: any) => a.name).join(', ')}
            </p>
          </>
        )}

        {story.type === 'topArtist' && (
          <p className="text-2xl font-semibold mt-4">{story.artistName}</p>
        )}

        {story.type === 'mlCluster' && (
          <div className="mt-4">
            <p className="text-xl font-bold mb-2">🎧 Müzik Tarzın</p>
            <p className="text-sm text-gray-200">{story.genres?.join(', ')}</p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={handlePrev}
            className={`bg-black text-white px-5 py-2 rounded-full border border-white transition ${
              currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'
            }`}
            disabled={currentIndex === 0}
          >
            ◀ Geri
          </button>
          <button
            onClick={handleNext}
            className={`bg-black text-white px-5 py-2 rounded-full border border-white transition ${
              currentIndex === wrappedData.stories.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:text-black'
            }`}
            disabled={currentIndex === wrappedData.stories.length - 1}
          >
            İleri ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wrapped;