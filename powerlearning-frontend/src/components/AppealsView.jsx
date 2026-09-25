export default function AppealsView({ appeals, openUserDetail }) {
  return (
    <div className="section-box">
      <h2 style={{ color: '#ff3b30', marginTop: 0 }}>Buzón de Apelaciones</h2>
      {appeals.length === 0 ? <p>No hay apelaciones pendientes.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {appeals.map(appeal => (
            <div key={appeal.id} className="card" style={{ borderLeft: '4px solid #ff3b30', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => openUserDetail(appeal.user_id)}>
              <h4 style={{ margin: '0 0 10px 0' }}>Usuario: {appeal.email}</h4>
              <p style={{ margin: 0 }}><strong>Apelación:</strong> {appeal.reason}</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Haz clic para revisar el perfil</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}