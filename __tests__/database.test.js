const mongoose = require('mongoose');
const connectDB = require('../config/database');

beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
// process.exit yerine fake fonksiyon kullanalım
jest.spyOn(process, 'exit').mockImplementation(() => {});
jest.mock('mongoose');

describe('Database Connection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should connect to MongoDB successfully', async () => {
    mongoose.connect.mockResolvedValueOnce();

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  test('should exit process if connection fails', async () => {
    mongoose.connect.mockRejectedValueOnce(new Error('DB Error'));

    await connectDB();

    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
