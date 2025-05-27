const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true, unique: true },
  email: String,
  displayName: String,
  accessToken: String,
  refreshToken: String,
  topArtists: Array,
  topTracks: Array,
  recentlyPlayed: Array,
  
  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);