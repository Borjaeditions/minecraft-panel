const mongoose = require('mongoose');

const MundoSchema = new mongoose.Schema({
  nombre: String,
  puerto: Number,
  memoria: String,
  jugadores: [String],
  status: { type: String, enum: ['running', 'stopped'], default: 'stopped' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
});

module.exports = mongoose.model('Mundo', MundoSchema);
