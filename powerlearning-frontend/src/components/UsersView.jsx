export default function UsersView({ usuarios, session, openUserDetail }) {
  return (
    <div className="section-box">
      <h2>Gestión de Usuarios</h2>
      <div className="grid-cursos">
        {usuarios.filter(user => user.id !== session.userId).map(user => (
          <div key={user.id} className="card" style={{ cursor: 'pointer', border: user.status === 'blocked' ? '1px solid #ff3b30' : 'none' }} onClick={() => openUserDetail(user.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {user.photo_url ? <img src={user.photo_url} style={{ width:'50px', height:'50px', minWidth: '50px', flexShrink: 0, borderRadius:'50%', objectFit:'cover' }} /> : <div style={{width:'50px', height:'50px', minWidth: '50px', flexShrink: 0, borderRadius:'50%', backgroundColor:'#ccc'}} />}
              <div>
                <h3 style={{ margin: 0, color: user.status === 'blocked' ? '#ff3b30' : 'inherit' }}>{user.name || 'Sin nombre'} {user.status === 'blocked' && '(Bloqueado)'}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{user.email} ({user.role})</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}