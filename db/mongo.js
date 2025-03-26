const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/config');

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Conexión a MongoDB exitosa');
}).catch((err) => {
  console.error('❌ Error al conectar con MongoDB:', err);
});
