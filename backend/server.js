import http from 'node:http';
import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { initSocket } from './src/socket/index.js';

const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

server.listen(env.PORT, () => {
  console.log(`TELEchat API listening on :${env.PORT}`);
});
