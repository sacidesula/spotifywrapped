const SpotifyWebApi = require('spotify-web-api-node');
const User = require('../models/User');

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.REDIRECT_URI
    });
  }

  getAuthUrl() {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'user-library-read',
      'playlist-read-private',
      'user-read-playback-state',
      'user-read-currently-playing'
    ];
    return this.spotifyApi.createAuthorizeURL(scopes);
  }

  async getAccessToken(code) {
    const data = await this.spotifyApi.authorizationCodeGrant(code);
    return {
      access_token: data.body.access_token,
      refresh_token: data.body.refresh_token,
      expires_in: data.body.expires_in
    };
  }

  setAccessToken(token) {
    this.spotifyApi.setAccessToken(token);
  }

  async getUserData(accessToken) {
  try {
    this.spotifyApi.setAccessToken(accessToken);

    const [profile, topArtists, topTracks, recentlyPlayed] = await Promise.all([
      this.spotifyApi.getMe(),
      this.spotifyApi.getMyTopArtists({ limit: 20 }),
      this.spotifyApi.getMyTopTracks({ limit: 20 }),
      this.spotifyApi.getMyRecentlyPlayedTracks({ limit: 20 })
    ]);

    // Get track IDs for audio features
    // Ses Özellikleri çağrısını geçici olarak kaldırın veya yorum satırı yapın
    //const trackIds = topTracks.body.items.map(track => track.id);
    //const audioFeaturesData = await this.spotifyApi.getAudioFeaturesForTracks(trackIds);

    // Process recently played tracks to include played_at timestamp
    const processedRecentlyPlayed = recentlyPlayed.body.items.map(item => ({
      track: item.track,
      played_at: item.played_at
    }));

    return {
      profile: profile.body,
      topArtists: topArtists.body.items,
      topTracks: topTracks.body.items,
      //audioFeatures: audioFeaturesData.body.audio_features,
      recentlyPlayed: processedRecentlyPlayed
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
} 

  async saveUser(userData, tokenData) {
    let user = await User.findOne({ spotifyId: userData.profile.id });
    if (!user) {
      user = new User({
        spotifyId: userData.profile.id,
        email: userData.profile.email,
        displayName: userData.profile.display_name,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        topArtists: userData.topArtists,
        topTracks: userData.topTracks,
        recentlyPlayed: userData.recentlyPlayed,
        //audioFeatures: userData.audioFeatures
      });
    } else {
      user.accessToken = tokenData.access_token;
      user.refreshToken = tokenData.refresh_token;
      user.topArtists = userData.topArtists;
      user.topTracks = userData.topTracks;
      user.recentlyPlayed = userData.recentlyPlayed;
      //user.audioFeatures = userData.audioFeatures;
    }
    await user.save();
    return user;
  }
}

module.exports = new SpotifyService();