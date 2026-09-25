import { SearchIcon } from './Icons';

export default function Header({ session, setSession, setCurrentView, searchQuery, setSearchQuery, appealsCount }) {
  return (
    <header className="header">
      <h1 style={{ margin: 0, cursor: 'pointer' }} onClick={() => setCurrentView('dashboard')}>PowerLearning</h1>
      
      <div className="search-container" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
          <SearchIcon />
        </div>
        <input type="text" placeholder="Buscar cursos..." className="input-field" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '40px' }} />
      </div>

      <div className="header-right" style={{ flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
        {session.role === 'admin' ? ( 
          <>
            <button onClick={() => setCurrentView('users')} className="btn btn-outline" style={{ borderColor: '#ff9500', color: '#ff9500' }}>Usuarios</button> 
            <button onClick={() => setCurrentView('appeals')} className="btn btn-outline" style={{ borderColor: '#ff3b30', color: '#ff3b30' }}>Buzón ({appealsCount})</button>
          </>
        ) : (
          <button onClick={() => setCurrentView('myCourses')} className="btn btn-outline" style={{ borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}>Mis Cursos</button>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '5px 10px', borderRadius: '8px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }} onClick={() => setCurrentView('profile')}>
          {session.photo_url ? <img src={session.photo_url} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} /> : <div style={{ width: '36px', height: '36px', borderRadius: '4px', backgroundColor: 'var(--neon-purple)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{session.name ? session.name.charAt(0).toUpperCase() : session.email.charAt(0).toUpperCase()}</div>}
          <span style={{ fontWeight: '600', fontSize: '14px' }}>{session.name || session.email.split('@')[0]}</span>
        </div>
        <button onClick={() => setSession(null)} className="btn btn-outline" style={{ border: 'none' }}>Salir</button>
      </div>
    </header>
  );
}