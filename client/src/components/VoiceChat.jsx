import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../socket.js';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function VoiceChat({ roomCode }) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);
  const [peers, setPeers] = useState({});     // { peerId: { name, connected } }
  const [speaking, setSpeaking] = useState({}); // { peerId: bool }

  const localStreamRef = useRef(null);
  const pcsRef = useRef({});
  const audioCtxRef = useRef(null);
  const analyzersRef = useRef({});
  const audioElemsRef = useRef({});

  // ── Voice activity detection ───────────────────────
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(() => {
      const next = {};
      for (const [id, analyzer] of Object.entries(analyzersRef.current)) {
        const data = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        next[id] = avg > 12;
      }
      setSpeaking(next);
    }, 100);
    return () => clearInterval(interval);
  }, [joined]);

  const createPC = useCallback((peerId) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcsRef.current[peerId] = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t =>
        pc.addTrack(t, localStreamRef.current)
      );
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('webrtc:ice-candidate', { targetId: peerId, candidate });
      }
    };

    pc.ontrack = ({ streams }) => {
      const stream = streams[0];
      // Create audio element to play remote stream
      if (!audioElemsRef.current[peerId]) {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        audioElemsRef.current[peerId] = audio;
      }
      audioElemsRef.current[peerId].srcObject = stream;

      // Voice activity detection
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const src = audioCtxRef.current.createMediaStreamSource(stream);
      const analyzer = audioCtxRef.current.createAnalyser();
      analyzer.fftSize = 256;
      src.connect(analyzer);
      analyzersRef.current[peerId] = analyzer;
    };

    pc.onconnectionstatechange = () => {
      setPeers(prev => ({
        ...prev,
        [peerId]: { ...prev[peerId], connected: pc.connectionState === 'connected' }
      }));
    };

    return pc;
  }, []);

  // ── Cleanup a single peer ──────────────────────────
  const removePeer = useCallback((peerId) => {
    if (pcsRef.current[peerId]) {
      pcsRef.current[peerId].close();
      delete pcsRef.current[peerId];
    }
    delete analyzersRef.current[peerId];
    if (audioElemsRef.current[peerId]) {
      audioElemsRef.current[peerId].remove();
      delete audioElemsRef.current[peerId];
    }
    setPeers(prev => { const n = { ...prev }; delete n[peerId]; return n; });
    setSpeaking(prev => { const n = { ...prev }; delete n[peerId]; return n; });
  }, []);

  // ── WebRTC signaling events ────────────────────────
  useEffect(() => {
    if (!joined) return;

    async function onPeerJoined({ peerId, peerName }) {
      setPeers(prev => ({ ...prev, [peerId]: { name: peerName, connected: false } }));
      const pc = createPC(peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:offer', { targetId: peerId, offer });
    }

    async function onOffer({ fromId, offer }) {
      let pc = pcsRef.current[fromId];
      if (!pc) pc = createPC(fromId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { targetId: fromId, answer });
    }

    async function onAnswer({ fromId, answer }) {
      const pc = pcsRef.current[fromId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async function onIce({ fromId, candidate }) {
      const pc = pcsRef.current[fromId];
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    }

    function onPeerLeft({ peerId }) {
      removePeer(peerId);
    }

    socket.on('webrtc:peer-joined', onPeerJoined);
    socket.on('webrtc:offer', onOffer);
    socket.on('webrtc:answer', onAnswer);
    socket.on('webrtc:ice-candidate', onIce);
    socket.on('webrtc:peer-left', onPeerLeft);

    return () => {
      socket.off('webrtc:peer-joined', onPeerJoined);
      socket.off('webrtc:offer', onOffer);
      socket.off('webrtc:answer', onAnswer);
      socket.off('webrtc:ice-candidate', onIce);
      socket.off('webrtc:peer-left', onPeerLeft);
    };
  }, [joined, createPC, removePeer, roomCode]);

  // ── Actions ────────────────────────────────────────
  async function joinVoice() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setJoined(true);
      socket.emit('webrtc:join-voice', { roomCode });
    } catch {
      setError('Mikrofon erişimi reddedildi veya bulunamadı.');
    }
  }

  function leaveVoice() {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    Object.keys(pcsRef.current).forEach(removePeer);
    pcsRef.current = {};
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyzersRef.current = {};
    setJoined(false);
    setPeers({});
    setSpeaking({});
    socket.emit('webrtc:leave-voice', { roomCode });
  }

  function toggleMute() {
    if (!localStreamRef.current) return;
    const newMuted = !muted;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
    setMuted(newMuted);
  }

  // ── Render ─────────────────────────────────────────
  if (!joined) {
    return (
      <div className="voice-panel">
        {error && <div className="voice-error">{error}</div>}
        <button className="btn btn-voice-join" onClick={joinVoice}>
          🎤 Sesli Sohbet
        </button>
      </div>
    );
  }

  const peerList = Object.entries(peers);
  return (
    <div className="voice-panel voice-panel--active">
      <div className="voice-header">🎤 Sesli</div>
      <div className="voice-peers">
        <div className={`voice-peer ${muted ? 'voice-peer--muted' : 'voice-peer--speaking'}`}>
          <span>{muted ? '🔇' : '🎙️'}</span>
          <span className="voice-peer-name">Sen</span>
        </div>
        {peerList.map(([id, peer]) => (
          <div key={id} className={`voice-peer ${speaking[id] ? 'voice-peer--speaking' : ''} ${!peer.connected ? 'voice-peer--connecting' : ''}`}>
            <span>{speaking[id] ? '🔊' : '🔈'}</span>
            <span className="voice-peer-name">{peer.name}</span>
          </div>
        ))}
        {peerList.length === 0 && <span className="voice-empty">Kimse sesli değil</span>}
      </div>
      <div className="voice-controls">
        <button
          className={`btn btn-sm ${muted ? 'btn-danger' : 'btn-secondary'}`}
          onClick={toggleMute}
          title={muted ? 'Sesi aç' : 'Sessize al'}
        >
          {muted ? '🔇' : '🎙️'}
        </button>
        <button className="btn btn-sm btn-danger" onClick={leaveVoice} title="Sesli sohbetten çık">
          📵
        </button>
      </div>
    </div>
  );
}
