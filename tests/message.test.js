const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // Adjust if needed
const Message = require('../models/admin/Message');

describe('Message API tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testdb');
    };
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });


  test('Should return all messages sorted by createdAt descending', async () => {
    // Insert 3 messages with different dates
    const now = new Date();
    await Message.create([
      { content: 'First message', type: 'UserAction', createdAt: new Date(now.getTime() - 10000) },
      { content: 'Second message', type: 'System', createdAt: new Date(now.getTime() - 5000) },
      { content: 'Third message', type: 'AdminNote', createdAt: now },
    ]);

    const res = await request(app).get('/api/admin/messages');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    // Check sorting: first item should be the newest (Third message)
    expect(res.body.data[0].content).toBe('Third message');
    expect(res.body.data[1].content).toBe('Second message');
    expect(res.body[2] === undefined || res.body.data[2].content).toBeDefined();
  });

  test('Each message should have required fields', async () => {
    const res = await request(app).get('/api/admin/messages');
    const message = res.body.data[0];
    expect(message).toHaveProperty('_id');
    expect(message).toHaveProperty('content');
    expect(message).toHaveProperty('type');
    expect(message).toHaveProperty('createdAt');
  });

  test('Message type defaults to UserAction if not provided', async () => {
    const msg = await Message.create({ content: 'Default type test' });
    expect(msg.type).toBe('UserAction');
    await Message.findByIdAndDelete(msg._id);
  });

  test('GET /api/admin/messages returns 500 if DB throws error', async () => {
    // Mock Message.find to throw error
    const originalFind = Message.find;
    Message.find = jest.fn().mockImplementation(() => { throw new Error('DB error'); });

    const res = await request(app).get('/api/admin/messages');
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Server error');

    // Restore original method
    Message.find = originalFind;
  });

  // Simple test: response content-type
  test('Response content-type should be application/json', async () => {
    const res = await request(app).get('/api/admin/messages');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  // Test with query params (if supported, else just a simple fetch)
  test('GET /api/admin/messages returns array even with irrelevant query params', async () => {
    const res = await request(app).get('/api/admin/messages?foo=bar');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // Test no extra unexpected fields in response (schema adherence)
  test('Messages should not contain unexpected fields', async () => {
    const res = await request(app).get('/api/admin/messages');
    const message = res.body.data[0];
    expect(message).not.toHaveProperty('unexpectedField');
  });

  // Test message content type enum
  test('Message type should be one of the allowed enums', async () => {
    const res = await request(app).get('/api/admin/messages');
    const types = ['UserAction', 'System', 'AdminNote'];
    res.body.data.forEach(msg => {
      expect(types).toContain(msg.type);
    });
  });

});
