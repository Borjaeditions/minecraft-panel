const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('./schemas/Usuario');
const Mundo = require('./schemas/Mundo');
const connectDB = require('./db/connect');
const { PORT, JWT_SECRET } = require('./config/config');
const path = require('path');
const generarPuertoUnico = require('./utils/puerto');

require('dotenv').config(); // si usas .env
require('./db/mongo');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'www')));
const crypto = require('crypto');
const { exec } = require('child_process');

connectDB();

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new Usuario({ username, passwordHash });
  await user.save();
  res.redirect('/login.html');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await Usuario.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).send('Credenciales incorrectas');
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  res.json({ token });
});

app.get('/mundos', async (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  try {
    const { userId } = jwt.verify(auth, JWT_SECRET);
    const mundos = await Mundo.find({ owner: userId });
    res.json(mundos);
  } catch (error) {
    console.error("❌ Error de token:", error.message);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
  
});
app.post('/crear-mundo', async (req, res) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    const { userId } = jwt.verify(auth, JWT_SECRET);
    const usuario = await Usuario.findById(userId);
    const mundosActuales = await Mundo.countDocuments({ owner: userId });

    if (mundosActuales >= usuario.limiteMundos) {
      return res.status(403).send("❌ Límite de mundos alcanzado");
    }

    const { nombre, memoria, jugadores } = req.body;

    const puerto = await generarPuertoUnico();

    const mundo = new Mundo({
      nombre,
      memoria,
      jugadores,
      puerto,
      owner: userId,
      status: 'stopped'
    });

    await mundo.save();

    await crearContenedorDocker(mundo); // Esperar a que termine antes de responder
    res.status(201).json({ message: "Mundo creado" });

  } catch (err) {
    console.error("❌ Error al crear mundo:", err);
    res.status(500).send("Error al crear mundo");
  }
  
});



app.listen(PORT, () => console.log(`Servidor Node corriendo en el puerto ${PORT}`));

// Clave secreta (debe coincidir con la que pongas en GitHub)
const WEBHOOK_SECRET = 'borja-super-secreto';

// Middleware para leer texto plano
app.use('/webhook', express.raw({ type: '*/*' }));

app.post('/webhook', (req, res) => {
  const sig = req.headers['x-hub-signature-256'];

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(req.body);
  const digest = `sha256=${hmac.digest('hex')}`;

  if (sig !== digest) {
    console.log('❌ Firma inválida de GitHub');
    return res.status(401).send('Firma inválida');
  }

  console.log('✅ Webhook recibido. Ejecutando deploy...');
  exec('/home/borjaeditions/scripts/git-deploy.sh', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return res.status(500).send('Error al ejecutar script');
    }
    console.log(`🧾 Salida:\n${stdout}`);
    console.error(`⚠️ Stderr:\n${stderr}`);
    res.status(200).send('Despliegue iniciado');
  });
});

app.patch('/mundo/:id/running', async (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  const { userId } = jwt.verify(auth, JWT_SECRET);
  const mundo = await Mundo.findOne({ _id: req.params.id, owner: userId });
  if (!mundo) return res.status(404).send('Mundo no encontrado');

  mundo.status = 'running';
  await mundo.save();

  // ✅ Llamar al servicio local del host
  await fetch('http://host.docker.internal:5050/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: mundo.nombre,
      puerto: mundo.puerto,
      memoria: mundo.memoria
    })
  });

  res.send('Mundo encendido');
});


app.patch('/mundo/:id/stopped', async (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  const { userId } = jwt.verify(auth, JWT_SECRET);
  const mundo = await Mundo.findOne({ _id: req.params.id, owner: userId });
  if (!mundo) return res.status(404).send('Mundo no encontrado');

  mundo.status = 'stopped';
  await mundo.save();

  // ✅ Llamar al servicio del host para detener el contenedor
  await fetch('http://host.docker.internal:5050/detener', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: mundo.nombre })
  });

  res.send('Mundo apagado');
});

app.patch('/mundo/:id/jugadores', async (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  const { userId } = jwt.verify(auth, JWT_SECRET);

  const mundo = await Mundo.findOne({ _id: req.params.id, owner: userId });
  if (!mundo) return res.status(404).send('Mundo no encontrado');

  mundo.jugadores = req.body.jugadores;
  await mundo.save();

  res.send('Jugadores actualizados');
});

function crearContenedorDocker(mundo) {
  const { nombre, puerto, memoria } = mundo;
  const comando = `/scripts/crear-contenedor.sh "${nombre}" "${puerto}" "${memoria}"`;

  exec(comando, (err, stdout, stderr) => {
    if (err) {
      console.error(`❌ Error al ejecutar el script: ${err.message}`);
    } else {
      console.log(`✅ Script ejecutado:\n${stdout}`);
    }

    if (stderr) {
      console.warn(`⚠️ STDERR:\n${stderr}`);
    }
  });
}


