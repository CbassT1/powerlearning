import { useState, useEffect } from 'react';

export default function Modal({ isOpen, title, message, type = 'confirm', onConfirm, onCancel, confirmText = 'Confirmar', danger = false }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) setInputValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ borderColor: danger ? 'var(--neon-red)' : 'var(--border-color)' }}>
        <h3 style={{ marginTop: 0, color: danger ? 'var(--neon-red)' : 'var(--neon-cyan)' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>{message}</p>
        
        {type === 'prompt' && (
          <textarea 
            className="input-field" 
            autoFocus
            placeholder="Escribe los detalles aquí..." 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)}
            style={{ minHeight: '80px', marginBottom: '20px' }}
          />
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button onClick={onCancel} className="btn btn-outline" style={{ border: 'none' }}>Cancelar</button>
          <button 
            onClick={() => onConfirm(type === 'prompt' ? inputValue : null)} 
            className="btn"
            style={{ 
                backgroundColor: danger ? 'transparent' : 'var(--neon-cyan)', 
                color: danger ? 'var(--neon-red)' : '#000',
                border: danger ? '1px solid var(--neon-red)' : 'none'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}