import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('alumno');
  const [mensaje, setMensaje] = useState('');
  
  const [session, setSession] = useState(null); 
  const [cursos, setCursos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Foto de Perfil (Persistencia local rápida)
  const [profilePic, setProfilePic] = useState(localStorage.getItem('userAvatar') || '');
  const [userName, setUserName] = useState('');
  const [userInterests, setUserInterests] = useState('');
  
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseTime, setNewCourseTime] = useState('');
  const [newCourseImg, setNewCourseImg] = useState('');

  const fetchCourses = () => {
    const url = session?.role === 'admin' ? 'http://localhost:3000/api/courses?role=admin' : 'http://localhost:3000/api/courses';
    fetch(url)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCursos(data); else setCursos([]); })
      .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    if (session?.role === 'admin') {
      fetch('http://localhost:3000/api/auth/users?role=admin')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setUsuarios(data); })
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    if (session) { fetchCourses(); fetchUsers(); }
  }, [session, currentView]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? 'login' : 'register';
    try {
      const response = await fetch(`http://localhost:3000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }) 
      });
      const data = await response.json();
      
      if (response.ok) {
        if (isLoginView) {
          setSession({ token: data.token, userId: data.userId, email: data.email, role: data.role });
          setMensaje('');
        } else {
          setIsLoginView(true);
          setPassword('');
          setMensaje('✅ Registro exitoso. Ahora puedes iniciar sesión.');
        }
      } else {
        setMensaje(`❌ ${data.error}`);
      }
    } catch (error) { setMensaje('❌ Error de conexión con el servidor.'); }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
        localStorage.setItem('userAvatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
        const response = await fetch(`http://localhost:3000/api/auth/users/${session.userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: userName, interests: userInterests, photo_url: profilePic })
        });
        if (response.ok) {
            alert('✅ Perfil guardado en la base de datos');
        }
    } catch (error) {
        alert('Error al actualizar el perfil');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewCourseImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    setNewCourseDesc(e.target.value);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCourseTitle, description: newCourseDesc, role: session.role, image_url: newCourseImg, estimated_time: newCourseTime })
      });
      if (response.ok) {
        alert('✅ Curso enviado para revisión.');
        setNewCourseTitle(''); setNewCourseDesc(''); setNewCourseImg(''); setNewCourseTime('');
        setCurrentView('dashboard');
      }
    } catch (error) { alert('Error al publicar'); }
  };

  const handleEnroll = async (courseId) => {
    try {
      const response = await fetch('http://localhost:3000/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.userId, courseId })
      });
      const data = await response.json();
      alert(response.ok ? `✅ ${data.mensaje}` : `⚠️ ${data.error}`);
    } catch (error) { alert('Error al inscribirse'); }
  };

  const handleApprove = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/courses/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: session.role })
      });
      fetchCourses();
    } catch (error) { console.error(error); }
  };

  const handleDeleteCourse = async (id) => {
    if(!window.confirm('¿Eliminar este curso permanentemente?')) return;
    try {
      await fetch(`http://localhost:3000/api/courses/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: session.role }) });
      fetchCourses();
    } catch (error) { console.error(error); }
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
      await fetch(`http://localhost:3000/api/auth/users/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: session.role }) });
      fetchUsers();
    } catch (error) { console.error(error); }
  };

  const cursosFiltrados = cursos.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()) && c.status === 'approved');
  const cursosPendientes = cursos.filter(c => c.status === 'pending');

  if (session) {
    return (
      <div className="container">
        <header className="header">
          <h1 style={{ margin: 0, cursor: 'pointer', fontSize: '28px' }} onClick={() => setCurrentView('dashboard')}>PowerLearning</h1>
          
          <div className="search-container">
            <input type="text" placeholder="🔍 Buscar cursos por nombre..." className="input-field" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="header-right" style={{ flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {profilePic ? (
                <img src={profilePic} alt="Avatar" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--btn-primary)' }} />
              ) : (
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--btn-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
                  {session.email.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontWeight: '600', fontSize: '18px' }}>{session.email}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {session.role === 'admin' && ( <button onClick={() => setCurrentView('users')} className="btn btn-outline" style={{ borderColor: '#ff9500', color: '#ff9500' }}>Usuarios</button> )}
              <button onClick={() => setCurrentView('profile')} className="btn btn-outline">Perfil</button>
              <button onClick={() => setSession(null)} className="btn btn-blue">Salir</button>
            </div>
          </div>
        </header>

        {currentView === 'users' && session.role === 'admin' ? (
          <div className="section-box">
            <h2>Gestión de Usuarios</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {usuarios.map(user => (
                <div key={user.id} className="card" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{user.email}</h3>
                    <span style={{ color: 'var(--text-secondary)' }}>ID: {user.id} | Rol: {user.role.toUpperCase()}</span>
                  </div>
                  {user.id !== session.userId && ( <button onClick={() => handleDeleteUser(user.id)} className="btn" style={{ backgroundColor: '#ff3b30', color: 'white' }}>Eliminar</button> )}
                </div>
              ))}
            </div>
          </div>
        ) : currentView === 'profile' ? (
          <div className="section-box" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginTop: 0 }}>Información de Perfil</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                {profilePic ? (
                  <img src={profilePic} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
                )}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Actualizar Foto de Perfil:</label>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                </div>
              </div>

            <input type="text" placeholder="Nombre completo" className="input-field" value={userName} onChange={(e) => setUserName(e.target.value)} />
            <input type="text" placeholder="Intereses (Ej. Swift, AWS, Node.js)" className="input-field" value={userInterests} onChange={(e) => setUserInterests(e.target.value)} />
            <button onClick={handleUpdateProfile} className="btn btn-blue" style={{ alignSelf: 'flex-start' }}>Actualizar Perfil</button>
            </div>

            {session.role === 'profesor' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '30px' }}>
                <h2>Publicar un nuevo curso</h2>
                <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input type="text" placeholder="Título del curso" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} required className="input-field" />
                  <input type="text" placeholder="Tiempo estimado (Ej. 4 semanas)" value={newCourseTime} onChange={(e) => setNewCourseTime(e.target.value)} required className="input-field" />
                  <div style={{ padding: '15px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Imagen de portada:</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} required />
                  </div>
                  <textarea placeholder="Descripción detallada" value={newCourseDesc} onInput={autoResize} required className="input-field" style={{ minHeight: '60px' }} />
                  <button type="submit" className="btn btn-green" style={{ alignSelf: 'flex-start' }}>Enviar a revisión</button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <>
            {session.role === 'admin' && cursosPendientes.length > 0 && (
              <div className="section-box" style={{ borderColor: '#ff9500' }}>
                <h2 style={{ marginTop: 0, color: '#ff9500' }}>Panel de Aprobación</h2>
                <div className="grid-cursos">
                  {cursosPendientes.map(curso => (
                    <div key={curso.id} className="card">
                      <h3 style={{ marginTop: 0 }}>{curso.title}</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>{curso.description}</p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button onClick={() => handleApprove(curso.id)} className="btn btn-green" style={{ flex: 1 }}>Aprobar</button>
                        <button onClick={() => handleDeleteCourse(curso.id)} className="btn" style={{ backgroundColor: '#ff3b30', color: 'white', flex: 1 }}>Rechazar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="section-box">
              <h2 style={{ marginTop: 0 }}>Catálogo Principal</h2>
              <div className="grid-cursos">
                {cursosFiltrados.map(curso => (
                  <div key={curso.id} className="card" style={{ justifyContent: 'space-between' }}>
                    <div>
                      {curso.image_url ? (
                        <img src={curso.image_url} alt={curso.title} className="course-img" />
                      ) : (
                        <div className="course-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--border-color)' }}><span style={{ color: 'var(--text-secondary)' }}>Sin portada</span></div>
                      )}
                      <h3 style={{ margin: '0 0 10px 0' }}>{curso.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '10px' }}>⏱️ Tiempo: <strong>{curso.estimated_time || 'No definido'}</strong></p>
                      <p style={{ color: 'var(--text-secondary)' }}>{curso.description}</p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                      {session.role === 'alumno' && ( <button onClick={() => handleEnroll(curso.id)} className="btn btn-green" style={{ width: '100%' }}>Solicitar Inscripción</button> )}
                      {session.role === 'admin' && ( <button onClick={() => handleDeleteCourse(curso.id)} className="btn" style={{ backgroundColor: '#ff3b30', color: 'white', width: '100%' }}>Eliminar Curso</button> )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '0 20px' }}>
      <div className="section-box">
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>PowerLearning</h1>
        {mensaje && ( <div style={{ padding: '10px', marginBottom: '20px', borderRadius: '8px', backgroundColor: mensaje.includes('✅') ? '#e6f4ea' : '#fce8e6', color: mensaje.includes('✅') ? '#1e8e3e' : '#d93025', fontWeight: 'bold', textAlign: 'center' }}>{mensaje}</div> )}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLoginView && (
            <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="alumno">Soy Alumno</option>
              <option value="profesor">Soy Profesor</option>
            </select>
          )}
          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
          <button type="submit" className="btn btn-blue">{isLoginView ? 'Iniciar Sesión' : 'Registrar Cuenta'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={() => { setIsLoginView(!isLoginView); setMensaje(''); }} style={{ background: 'none', border: 'none', color: 'var(--btn-primary)', cursor: 'pointer' }}>{isLoginView ? 'Crear cuenta nueva' : 'Ya tengo una cuenta'}</button>
        </div>
      </div>
    </div>
  );
}

export default App;