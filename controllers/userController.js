// controllers/userController.js
const User = require('../models/User');

class UserController {
  async getWrappedData(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      const wrappedData = {
        user: {
          displayName: user.displayName,
          email: user.email
        },
        stories: [
          {
            type: 'topTrack',
            title: 'Bu Yıl En Çok Dinlediğin Şarkı',
            data: user.topTracks[0],
            image: user.topTracks[0]?.album?.images[0]?.url,
            artist: user.topTracks[0]?.artists[0]?.name,
            trackName: user.topTracks[0]?.name
          },
          {
            type: 'topArtist',
            title: 'Dinlemeye Doyamadığın Sanatçı',
            data: user.topArtists[0],
            image: user.topArtists[0]?.images[0]?.url,
            artistName: user.topArtists[0]?.name,
            genres: user.topArtists[0]?.genres
          }
        ]
      };

      res.json(wrappedData);
    } catch (error) {
      console.error("🔴 Wrapped verisi alınırken hata:", error);
      res.status(500).json({ error: "Wrapped verisi alınamadı" });
    }
  }
}

module.exports = new UserController();
