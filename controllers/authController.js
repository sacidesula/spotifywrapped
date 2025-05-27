// controllers/authController.js
const User = require('../models/User');
const SpotifyService = require('../services/spotifyService');

class AuthController {
  login(req, res) {
    const authUrl = SpotifyService.getAuthUrl();
    res.redirect(authUrl);
  }

  async callback(req, res) {
    try {
      const { code } = req.query;
      const tokenData = await SpotifyService.getAccessToken(code);
      SpotifyService.setAccessToken(tokenData.access_token);
      const userData = await SpotifyService.getUserData(tokenData.access_token);

      let user = await User.findOne({ spotifyId: userData.profile.id });

      if (!user) {
        user = new User({
          spotifyId: userData.profile.id,
          email: userData.profile.email,
          displayName: userData.profile.display_name,
        });
      }

      user.accessToken = tokenData.access_token;
      user.refreshToken = tokenData.refresh_token;
      user.topArtists = userData.topArtists;
      user.topTracks = userData.topTracks;
      user.recentlyPlayed = userData.recentlyPlayed;

      await user.save();
      console.log("Frontende yönlendir");

      res.redirect(`http://localhost:5173/wrapped?userId=${user._id}`);
    } catch (error) {
      console.error("🔴 authController.callback:", error);
      res.status(500).json({ error: "Giriş işlemi başarısız" });
    }
  }
}

module.exports = new AuthController();
