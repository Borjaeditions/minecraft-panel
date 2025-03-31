const Mundo = require('../schemas/Mundo');

async function generarPuertoUnico() {
  const min = 30000;
  const max = 40000;
  const maxIntentos = 50;

  for (let i = 0; i < maxIntentos; i++) {
    const puerto = Math.floor(Math.random() * (max - min) + min);
    const existente = await Mundo.findOne({ puerto });
    if (!existente) {
      return puerto;
    }
  }

  throw new Error("No se pudo encontrar un puerto disponible");
}

module.exports = generarPuertoUnico;