import { useState } from 'react';

export function ChatWidget({ chatStatus, facebookUrl }) {
  const [open, setOpen] = useState(false);
  const isOnline = chatStatus === 'online';

  return (
    <>
      <button className="chat-widget-btn" onClick={() => setOpen((v) => !v)} title="Chat with us">
        <i className="fas fa-comment-dots" />
        <span className={`chat-status-dot ${isOnline ? 'online' : 'offline'}`} />
      </button>
      {open && (
        <div className="chat-panel" id="chatPanel">
          <div className="chat-panel-header">
            <span><i className="fas fa-comment-dots me-2" />Farm Support</span>
            <button className="btn btn-sm text-white" onClick={() => setOpen(false)}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="chat-panel-body">
            {isOnline ? (
              <>
                <p className="mb-2">
                  <span className="stock-badge stock-in">
                    <i className="fas fa-circle" style={{ fontSize: 8 }} /> Online
                  </span>
                </p>
                <p>Our team is online right now. Message us on our Facebook Page and we'll respond right away!</p>
                <a href={facebookUrl || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-farm-primary btn-sm w-100 mt-2">
                  Chat on Facebook
                </a>
              </>
            ) : (
              <>
                <p className="mb-2">
                  <span className="stock-badge stock-out">
                    <i className="fas fa-circle" style={{ fontSize: 8 }} /> Offline
                  </span>
                </p>
                <p>We're offline right now. Leave us a message on our Facebook Page and we'll get back to you as soon as we're online.</p>
                <a href={facebookUrl || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-farm-outline btn-sm w-100 mt-2">
                  Message us on Facebook
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
