const SpotifyWebApi = require('spotify-web-api-node');
const spotifyService = require('../services/spotifyService');

let mockSpotifyInstance;

jest.mock('spotify-web-api-node', () => {
  mockSpotifyInstance = {
    createAuthorizeURL: jest.fn().mockReturnValue('https://mock-auth-url'),
    setAccessToken: jest.fn(),
    authorizationCodeGrant: jest.fn().mockResolvedValue({
      body: {
        access_token: 'mock_access',
        refresh_token: 'mock_refresh',
        expires_in: 3600
      }
    }),
    getMe: jest.fn().mockResolvedValue({ body: { id: '123', email: 'a@a.com', display_name: 'Test User' } }),
    getMyTopArtists: jest.fn().mockResolvedValue({ body: { items: ['artist1'] } }),
    getMyTopTracks: jest.fn().mockResolvedValue({ body: { items: ['track1'] } }),
    getMyRecentlyPlayedTracks: jest.fn().mockResolvedValue({
      body: { items: [{ track: 'trackX', played_at: '2024-01-01T00:00:00Z' }] }
    }),
  };
  return jest.fn(() => mockSpotifyInstance);
});

jest.mock('../models/User', () => {
  const mUser = jest.fn().mockImplementation(() => ({ save: jest.fn() }));
  mUser.findOne = jest.fn();
  return mUser;
});
const User = require('../models/User');

describe('SpotifyService', () => {
  test('getAuthUrl: doğru URL döner', () => {
    const url = spotifyService.getAuthUrl();
    expect(url).toBe('https://mock-auth-url');
    expect(mockSpotifyInstance.createAuthorizeURL).toHaveBeenCalled();
  });

  test('getAccessToken: token verisi döner', async () => {
    const token = await spotifyService.getAccessToken('code123');
    expect(token.access_token).toBe('mock_access');
    expect(token.refresh_token).toBe('mock_refresh');
    expect(token.expires_in).toBe(3600);
    expect(mockSpotifyInstance.authorizationCodeGrant).toHaveBeenCalledWith('code123');
  });

  test('setAccessToken: token set eder', () => {
    spotifyService.setAccessToken('abc123');
    expect(mockSpotifyInstance.setAccessToken).toHaveBeenCalledWith('abc123');
  });

  test('getUserData: kullanıcı verisi döner', async () => {
    const result = await spotifyService.getUserData('abc123');
    expect(mockSpotifyInstance.setAccessToken).toHaveBeenCalledWith('abc123');
    expect(result.topArtists).toEqual(['artist1']);
    expect(result.topTracks).toEqual(['track1']);
    expect(result.recentlyPlayed[0].track).toBe('trackX');
  });

  test('saveUser: yeni kullanıcı ekler', async () => {
    User.findOne.mockResolvedValue(null);
    const fakeUser = {
      profile: { id: '123', email: 'a@a.com', display_name: 'Test User' },
      topArtists: [],
      topTracks: [],
      recentlyPlayed: []
    };
    const savedUser = await spotifyService.saveUser(fakeUser, {
      access_token: 'x',
      refresh_token: 'y'
    });

    expect(User).toHaveBeenCalledWith(expect.objectContaining({
      spotifyId: '123',
      email: 'a@a.com'
    }));
    expect(savedUser.save).toHaveBeenCalled();
  });

  test('saveUser: mevcut kullanıcıyı günceller', async () => {
    const existingUser = {
      save: jest.fn()
    };
    User.findOne.mockResolvedValue(existingUser);
    const fakeUser = {
      profile: { id: '123', email: 'a@a.com', display_name: 'Test User' },
      topArtists: [],
      topTracks: [],
      recentlyPlayed: []
    };
    const savedUser = await spotifyService.saveUser(fakeUser, {
      access_token: 'x',
      refresh_token: 'y'
    });

    expect(savedUser.save).toHaveBeenCalled();
  });
});
