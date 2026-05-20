export const defaultIceServers = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] }
];

export function createPeerConnection({ iceServers = defaultIceServers, onIceCandidate, onTrack, onState }) {
  const peer = new RTCPeerConnection({ iceServers });
  peer.onicecandidate = (event) => {
    if (event.candidate) onIceCandidate?.(event.candidate);
  };
  peer.ontrack = (event) => onTrack?.(event.streams[0]);
  peer.onconnectionstatechange = () => onState?.(peer.connectionState);
  return peer;
}

export async function getMediaStream({ video = true, audio = true } = {}) {
  return navigator.mediaDevices.getUserMedia({
    video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false
  });
}

export async function getScreenStream() {
  return navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
}

export function replaceTrack(peer, stream, kind) {
  const sender = peer.getSenders().find((item) => item.track?.kind === kind);
  const track = stream.getTracks().find((item) => item.kind === kind);
  if (sender && track) return sender.replaceTrack(track);
  return Promise.resolve();
}
