import { CheckIcon, ClockIcon, PauseIcon, XIcon, PlusIcon } from './Icons';

export default function MyCoursesView({ session, misCursos, openCourseDetail, setCurrentView }) {
    return (
        <div className="section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>{session.role === 'profesor' ? 'Cursos que Imparto' : 'Mis Cursos Inscritos'}</h2>
                {session.role === 'profesor' && (
                    <button onClick={() => setCurrentView('profile')} className="btn btn-outline" style={{ borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center' }}>
                        <PlusIcon /> Crear Nuevo Curso
                    </button>
                )}
            </div>
            
            {misCursos.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No tienes cursos en esta sección todavía.</p>
            ) : (
                <div className="grid-cursos">
                    {misCursos.map(curso => (
                        <div key={curso.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openCourseDetail(curso, 'myCourses')}>
                            {curso.image_url ? <img src={curso.image_url} className="course-img" /> : <div className="course-img" style={{ backgroundColor: 'var(--border-color)' }} />}
                            <h3 style={{ margin: '15px 0 10px 0' }}>{curso.title}</h3>
                            
                            {/* Badges de estado exclusivos para el profesor con SVGs nativos */}
                            {session.role === 'profesor' && (
                                <div style={{ marginTop: '10px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {curso.status === 'approved' && <span style={{ color: 'var(--neon-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><CheckIcon /> Aprobado</span>}
                                    {curso.status === 'pending' && <span style={{ color: 'var(--neon-orange)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><ClockIcon /> En Revisión</span>}
                                    {curso.status === 'suspended' && <span style={{ color: 'var(--neon-orange)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><PauseIcon /> Suspendido</span>}
                                    {curso.status === 'rejected' && <span style={{ color: 'var(--neon-red)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><XIcon /> Rechazado</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}