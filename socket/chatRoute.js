const Chat = require('./chat');

module.exports = (io, app) => {
  const chat = new Chat(io);
  app.use((req, res, next) => {
    req.chat = chat;
    next();
  });
};
