import { Maximize2, Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCall } from '../context/CallContext.jsx';

function StreamVideo({ stream, muted, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);
  return <video ref={ref} className={className} autoPlay playsInline muted={muted} />;
}

export default function CallOverlay() {
  const { call, localStream, remoteStream, acceptCall, rejectCall, endCall, toggleMic, toggleCamera, shareScreen, connectionState } = useCall();
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);

  if (!call) return null;

  return (
    <div className="call-overlay">
      <div className="call-stage glass-panel">
        <StreamVideo stream={remoteStream} className="remote-video" />
        <StreamVideo stream={localStream} muted className="local-video" />
        <div className="call-status">
          <strong>{call.direction === 'incoming' ? `${call.fromUser?.email || 'Someone'} is calling` : 'Calling...'}</strong>
          <span>{connectionState}</span>
        </div>
        {call.direction === 'incoming' && call.status === 'ringing' ? (
          <div className="call-actions">
            <button className="call-accept" type="button" onClick={acceptCall}>Accept</button>
            <button className="call-end" type="button" onClick={rejectCall}>Decline</button>
          </div>
        ) : (
          <div className="call-actions">
            <button type="button" onClick={() => {
              setMic(!mic);
              toggleMic(!mic);
            }}>{mic ? <Mic size={20} /> : <MicOff size={20} />}</button>
            <button type="button" onClick={() => {
              setCamera(!camera);
              toggleCamera(!camera);
            }}>{camera ? <Video size={20} /> : <VideoOff size={20} />}</button>
            <button type="button" onClick={shareScreen}><MonitorUp size={20} /></button>
            <button type="button"><Maximize2 size={20} /></button>
            <button className="call-end" type="button" onClick={endCall}><PhoneOff size={20} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
