import { ClockIcon } from './Icons';

export default function DashboardView({ session, cursosPendientes, cursosFiltrados, cursosSuspendidos, handleApprove, handleRejectCourse, openCourseDetail }) {
    return (
      <>
        {session.role === 'admin' && cursosPendientes.length > 0 && (
          <div className="section-box" style={{ borderColor: '#ff9500' }}>
            <h2 style={{ marginTop: 0, color: '#ff9500' }}>Panel de Aprobación</h2>
            <div className="grid-cursos">
              {cursosPendientes.map(curso => (
                <div key={curso.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openCourseDetail(curso)}>
                  <div>
                    <h3 style={{ marginTop: 0 }}>{curso.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '5px 0', display: 'flex', alignItems: 'center' }}>
                      <ClockIcon /> {curso.estimated_time || 'No definido'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleApprove(curso.id); }} className="btn btn-green" style={{ flex: 1, padding: '8px 0' }}>Aprobar</button>
                    <button onClick={(e) => { e.stopPropagation(); handleRejectCourse(curso.id); }} className="btn btn-outline" style={{ flex: 1, padding: '8px 0', borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }}>Rechazar</button>
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
              <div key={curso.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openCourseDetail(curso)}>
                {curso.image_url ? <img src={curso.image_url} className="course-img" /> : <div className="course-img" style={{ backgroundColor: 'var(--border-color)' }} />}
                <h3 style={{ margin: '15px 0 10px 0' }}>{curso.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center' }}>
                    <ClockIcon /> {curso.estimated_time || 'No definido'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {session.role === 'admin' && cursosSuspendidos?.length > 0 && (
          <div className="section-box" style={{ borderColor: 'var(--neon-red)', marginTop: '20px' }}>
            <h2 style={{ marginTop: 0, color: 'var(--neon-red)' }}>Bóveda de Cursos Inactivos</h2>
            <div className="grid-cursos">
              {cursosSuspendidos.map(curso => (
                <div key={curso.id} className="card" style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => openCourseDetail(curso)}>
                  {curso.image_url ? <img src={curso.image_url} className="course-img" /> : <div className="course-img" style={{ backgroundColor: 'var(--border-color)' }} />}
                  <h3 style={{ margin: '15px 0 10px 0' }}>{curso.title}</h3>
                  <span className="tag-badge selected" style={{ backgroundColor: curso.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: curso.status === 'rejected' ? 'var(--neon-red)' : 'var(--neon-orange)', borderColor: curso.status === 'rejected' ? 'var(--neon-red)' : 'var(--neon-orange)' }}>
                    {curso.status === 'suspended' ? 'Suspendido' : 'Rechazado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
}