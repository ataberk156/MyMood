import { useState, useEffect, useRef } from 'react';
import socket from '../socket.js';

export default function Chat({ roomCode, playerName, messages = [] }) {
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function send(e) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    socket.emit('chat:message', { roomCode, message: msg });
    setInput('');
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">💬 Sohbet</div>
      <div className="chat-messages" ref={listRef}>
        {messages.length === 0
          ? <div className="chat-empty">Henüz mesaj yok</div>
          : messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.playerName === playerName ? 'chat-msg--mine' : ''}`}>
              <span className="chat-author">{m.playerName}:</span>
              <span className="chat-text">{m.message}</span>
            </div>
          ))
        }
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          className="input chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Mesaj yaz..."
          maxLength={200}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary chat-send">➤</button>
      </form>
    </div>
  );
}
