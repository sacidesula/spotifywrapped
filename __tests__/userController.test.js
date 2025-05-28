const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const User = require('../models/User');

jest.mock('../models/User');

const app = express();
app.use('/api/user', userRoutes);

// Konsol logları susturulsun
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('User Controller - getWrappedData', () => {
  test('should return wrapped data if user exists', async () => {
    User.findById.mockResolvedValue({
      displayName: 'Test Kullanıcı',
      email: 'test@mail.com',
      topTracks: [{
        name: 'Track 1',
        album: { images: [{ url: 'img_url' }] },
        artists: [{ name: 'Artist A' }]
      }],
      topArtists: [{
        name: 'Artist X',
        images: [{ url: 'artist_img' }],
        genres: ['pop']
      }]
    });

    const res = await request(app).get('/api/user/wrapped/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.user.displayName).toBe('Test Kullanıcı');
    expect(res.body.stories.length).toBe(2);
  });

  test('should return 404 if user not found', async () => {
    User.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/user/wrapped/999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Kullanıcı bulunamadı');
  });

  test('should return 500 on database error', async () => {
    User.findById.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/user/wrapped/err');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error', 'Wrapped verisi alınamadı');
  });
});
