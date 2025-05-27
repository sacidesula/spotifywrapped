import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600">
      <div className="relative w-[375px] h-[667px] border-8 border-black rounded-[40px] bg-black bg-opacity-60 text-white p-4 flex flex-col justify-center items-center overflow-hidden shadow-xl">

        <h2 className="text-sm font-light tracking-widest uppercase mb-4">{story.title}</h2>

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
            <p className="text-xl font-bold text-center mb-1">{story.data.name}</p>
            <p className="text-sm text-gray-300 text-center">
              {story.data.artists?.map((a: any) => a.name).join(', ')}
            </p>
          </>
        )}

        {story.type === 'topArtist' && (
          <p className="text-xl font-semibold mt-4">{story.artistName}</p>
        )}

        {story.type === 'mlCluster' && (
          <div className="text-center mt-4">
            <p className="text-xl font-bold mb-2">🎧 Müzik Tarzın</p>
            <p className="text-sm text-gray-200">{story.genres?.join(', ')}</p>
          </div>
        )}

        <div className="absolute bottom-6 left-0 right-0 flex justify-between px-8">
          <button
            onClick={handlePrev}
            className={`bg-white bg-opacity-20 px-4 py-1 rounded-full ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            disabled={currentIndex === 0}
          >
            ◀
          </button>
          <button
            onClick={handleNext}
            className={`bg-white bg-opacity-20 px-4 py-1 rounded-full ${currentIndex === wrappedData.stories.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
            disabled={currentIndex === wrappedData.stories.length - 1}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wrapped;
