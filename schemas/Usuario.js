const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  limiteMundos: { type: Number, default: 1 } // ← por defecto 1 mundo
});

module.exports = mongoose.model('Usuario', usuarioSchema);
