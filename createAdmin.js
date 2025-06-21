// createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/AdminAuth'); // adjust path if needed

mongoose.connect('mongodb://localhost:27017/mediqueue', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('Mediqueue@08', 10);

    await Admin.create({
      email: 'admin@mediqueue.com'.toLowerCase(),
      password: hashedPassword,
    });

    console.log('Admin created successfully');
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    mongoose.connection.close();
  }
})();
