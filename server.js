const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('./schemas/Usuario');
const Mundo = require('./schemas/Mundo');
const connectDB = require('./db/connect');
const { PORT, JWT_SECRET } = require('./config/config');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'www')));

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
  const { userId } = jwt.verify(auth, JWT_SECRET);
  const mundos = await Mundo.find({ owner: userId });
  res.json(mundos);
});

app.listen(PORT, () => console.log(`Servidor Node corriendo en el puerto ${PORT}`));
