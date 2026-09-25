import { useState } from 'react';
import { ClockIcon, UserIcon, BookIcon, CheckIcon, XIcon, TrashIcon, PlayIcon, PauseIcon, EditIcon } from './Icons';

const INTERESES_DISPONIBLES = ['Frontend', 'Backend', 'DevOps', 'Data Science', 'UI/UX', 'Mobile', 'Cloud AWS', 'Ciberseguridad', 'Python'];

export default function CourseDetailView({ session, selectedCourse, setCurrentView, handleEnroll, handleApprove, handleRejectCourse, handleSuspendCourse, fetchCourses, fetchMyCourses, showToast, backView, setModalConfig, closeModal }) {
    
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(selectedCourse.title);
    const [editDesc, setEditDesc] = useState(selectedCourse.description);
    const [editImg, setEditImg] = useState(selectedCourse.image_url);
    const [editTime, setEditTime] = useState(selectedCourse.estimated_time);
    const [editSubject, setEditSubject] = useState(selectedCourse.subject || INTERESES_DISPONIBLES[0]);

    const isCourseOwner = session.role === 'profesor' && selectedCourse.creator_id === session.userId;
    const isEnrolled = backView === 'myCourses' && session.role === 'alumno';

    const handleDeleteCourse = () => {
        setModalConfig({
            isOpen: true, title: 'Eliminar Curso', message: '¿Eliminar este curso permanentemente de la plataforma? Esta acción no se puede deshacer.',
            type: 'confirm', danger: true, confirmText: 'Eliminar',
            onConfirm: async () => {
                closeModal();
                try {
                    const res = await fetch(`http://localhost:3000/api/courses/${selectedCourse.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: session.role }) });
                    if(res.ok) { fetchCourses(); fetchMyCourses(); setCurrentView(backView); showToast('Curso eliminado'); }
                } catch (error) { console.error(error); }
            }
        });
    };

    const handleUnenroll = () => {
        setModalConfig({
            isOpen: true, title: 'Abandonar Curso', message: '¿Seguro que deseas abandonar este curso? Perderás tu progreso actual.',
            type: 'confirm', danger: true, confirmText: 'Abandonar',
            onConfirm: async () => {
                closeModal();
                try {
                    const res = await fetch(`http://localhost:3000/api/courses/unenroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.userId, courseId: selectedCourse.id }) });
                    if(res.ok) { fetchMyCourses(); setCurrentView(backView); showToast('Te has dado de baja'); }
                } catch (error) { console.error(error); }
            }
        });
    };

    const handleSaveChanges = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/courses/${selectedCourse.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle, description: editDesc, image_url: editImg, estimated_time: editTime, subject: editSubject, role: session.role })
            });
            if(res.ok) {
                fetchCourses(); fetchMyCourses(); setIsEditing(false); setCurrentView(backView); showToast('Curso enviado a revisión');
            }
        } catch (error) { console.error(error); }
    };

    return (
        <div className="section-box" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setCurrentView(backView)} className="btn btn-outline" style={{ marginBottom: '20px' }}>
                <span style={{ marginRight: '5px' }}>←</span> Volver
            </button>
            {isCourseOwner && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn btn-outline" style={{ borderColor: 'var(--neon-purple)', color: 'var(--neon-purple)', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                    <EditIcon /> Editar Curso
                </button>
            )}
          </div>
          
          {!isEditing ? (
              <>
                {selectedCourse.image_url && <img src={selectedCourse.image_url} style={{ width: '100%', height: '350px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border-color)' }} />}
                <h1 style={{ marginTop: '20px', marginBottom: '15px', color: 'var(--neon-cyan)' }}>{selectedCourse.title}</h1>
                
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}><UserIcon /> <strong>{selectedCourse.professor_name || 'Profesor Desconocido'}</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center' }}><BookIcon /> {selectedCourse.subject}</span>
                </div>
                
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                    <ClockIcon /> Tiempo estimado: {selectedCourse.estimated_time}
                </p>
                <p style={{ fontSize: '16px', lineHeight: '1.7', color: 'var(--text-primary)', marginTop: '20px' }}>{selectedCourse.description}</p>
                
                {isCourseOwner && selectedCourse.status === 'rejected' && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '15px', border: '1px solid var(--neon-red)', borderRadius: '8px', color: 'var(--neon-red)', marginTop: '20px' }}>
                        <strong style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><XIcon /> Motivo del rechazo del Administrador:</strong> 
                        {selectedCourse.rejection_reason}
                    </div>
                )}

                {/* Controles de Alumno */}
                {session.role === 'alumno' && selectedCourse.status === 'approved' && !isEnrolled && ( 
                    <button onClick={() => handleEnroll(selectedCourse.id)} className="btn btn-green" style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CheckIcon /> Solicitar Inscripción
                    </button> 
                )}
                {isEnrolled && (
                    <button onClick={handleUnenroll} className="btn btn-outline" style={{ marginTop: '20px', width: '100%', borderColor: 'var(--neon-red)', color: 'var(--neon-red)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <XIcon /> Abandonar Curso
                    </button> 
                )}

                {/* Controles de Admin */}
                {session.role === 'admin' && (
                    <div style={{ marginTop: '30px', padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                        {selectedCourse.status === 'pending' && (
                            <>
                                <button onClick={() => { handleApprove(selectedCourse.id); setCurrentView(backView); }} className="btn btn-green" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <CheckIcon /> Aprobar
                                </button>
                                <button onClick={() => { handleRejectCourse(selectedCourse.id); setCurrentView(backView); }} className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--neon-red)', color: 'var(--neon-red)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <XIcon /> Rechazar
                                </button>
                            </>
                        )}
                        {selectedCourse.status === 'suspended' && (
                            <button onClick={() => { handleApprove(selectedCourse.id); setCurrentView(backView); }} className="btn btn-green" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <PlayIcon /> Restaurar
                            </button>
                        )}
                        {selectedCourse.status === 'approved' && (
                            <button onClick={() => handleSuspendCourse(selectedCourse.id)} className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--neon-orange)', color: 'var(--neon-orange)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <PauseIcon /> Suspender
                            </button>
                        )}
                        <button onClick={handleDeleteCourse} className="btn btn-outline" style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)', flex: selectedCourse.status === 'pending' ? 'none' : 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <TrashIcon /> Eliminar
                        </button>
                    </div>
                )}
              </>
          ) : (
              // FORMULARIO DE EDICIÓN
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h2 style={{ margin: 0, color: 'var(--neon-purple)', display: 'flex', alignItems: 'center' }}><EditIcon /> Modificar Estructura</h2>
                  <input type="text" placeholder="Título" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input-field" />
                  
                  <select className="input-field" value={editSubject} onChange={(e) => setEditSubject(e.target.value)}>
                      {INTERESES_DISPONIBLES.map(int => <option key={int} value={int}>{int}</option>)}
                  </select>

                  <input type="text" placeholder="Tiempo estimado (Ej. 4 Semanas)" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="input-field" />
                  <textarea placeholder="Descripción..." value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="input-field" style={{ minHeight: '120px' }} />
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={handleSaveChanges} className="btn btn-green" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckIcon /> Guardar y Enviar</button>
                      <button onClick={() => setIsEditing(false)} className="btn btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><XIcon /> Cancelar</button>
                  </div>
              </div>
          )}
        </div>
    );
}