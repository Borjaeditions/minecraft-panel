module.exports = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://mongodb:27017/minecraftpanel',
  JWT_SECRET: process.env.JWT_SECRET || 'borja_super_secreto'
};
