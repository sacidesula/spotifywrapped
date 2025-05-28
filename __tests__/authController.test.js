const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');
const SpotifyService = require('../services/spotifyService');
const User = require('../models/User');

// MOCK
jest.mock('../services/spotifyService');
jest.mock('../models/User');

const app = express();
app.use('/api/auth', authRoutes);

// 🔇 Konsol çıktıları susturuldu
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Auth Controller - callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle successful Spotify callback', async () => {
    SpotifyService.getAccessToken.mockResolvedValue({ access_token: 'test-token', refresh_token: 'refresh-token' });
    SpotifyService.getUserData.mockResolvedValue({
      profile: { id: 'spotify123', email: 'test@example.com', display_name: 'Test User' },
      topArtists: [],
      topTracks: [],
      recentlyPlayed: [],
    });

    const mockUser = {
      _id: '123',
      save: jest.fn(),
    };
    User.findOne.mockResolvedValue(null);
    User.mockImplementation(() => mockUser);

    const res = await request(app).get('/api/auth/callback?code=dummycode');

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('http://localhost:5173/wrapped?userId=123');
    expect(mockUser.save).toHaveBeenCalled();
  });

  test('should return 500 if Spotify API fails', async () => {
    SpotifyService.getAccessToken.mockRejectedValue(new Error('Spotify hata'));

    const res = await request(app).get('/api/auth/callback?code=invalid');

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error', 'Giriş işlemi başarısız');
  });
});
