import { env } from '../config/env.js';

export function getIceServers() {
  const servers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] }];
  if (env.TURN_URL) {
    servers.push({ urls: env.TURN_URL, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL });
  }
  return servers;
}
