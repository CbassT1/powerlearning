import { useState, useEffect } from 'react';
import { EditIcon, TrashIcon, XIcon } from './Icons';

export default function AdminUserDetailView({ session, selectedUser, setCurrentView, fetchUsers, openUserDetail, showToast, handleBlockUser, handleUnblockUser, handleHardDeleteUser, setModalConfig, closeModal }) {
    const [isEditingAdmin, setIsEditingAdmin] = useState(false);
    const [editAdminName, setEditAdminName] = useState(selectedUser.name || '');
    const [editAdminRole, setEditAdminRole] = useState(selectedUser.role || 'alumno');

    useEffect(() => {
        setEditAdminName(selectedUser.name || '');
        setEditAdminRole(selectedUser.role || 'alumno');
        setIsEditingAdmin(false);
    }, [selectedUser]);

    const saveAdminChanges = async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/auth/users/${selectedUser.id}/admin`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: session.role, name: editAdminName, userRole: editAdminRole })
          });
          if(res.ok) {
            showToast('Perfil de usuario modificado');
            fetchUsers(); openUserDetail(selectedUser.id);
          }
        } catch (error) { console.error(error); }
    };

    const handleRemoveUserPhoto = () => {
        setModalConfig({
            isOpen: true, title: 'Eliminar Foto', message: '¿Estás seguro de eliminar la foto de perfil de este usuario?',
            type: 'confirm', danger: true, confirmText: 'Eliminar Foto',
            onConfirm: async () => {
                closeModal();
                try {
                    const res = await fetch(`http://localhost:3000/api/auth/users/${selectedUser.id}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: selectedUser.name, interests: selectedUser.interests || '', photo_url: '' })
                    });
                    if(res.ok) {
                        showToast('Foto eliminada');
                        fetchUsers(); openUserDetail(selectedUser.id);
                    }
                } catch (error) { console.error(error); }
            }
        });
    };

    return (
        <div className="section-box" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', position: 'relative', paddingTop: '50px' }}>
          
          <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setCurrentView('users')} className="btn btn-outline" style={{ padding: '5px 15px', fontSize: '14px', border: 'none' }}>
                <span style={{ marginRight: '5px' }}>←</span> Volver
            </button>
            {selectedUser.status !== 'blocked' && (
              <button onClick={() => setIsEditingAdmin(!isEditingAdmin)} className="btn btn-outline" style={{ padding: '5px 15px', fontSize: '14px', borderColor: 'var(--neon-orange)', color: 'var(--neon-orange)', display: 'flex', alignItems: 'center' }}>
                {isEditingAdmin ? <><XIcon /> Cancelar</> : <><EditIcon /> Editar</>}
              </button>
            )}
          </div>
          
          <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto 15px auto' }}>
            {selectedUser.photo_url ? <img src={selectedUser.photo_url} style={{ width:'120px', height:'120px', minWidth: '120px', borderRadius:'6px', objectFit:'cover', border: '1px solid var(--border-color)' }} /> : <div style={{width:'120px', height:'120px', borderRadius:'6px', backgroundColor:'var(--border-color)'}} />}
            {isEditingAdmin && selectedUser.photo_url && (
              <button onClick={handleRemoveUserPhoto} title="Eliminar foto" style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: 'var(--neon-red)', color: 'white', border: 'none', borderRadius: '4px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrashIcon style={{ margin: 0 }} />
              </button>
            )}
          </div>
          
          {isEditingAdmin && selectedUser.status !== 'blocked' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', margin: '10px 0 20px 0' }}>
              <input type="text" className="input-field" value={editAdminName} onChange={(e)=>setEditAdminName(e.target.value)} style={{ textAlign: 'center' }} />
              <select className="input-field" value={editAdminRole} onChange={(e)=>setEditAdminRole(e.target.value)} style={{ textAlign: 'center' }}>
                <option value="alumno">Alumno</option>
                <option value="profesor">Profesor</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={saveAdminChanges} className="btn btn-green">Guardar Cambios</button>
            </div>
          ) : (
            <>
              <h2 style={{ color: selectedUser.status === 'blocked' ? 'var(--neon-red)' : 'var(--neon-cyan)', margin: '0 0 5px 0' }}>
                {selectedUser.name || 'Usuario sin nombre'} {selectedUser.status === 'blocked' && '(Bloqueado)'}
              </h2>
              <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>{selectedUser.email} | Rol: <strong>{selectedUser.role}</strong></p>
            </>
          )}
          
          {selectedUser.status === 'blocked' && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '15px', border: '1px solid var(--neon-red)', borderRadius: '6px', color: 'var(--neon-red)', marginTop: '10px', textAlign: 'left' }}>
              <strong style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><XIcon /> Motivo del Bloqueo:</strong> 
              {selectedUser.block_reason}
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Intereses:</h4>
            {selectedUser.interests ? selectedUser.interests.split(',').map(int => <span key={int} className="tag-badge selected">{int}</span>) : <p style={{ color: 'var(--text-secondary)' }}>Sin intereses registrados</p>}
          </div>
          
          {selectedUser.id !== session.userId && (
            <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {selectedUser.status !== 'blocked' ? (
                <button onClick={() => handleBlockUser(selectedUser.id)} className="btn btn-outline" style={{ borderColor: 'var(--neon-orange)', color: 'var(--neon-orange)' }}>Bloquear Usuario</button>
              ) : (
                <>
                  <button onClick={() => handleUnblockUser(selectedUser.id)} className="btn btn-green">Desbloquear</button>
                  <button onClick={() => handleHardDeleteUser(selectedUser.id)} className="btn btn-outline" style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }}>Eliminar Permanentemente</button>
                </>
              )}
            </div>
          )}
        </div>
    );
}