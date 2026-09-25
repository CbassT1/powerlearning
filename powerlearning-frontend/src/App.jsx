import { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView';
import DashboardView from './components/DashboardView';
import CourseDetailView from './components/CourseDetailView';
import AdminUserDetailView from './components/AdminUserDetailView';
import MyCoursesView from './components/MyCoursesView';
import Header from './components/Header';
import UsersView from './components/UsersView';
import AppealsView from './components/AppealsView';
import Modal from './components/Modal';
import './App.css';

function App() {
  const [session, setSession] = useState(null); 
  const [cursos, setCursos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [appeals, setAppeals] = useState([]); 
  const [misCursos, setMisCursos] = useState([]); 
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [backView, setBackView] = useState('dashboard'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Estado del Modal Custom
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'confirm', onConfirm: null, danger: false, confirmText: 'Aceptar' });

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchCourses = () => {
    const url = session?.role === 'admin' ? 'http://localhost:3000/api/courses?role=admin' : 'http://localhost:3000/api/courses';
    fetch(url).then(res => res.json()).then(data => setCursos(Array.isArray(data) ? data : [])).catch(console.error);
  };

  const fetchUsers = () => {
    if (session?.role === 'admin') fetch('http://localhost:3000/api/auth/users?role=admin').then(res => res.json()).then(data => setUsuarios(Array.isArray(data) ? data : [])).catch(console.error);
  };

  const fetchAppeals = () => {
    if (session?.role === 'admin') fetch('http://localhost:3000/api/auth/appeals?role=admin').then(res => res.json()).then(data => setAppeals(Array.isArray(data) ? data : [])).catch(console.error);
  };

  const fetchMyCourses = () => {
    if (session && session.role !== 'admin') {
      fetch(`http://localhost:3000/api/courses/my-courses/${session.userId}?role=${session.role}`)
        .then(res => res.json()).then(data => setMisCursos(Array.isArray(data) ? data : [])).catch(console.error);
    }
  };

  useEffect(() => {
    if (session) { fetchCourses(); fetchUsers(); fetchAppeals(); fetchMyCourses(); }
  }, [session, currentView]);

  const handleEnroll = async (courseId) => {
    try {
      const response = await fetch('http://localhost:3000/api/courses/enroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.userId, courseId }) });
      const data = await response.json();
      if (response.ok) {
        showToast(data.mensaje);
        fetchMyCourses(); 
      } else {
        showToast(data.error);
      }
    } catch (error) { showToast('Error al inscribirse'); }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/courses/${id}/approve`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: session.role }) });
      if (res.ok) { fetchCourses(); fetchMyCourses(); showToast('Curso aprobado'); }
    } catch (error) { showToast('Error de conexión'); }
  };

  const handleRejectCourse = (id) => {
    setModalConfig({
      isOpen: true, title: 'Rechazar Curso', message: 'Escribe el motivo del rechazo. El profesor verá este mensaje en su panel.',
      type: 'prompt', danger: true, confirmText: 'Rechazar',
      onConfirm: async (reason) => {
        if (!reason || !reason.trim()) return showToast('Debes ingresar un motivo');
        closeModal();
        try {
          const res = await fetch(`http://localhost:3000/api/courses/${id}/reject`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: session.role, reason }) });
          if(res.ok) { fetchCourses(); fetchMyCourses(); showToast('Curso rechazado'); }
        } catch (error) { console.error(error); }
      }
    });
  };

  const handleSuspendCourse = (id) => {
    setModalConfig({
      isOpen: true, title: 'Suspender Curso', message: '¿Estás seguro de suspender este curso? Desaparecerá del catálogo principal y los alumnos no podrán inscribirse.',
      type: 'confirm', danger: true, confirmText: 'Suspender',
      onConfirm: async () => {
        closeModal();
        try {
          const res = await fetch(`http://localhost:3000/api/courses/${id}/suspend`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: session.role }) });
          if(res.ok) { fetchCourses(); fetchMyCourses(); setCurrentView('dashboard'); showToast('Curso suspendido'); }
        } catch (error) { console.error(error); }
      }
    });
  };

  const handleBlockUser = (id) => {
    setModalConfig({
      isOpen: true, title: 'Bloquear Usuario', message: 'Ingresa el motivo del bloqueo. Este usuario perderá acceso inmediato a la plataforma.',
      type: 'prompt', danger: true, confirmText: 'Bloquear',
      onConfirm: async (reason) => {
        if (!reason || !reason.trim()) return showToast('Debes ingresar un motivo');
        closeModal();
        try {
          const res = await fetch(`http://localhost:3000/api/auth/users/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: session.role, reason }) });
          if(res.ok) { showToast('Usuario suspendido exitosamente'); fetchUsers(); setCurrentView('users'); }
        } catch (error) { console.error(error); }
      }
    });
  };

  const handleUnblockUser = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/auth/users/${id}/unblock`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: session.role }) });
      if(res.ok) { showToast('Usuario reactivado'); fetchUsers(); fetchAppeals(); setCurrentView('users'); }
    } catch (error) { console.error(error); }
  };

  const handleHardDeleteUser = (id) => {
    setModalConfig({
      isOpen: true, title: 'Eliminar Usuario', message: '¿Estás seguro de eliminar a este usuario PERMANENTEMENTE? Esta acción destruirá sus datos y no se puede deshacer.',
      type: 'confirm', danger: true, confirmText: 'Eliminar Permanentemente',
      onConfirm: async () => {
        closeModal();
        try {
          const res = await fetch(`http://localhost:3000/api/auth/users/${id}/hard`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: session.role }) });
          if(res.ok) { showToast('Usuario eliminado de forma definitiva'); fetchUsers(); fetchAppeals(); setCurrentView('users'); }
        } catch (error) { console.error(error); }
      }
    });
  };

  const openCourseDetail = (curso, fromView = 'dashboard') => { 
      setSelectedCourse(curso); 
      setBackView(fromView); 
      setCurrentView('courseDetail'); 
  };
  
  const openUserDetail = async (userId) => {
    const res = await fetch(`http://localhost:3000/api/auth/users/${userId}`);
    const data = await res.json();
    setSelectedUser(data);
    setCurrentView('userDetail');
  };

  const cursosFiltrados = cursos.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()) && c.status === 'approved');
  const cursosPendientes = cursos.filter(c => c.status === 'pending');
  const cursosSuspendidos = cursos.filter(c => c.status === 'suspended' || c.status === 'rejected');

  if (!session) {
    return (
      <>
        {toast && <div className="toast-popup">{toast}</div>}
        <AuthView setSession={setSession} showToast={showToast} />
      </>
    );
  }

  return (
    <div className="container">
      {toast && <div className="toast-popup">{toast}</div>}
      
      <Header session={session} setSession={setSession} setCurrentView={setCurrentView} searchQuery={searchQuery} setSearchQuery={setSearchQuery} appealsCount={appeals.length} />

      {currentView === 'dashboard' && <DashboardView session={session} cursosPendientes={cursosPendientes} cursosFiltrados={cursosFiltrados} cursosSuspendidos={cursosSuspendidos} handleApprove={handleApprove} handleRejectCourse={handleRejectCourse} openCourseDetail={openCourseDetail} />}
      
      {currentView === 'profile' && <ProfileView session={session} setSession={setSession} showToast={showToast} fetchCourses={fetchCourses} fetchMyCourses={fetchMyCourses} setCurrentView={setCurrentView} />}

      {currentView === 'myCourses' && <MyCoursesView session={session} misCursos={misCursos} openCourseDetail={openCourseDetail} setCurrentView={setCurrentView} />}

      {currentView === 'courseDetail' && selectedCourse && (
        <CourseDetailView session={session} selectedCourse={selectedCourse} setCurrentView={setCurrentView} handleEnroll={handleEnroll} handleApprove={handleApprove} handleRejectCourse={handleRejectCourse} handleSuspendCourse={handleSuspendCourse} fetchCourses={fetchCourses} fetchMyCourses={fetchMyCourses} showToast={showToast} backView={backView} setModalConfig={setModalConfig} closeModal={closeModal} />
      )}

      {currentView === 'userDetail' && selectedUser && (
        <AdminUserDetailView session={session} selectedUser={selectedUser} setCurrentView={setCurrentView} fetchUsers={fetchUsers} openUserDetail={openUserDetail} showToast={showToast} handleBlockUser={handleBlockUser} handleUnblockUser={handleUnblockUser} handleHardDeleteUser={handleHardDeleteUser} setModalConfig={setModalConfig} closeModal={closeModal} />
      )}

      {currentView === 'appeals' && session.role === 'admin' && <AppealsView appeals={appeals} openUserDetail={openUserDetail} />}

      {currentView === 'users' && session.role === 'admin' && <UsersView usuarios={usuarios} session={session} openUserDetail={openUserDetail} />}
      
      {/* MODAL GLOBAL PARA CONFIRMACIONES */}
      <Modal 
        isOpen={modalConfig.isOpen} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        type={modalConfig.type} 
        danger={modalConfig.danger}
        confirmText={modalConfig.confirmText}
        onConfirm={modalConfig.onConfirm} 
        onCancel={closeModal} 
      />
    </div>
  );
}

export default App;