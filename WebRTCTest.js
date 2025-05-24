
//THis file is src/componets/WebRTCTest.js
import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const WebRTCTest = () => {
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [roomId, setRoomId] = useState('test-room');

  useEffect(() => {
    const newSocket = io('http://localhost:8081');
    setSocket(newSocket);

    newSocket.on('user-joined', (userId) => {
      console.log('User joined:', userId);
      initiateCall(userId, newSocket);
    });

    newSocket.on('webrtc-offer', ({ offer, from }) => {
      answerCall(offer, from, newSocket);
    });

    newSocket.on('webrtc-answer', ({ answer }) => {
      peer?.signal(answer);
    });

    newSocket.on('webrtc-ice', ({ ice }) => {
      peer?.signal(ice);
    });

    return () => newSocket.close();
  }, []);

  const joinRoom = () => {
    if (socket) {
      socket.emit('join-room', roomId);
    }
  };

  const initiateCall = (targetId, socket) => {
    const newPeer = new Peer({ initiator: true, trickle: false });
    
    newPeer.on('signal', (offer) => {
      socket.emit('webrtc-offer', { offer, target: targetId });
    });

    setupPeerEvents(newPeer);
    setPeer(newPeer);
  };

  const answerCall = (offer, from, socket) => {
    const newPeer = new Peer({ initiator: false, trickle: false });
    
    newPeer.on('signal', (answer) => {
      socket.emit('webrtc-answer', { answer, target: from });
    });

    setupPeerEvents(newPeer);
    newPeer.signal(offer);
    setPeer(newPeer);
  };

  const setupPeerEvents = (peer) => {
    peer.on('connect', () => {
      console.log('P2P Connected!');
      setConnected(true);
    });

    peer.on('data', (data) => {
      const msg = JSON.parse(data);
      setMessages(prev => [...prev, { ...msg, own: false }]);
    });
  };

  const sendMessage = () => {
    if (peer && connected && message.trim()) {
      const msg = { text: message, timestamp: Date.now() };
      peer.send(JSON.stringify(msg));
      setMessages(prev => [...prev, { ...msg, own: true }]);
      setMessage('');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>WebRTC Test (Separate from Main App)</h3>
      
      <div>
        <input 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
        />
        <button onClick={joinRoom}>Join Room</button>
        <span style={{ color: connected ? 'green' : 'red', marginLeft: '10px' }}>
          {connected ? '🔒 P2P Connected' : '❌ Not Connected'}
        </span>
      </div>

      <div style={{ height: '200px', border: '1px solid #ddd', margin: '10px 0', padding: '10px', overflowY: 'scroll' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.own ? 'right' : 'left' }}>
            <strong>{msg.own ? 'You' : 'Peer'}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div>
        <input 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type message..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} disabled={!connected}>Send P2P</button>
      </div>
    </div>
  );
};

export default WebRTCTest;