const mongoose = require('mongoose');

const mundoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  puerto: { type: Number, required: true },
  ram: { type: Number, required: true },
  estado: { type: String, default: "apagado" },
  jugadores: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  
});

module.exports = mongoose.model('Mundo', mundoSchema);
