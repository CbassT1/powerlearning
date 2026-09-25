import { useState } from 'react';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

function AuthView({ setSession, showToast }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('alumno');
  const [showPassword, setShowPassword] = useState(false);

  const [blockedData, setBlockedData] = useState(null);
  const [appealText, setAppealText] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? 'login' : 'register';
    const body = isLoginView ? { email, password } : { email, password, role, name };
    
    try {
      const response = await fetch(`https://powerlearning.vercel.app/api/auth/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body) 
      });
      const data = await response.json();
      
      if (response.ok) {
        if (isLoginView) {
          setSession(data);
        } else {
          setIsLoginView(true);
          setPassword('');
          showToast('✅ Cuenta creada. Inicia sesión.');
        }
      } else { 
        if (data.isBlocked) {
            setBlockedData({ email, reason: data.reason });
        } else {
            showToast(`❌ ${data.error}`); 
        }
      }
    } catch (error) { showToast('❌ Error de conexión con el servidor'); }
  };

  const handleAppeal = async () => {
    if (!appealText.trim()) return showToast('⚠️ Escribe el motivo de tu apelación');
    try {
      const response = await fetch('https://powerlearning.vercel.app/api/auth/appeals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: blockedData.email, reason: appealText })
      });
      if (response.ok) {
        showToast('✅ Apelación enviada al equipo de administración.');
        setBlockedData(null); setAppealText(''); setPassword('');
      } else { showToast('❌ Error al enviar la apelación'); }
    } catch (error) { showToast('❌ Error de conexión'); }
  };

  if (blockedData) {
      return (
        <div style={{ maxWidth: '400px', margin: '80px auto', padding: '0 20px' }}>
          <div className="section-box" style={{ borderColor: '#ff3b30', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🚫</div>
            <h2 style={{ color: '#ff3b30', marginTop: 0 }}>Cuenta Suspendida</h2>
            <p>El acceso para <strong>{blockedData.email}</strong> ha sido revocado.</p>
            
            <div style={{ backgroundColor: '#ffe5e5', padding: '15px', borderRadius: '8px', margin: '20px 0', color: '#d93025', textAlign: 'left' }}>
                <strong>Motivo del administrador:</strong><br/>
                <span style={{ fontSize: '15px' }}>{blockedData.reason}</span>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'left' }}>¿Consideras que esto es un error? Solicita una revisión de tu caso:</p>
            <textarea placeholder="Explica por qué deberíamos reactivar tu cuenta..." className="input-field" style={{ minHeight: '80px', width: '100%', marginBottom: '15px', boxSizing: 'border-box' }} value={appealText} onChange={(e) => setAppealText(e.target.value)} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={handleAppeal} className="btn btn-blue" style={{ width: '100%' }}>Enviar Apelación</button>
                <button onClick={() => setBlockedData(null)} className="btn btn-outline" style={{ width: '100%', border: 'none' }}>Volver al Inicio</button>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '0 20px' }}>
      <div className="section-box">
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>PowerLearning</h1>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLoginView && (
            <>
              <input type="text" placeholder="Tu nombre completo" value={name} onChange={(e) => setName(e.target.value)} required className="input-field" />
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="alumno">Soy Alumno</option>
                <option value="profesor">Soy Profesor</option>
              </select>
            </>
          )}
          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input type={showPassword ? "text" : "password"} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <button type="submit" className="btn btn-blue">{isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta'}</button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={() => setIsLoginView(!isLoginView)} style={{ background: 'none', border: 'none', color: 'var(--btn-primary)', cursor: 'pointer' }}>
            {isLoginView ? 'Crear cuenta nueva' : 'Ya tengo una cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthView;