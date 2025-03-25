const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/config');

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('? MongoDB conectado');
  } catch (error) {
    console.error('? Error al conectar a MongoDB:', error);
  }
};

module.exports = connectDB;
