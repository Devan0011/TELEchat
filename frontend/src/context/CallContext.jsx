import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPeerConnection, getMediaStream, getScreenStream, replaceTrack } from '../services/webrtc.js';
import { useSocket } from './SocketContext.jsx';
import { useAuthStore } from '../store/useAuthStore.js';

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { socket, emit } = useSocket() || {};
  const user = useAuthStore((state) => state.user);
  const peerRef = useRef(null);
  const [call, setCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('idle');

  const cleanup = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCall(null);
    setConnectionState('idle');
  }, [localStream]);

  const makePeer = useCallback(
    (callId, toUserId) =>
      createPeerConnection({
        onIceCandidate: (candidate) => emit?.('call:ice-candidate', { callId, toUserId, candidate }),
        onTrack: setRemoteStream,
        onState: setConnectionState
      }),
    [emit]
  );

  const startCall = useCallback(
    async ({ toUserId, chatId, video = true }) => {
      const stream = await getMediaStream({ video, audio: true });
      setLocalStream(stream);
      const callId = crypto.randomUUID();
      const peer = makePeer(callId, toUserId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peerRef.current = peer;
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      setCall({ id: callId, chatId, peerId: toUserId, direction: 'outgoing', video, status: 'ringing' });
      emit?.('call:offer', { callId, toUserId, chatId, fromUser: user, offer, video });
    },
    [emit, makePeer, user]
  );

  const acceptCall = useCallback(async () => {
    if (!call?.offer) return;
    const stream = await getMediaStream({ video: call.video, audio: true });
    setLocalStream(stream);
    const peer = makePeer(call.id, call.fromUser.id);
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peerRef.current = peer;
    await peer.setRemoteDescription(new RTCSessionDescription(call.offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    emit?.('call:answer', { callId: call.id, toUserId: call.fromUser.id, answer });
    setCall((current) => ({ ...current, status: 'active' }));
  }, [call, emit, makePeer]);

  const toggleTrack = useCallback((kind, enabled) => {
    localStream?.getTracks().filter((track) => track.kind === kind).forEach((track) => {
      track.enabled = enabled;
    });
  }, [localStream]);

  const shareScreen = useCallback(async () => {
    if (!peerRef.current) return;
    const screen = await getScreenStream();
    await replaceTrack(peerRef.current, screen, 'video');
    setLocalStream(screen);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    socket.on('call:incoming', (payload) => setCall({ ...payload, direction: 'incoming', status: 'ringing' }));
    socket.on('call:answer', async ({ answer }) => {
      await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
      setCall((current) => (current ? { ...current, status: 'active' } : current));
    });
    socket.on('call:ice-candidate', async ({ candidate }) => {
      await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });
    socket.on('call:end', cleanup);
    return () => {
      socket.off('call:incoming');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:end');
    };
  }, [cleanup, socket]);

  const value = useMemo(
    () => ({
      call,
      localStream,
      remoteStream,
      connectionState,
      startCall,
      acceptCall,
      endCall: () => {
        if (call) emit?.('call:end', { callId: call.id, toUserId: call.peerId || call.fromUser?.id });
        cleanup();
      },
      rejectCall: () => {
        if (call) emit?.('call:reject', { callId: call.id, toUserId: call.fromUser?.id });
        cleanup();
      },
      toggleMic: (enabled) => toggleTrack('audio', enabled),
      toggleCamera: (enabled) => toggleTrack('video', enabled),
      shareScreen
    }),
    [acceptCall, call, cleanup, connectionState, emit, localStream, remoteStream, shareScreen, startCall, toggleTrack]
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export const useCall = () => useContext(CallContext);
