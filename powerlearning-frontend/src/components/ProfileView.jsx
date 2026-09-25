import { useState } from 'react';
import { SettingsIcon, XIcon, EyeIcon, EyeOffIcon, UploadIcon, PlusIcon } from './Icons';

const INTERESES_DISPONIBLES = ['Frontend', 'Backend', 'DevOps', 'Data Science', 'UI/UX', 'Mobile', 'Cloud AWS', 'Ciberseguridad', 'Python'];

function ProfileView({ session, setSession, showToast, fetchCourses, fetchMyCourses, setCurrentView }) {
  const [isEditingProfile, setIsEditingProfile] = useState(false); 
  const [editName, setEditName] = useState(session.name || '');
  const [editInterests, setEditInterests] = useState(session.interests ? session.interests.split(',') : []);
  const [editPhoto, setEditPhoto] = useState(session.photo_url || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordCurrent, setShowPasswordCurrent] = useState(false); 
  const [showPasswordNew, setShowPasswordNew] = useState(false); 

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSubject, setNewCourseSubject] = useState(INTERESES_DISPONIBLES[0]);
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseImg, setNewCourseImg] = useState('');
  const [timeQuantity, setTimeQuantity] = useState('');
  const [timeUnit, setTimeUnit] = useState('Semanas');

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`https://powerlearning.vercel.app/api/auth/users/${session.userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, interests: editInterests.join(','), photo_url: editPhoto })
      });
      if (response.ok) {
        setSession({ ...session, name: editName, photo_url: editPhoto, interests: editInterests.join(',') });
        setIsEditingProfile(false); 
        showToast('Datos actualizados');
      } else { showToast('Error del servidor'); }
    } catch (error) { showToast('Error de conexión'); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`https://powerlearning.vercel.app/api/auth/users/${session.userId}/password`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await response.json();
        if (response.ok) { showToast(data.mensaje); setCurrentPassword(''); setNewPassword(''); } 
        else { showToast(data.error); }
    } catch (error) { showToast('Error de conexión'); }
  };

  const toggleInterest = (interest) => { setEditInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]); };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image(); img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas'); const scaleSize = 500 / img.width;
          canvas.width = 500; canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setter(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    const estimated_time = `${timeQuantity} ${timeUnit}`;
    try {
      const response = await fetch('https://powerlearning.vercel.app/api/courses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCourseTitle, description: newCourseDesc, role: session.role, image_url: newCourseImg, estimated_time, creator_id: session.userId, subject: newCourseSubject })
      });
      if (response.ok) {
        showToast('Curso enviado para revisión');
        fetchCourses(); setShowAddCourse(false); 
        setNewCourseTitle(''); setNewCourseDesc(''); setNewCourseImg(''); setTimeQuantity('');
      }
    } catch (error) { showToast('Error al publicar'); }
  };

  return (
    <div className="section-box" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Mi Perfil</h2>
        <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="btn btn-outline" style={{ borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          {isEditingProfile ? <><XIcon /> Cancelar</> : <><SettingsIcon /> Modificar</>}
        </button>
      </div>

      {!isEditingProfile ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {session.photo_url ? <img src={session.photo_url} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }} />}
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>{session.name}</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '16px' }}>{session.email} | Rol: {session.role}</p>
            <div style={{ marginTop: '15px' }}>
              {session.interests ? session.interests.split(',').map(int => <span key={int} className="tag-badge selected">{int}</span>) : <span style={{ color: 'var(--text-secondary)' }}>Sin intereses registrados</span>}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Datos Generales</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {editPhoto ? <img src={editPhoto} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }} />}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Actualizar Foto:</label>
                {/* DISEÑO DEL INPUT DE ARCHIVOS */}
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', padding: '10px 16px', backgroundColor: 'transparent', border: '1px dashed var(--neon-cyan)', color: 'var(--neon-cyan)', borderRadius: '6px', fontWeight: '600', transition: 'all 0.2s' }}>
                  <UploadIcon /> Seleccionar Imagen
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setEditPhoto)} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
            <input type="text" placeholder="Tu Nombre Completo" className="input-field" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Selecciona tus áreas de interés:</label>
              <div>
                {INTERESES_DISPONIBLES.map(int => (
                  <span key={int} onClick={() => toggleInterest(int)} className={`tag-badge ${editInterests.includes(int) ? 'selected' : ''}`}>{int}</span>
                ))}
              </div>
            </div>
            <button onClick={handleUpdateProfile} className="btn btn-blue" style={{ alignSelf: 'flex-start' }}>Guardar Cambios</button>
          </div>

          <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Seguridad</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showPasswordCurrent ? "text" : "password"} placeholder="Contraseña Actual" className="input-field" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}/>
                  <button type="button" onClick={() => setShowPasswordCurrent(!showPasswordCurrent)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{showPasswordCurrent ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showPasswordNew ? "text" : "password"} placeholder="Nueva Contraseña" className="input-field" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}/>
                  <button type="button" onClick={() => setShowPasswordNew(!showPasswordNew)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{showPasswordNew ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
                <button type="submit" className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>Actualizar Contraseña</button>
            </form>
          </div>
        </div>
      )}

      {session.role === 'profesor' && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '30px' }}>
          <button onClick={() => setShowAddCourse(!showAddCourse)} className="btn btn-blue" style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {showAddCourse ? <><XIcon /> Cancelar Creación</> : <><PlusIcon /> Añadir Curso Nuevo</>}
          </button>
          
          {showAddCourse && (
            <div style={{ padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginTop: 0, color: 'var(--neon-purple)' }}>Estructura del Curso</h3>
                <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="Título del curso" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} required className="input-field" />
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Materia:</label>
                        <select className="input-field" value={newCourseSubject} onChange={(e) => setNewCourseSubject(e.target.value)} required>
                            {INTERESES_DISPONIBLES.map(int => <option key={int} value={int}>{int}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Duración (Número):</label>
                            <input type="number" min="1" placeholder="Ej. 4" value={timeQuantity} onChange={(e) => setTimeQuantity(e.target.value)} required className="input-field" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Unidad de Tiempo:</label>
                            <select className="input-field" value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
                                <option value="Horas">Horas</option>
                                <option value="Días">Días</option>
                                <option value="Semanas">Semanas</option>
                                <option value="Meses">Meses</option>
                                <option value="Años">Años</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: 'var(--text-secondary)' }}>Imagen de Portada:</label>
                        {/* DISEÑO DEL INPUT DE ARCHIVOS */}
                        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', padding: '10px 16px', backgroundColor: 'transparent', border: '1px solid var(--neon-purple)', color: 'var(--neon-purple)', borderRadius: '6px', fontWeight: '600' }}>
                          <UploadIcon /> Subir Imagen del Curso
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewCourseImg)} required style={{ display: 'none' }} />
                        </label>
                        {newCourseImg && <span style={{ marginLeft: '15px', color: 'var(--neon-green)', fontSize: '14px' }}>Imagen cargada</span>}
                    </div>
                    
                    <textarea placeholder="Descripción detallada del temario..." value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} required className="input-field" style={{ minHeight: '100px' }} />
                    <button type="submit" className="btn btn-green" style={{ width: '100%' }}>Enviar Curso a Revisión</button>
                </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileView;