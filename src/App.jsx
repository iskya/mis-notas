import React, { useState, useMemo } from 'react';
import { 
  Users, BookOpen, XCircle, Lock, LogOut, Eye, ChevronLeft, 
  BarChart2, FolderOpen, Plus, Trash2, Download, ClipboardCheck
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// --- COMPONENTE LOGIN ---
const LoginModal = ({ password, setPassword, handleLogin, setShowLogin, loginError }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-indigo-900"><Lock className="text-indigo-600"/> Acceso Docente</h2>
      <input 
        type="password" autoFocus
        className="w-full p-4 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" 
        placeholder="Contraseña..."
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
      />
      <div className="flex gap-2">
        <button onClick={handleLogin} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">Entrar</button>
        <button onClick={() => setShowLogin(false)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold">Cancelar</button>
      </div>
      {loginError && <p className="text-red-500 mt-3 text-sm text-center">{loginError}</p>}
    </div>
  </div>
);

const GradesDashboard = () => {
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('schoolData_v2');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [activeCourse, setActiveCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const TEACHER_PASSWORD = 'profesor2024';

  const saveAll = (newCourses) => {
    setCourses(newCourses);
    localStorage.setItem('schoolData_v2', JSON.stringify(newCourses));
  };

  // --- LÓGICA DE CÁLCULO (Incluye Coloquio) ---
  const calculateTopicStatus = (topic) => {
    // Orden de prioridad: Coloquio > R2 > R1 > Primera
    const lastGrade = topic.coloquio !== '-' ? topic.coloquio :
                     topic.recuperatorio2 !== '-' ? topic.recuperatorio2 : 
                     topic.recuperatorio1 !== '-' ? topic.recuperatorio1 : topic.primera;
    
    if (lastGrade === 'AJ') return { label: 'AJ', color: 'bg-amber-100 text-amber-800', isFailed: false, longLabel: 'Ausente Justificado' };
    if (lastGrade === 'AI' || lastGrade === '1') return { label: 'Insuf.', color: 'bg-red-100 text-red-800', isFailed: true, longLabel: 'Insuficiente' };
    if (lastGrade === '-') return { label: 'S/D', color: 'bg-slate-100 text-slate-400', isFailed: false, longLabel: 'Sin Datos' };
    
    const num = parseFloat(lastGrade);
    return num >= 7 
      ? { label: num, color: 'bg-emerald-100 text-emerald-800', isFailed: false, longLabel: 'Aprobado' }
      : { label: num, color: 'bg-red-100 text-red-800', isFailed: true, longLabel: 'Desaprobado' };
  };

  // --- GENERACIÓN DE PDF ---
const downloadPDF = (student) => {
  try {
    const doc = new jsPDF();
    
    // Configuración estética del PDF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Color Indigo
    doc.text("REPORTE DE CALIFICACIONES", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Curso: ${courses[activeCourse].name}`, 20, 30);
    doc.text(`Estudiante: ${student.name}`, 20, 37);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 20, 44);

    // Definir las filas de la tabla
    const tableRows = student.topics.map(t => {
      const res = calculateTopicStatus(t);
      return [
        t.name, 
        t.primera, 
        t.recuperatorio1, 
        t.recuperatorio2, 
        t.coloquio, 
        res.longLabel
      ];
    });

    // Generar la tabla usando el plugin autotable
    doc.autoTable({
      startY: 50,
      head: [['Tema', '1ra Nota', 'Recup. 1', 'Recup. 2', 'Coloquio', 'Estado Final']],
      body: tableRows,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillStyle: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillStyle: [245, 247, 250] },
    });

    // Descargar el archivo
    doc.save(`Notas_${student.name.replace(/\s/g, '_')}.pdf`);
    
  } catch (error) {
    console.error("Error generando el PDF:", error);
    alert("No se pudo generar el PDF. Asegúrate de haber instalado jspdf (npm install jspdf jspdf-autotable)");
  }
};

  // --- ESTADÍSTICAS POR TEMA ---
  const statsByTopic = useMemo(() => {
    if (!activeCourse || !courses[activeCourse]?.students.length) return [];
    const students = courses[activeCourse].students;
    return students[0].topics.map((_, idx) => ({
      name: students[0].topics[idx].name,
      failed: students.filter(s => calculateTopicStatus(s.topics[idx]).isFailed)
    }));
  }, [activeCourse, courses]);

  // --- HANDLERS (AJ/AI) ---
  const markSpecial = (studentId, topicIdx, val) => {
    const newStudents = courses[activeCourse].students.map(s => {
      if (s.id === studentId) {
        const newTopics = [...s.topics];
        // Asigna al primer campo vacío disponible
        const field = newTopics[topicIdx].primera === '-' ? 'primera' : 
                      newTopics[topicIdx].recuperatorio1 === '-' ? 'recuperatorio1' : 'recuperatorio2';
        newTopics[topicIdx][field] = val;
        return { ...s, topics: newTopics };
      }
      return s;
    });
    saveAll({ ...courses, [activeCourse]: { ...courses[activeCourse], students: newStudents } });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(/[,;\t]/).map(h => h.trim());
    
    const students = lines.slice(1).map((line, i) => {
      const v = line.split(/[,;\t]/).map(val => val.trim());
      const topics = [];
      // Ajuste para leer P, R1, R2, Coloq (4 campos por tema)
      for (let j = 1; j < v.length; j += 4) {
        topics.push({
          name: headers[j]?.replace(/Primera/i, '').trim() || `Tema ${topics.length + 1}`,
          primera: v[j] || '-', recuperatorio1: v[j+1] || '-', 
          recuperatorio2: v[j+2] || '-', coloquio: v[j+3] || '-'
        });
      }
      return { id: Date.now() + i, name: v[0], topics };
    }).filter(s => s.name);

    saveAll({ ...courses, [activeCourse]: { ...courses[activeCourse], students } });
  };

  if (!activeCourse) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        {showLogin && <LoginModal password={password} setPassword={setPassword} handleLogin={() => { if(password === TEACHER_PASSWORD) { setIsTeacher(true); setShowLogin(false); setPassword(''); } else setLoginError('Clave incorrecta'); }} setShowLogin={setShowLogin} loginError={loginError} />}
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl font-black text-indigo-900 mb-8 flex items-center gap-3"><FolderOpen size={40} className="text-indigo-600" /> Mis Cursos</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(courses).map(([id, curso]) => (
              <div key={id} className="group relative bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-200 transition cursor-pointer" onClick={() => setActiveCourse(id)}>
                <h3 className="text-xl font-bold text-slate-800">{curso.name}</h3>
                <p className="text-slate-400 text-sm">{curso.students.length} alumnos</p>
                {isTeacher && <button onClick={(e) => { e.stopPropagation(); if(confirm("¿Borrar curso?")) { const {[id]:_, ...rest} = courses; saveAll(rest); } }} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>}
              </div>
            ))}
            {isTeacher && <button onClick={() => { const n = prompt("Nombre:"); if(n) saveAll({...courses, [Date.now()]: {name: n, students: []}}); }} className="border-2 border-dashed border-slate-300 p-6 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 transition"><Plus size={32}/> <span className="font-bold">Nuevo Curso</span></button>}
          </div>
          {!isTeacher && <button onClick={() => setShowLogin(true)} className="mt-10 w-full py-4 rounded-xl border-2 border-indigo-100 text-indigo-600 font-bold hover:bg-indigo-50 transition">Acceso Docente</button>}
        </div>
      </div>
    );
  }

  const currentCourse = courses[activeCourse];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => { setActiveCourse(null); setSelectedStudent(null); }} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold"><ChevronLeft/> Cursos</button>
        <div className="text-center"><h2 className="text-xl font-black text-indigo-900 uppercase">{currentCourse.name}</h2></div>
        {isTeacher ? <button onClick={() => setIsTeacher(false)} className="text-red-500 font-bold flex items-center gap-2"><LogOut size={18}/> Salir</button> : <div className="w-20"></div>}
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* ESTADÍSTICAS POR TEMA (Solo Profesor) */}
        {isTeacher && !selectedStudent && (
          <div className="mb-10">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart2 size={16}/> Resumen de Desempeño</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {statsByTopic.map((stat, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className={`p-3 flex justify-between items-center ${stat.failed.length > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <span className="font-bold text-slate-700">{stat.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${stat.failed.length > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {stat.failed.length} desaprobados
                    </span>
                  </div>
                  <div className="p-3 flex flex-wrap gap-1">
                    {stat.failed.length === 0 ? <p className="text-[10px] text-slate-400 italic">Sin alertas</p> : stat.failed.map(s => <span key={s.id} className="bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 text-[10px] font-bold">{s.name}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTADO DE ALUMNOS (Vista Alumno) */}
        {!isTeacher && !selectedStudent && (
          <div className="bg-white rounded-3xl shadow-xl border overflow-hidden max-w-xl mx-auto">
             <div className="p-8 text-center bg-indigo-600 text-white"><h2 className="text-2xl font-bold">Panel de Estudiantes</h2><p className="opacity-80">Selecciona tu nombre</p></div>
             <div className="divide-y max-h-[50vh] overflow-y-auto">
                {currentCourse.students.map(s => <button key={s.id} onClick={() => setSelectedStudent(s)} className="w-full p-4 flex justify-between items-center hover:bg-slate-50 transition font-bold text-slate-700">{s.name} <Eye className="text-indigo-200" size={18}/></button>)}
             </div>
          </div>
        )}

        {/* FICHA DEL ALUMNO + PDF */}
        {selectedStudent && (
          <div className="max-w-4xl mx-auto">
             <div className="bg-white p-8 rounded-3xl shadow-lg border mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">{selectedStudent.name}</h2>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{currentCourse.name}</p>
                  </div>
                  <button onClick={() => downloadPDF(selectedStudent)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"><Download size={20}/> Descargar PDF</button>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStudent.topics.map((t, i) => {
                  const st = calculateTopicStatus(t);
                  return (
                    <div key={i} className="bg-white p-6 rounded-2xl border-2 border-slate-100 flex justify-between items-center shadow-sm">
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 mb-2">{t.name}</h4>
                        <div className="grid grid-cols-4 gap-1 text-[9px] font-bold uppercase text-slate-400">
                          <div className="text-center">1º<br/><span className="text-slate-900 text-xs">{t.primera}</span></div>
                          <div className="text-center">R1<br/><span className="text-slate-900 text-xs">{t.recuperatorio1}</span></div>
                          <div className="text-center">R2<br/><span className="text-slate-900 text-xs">{t.recuperatorio2}</span></div>
                          <div className="text-center text-indigo-600">Coloq.<br/><span className="text-indigo-900 text-xs">{t.coloquio}</span></div>
                        </div>
                      </div>
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-black text-sm ml-4 ${st.color}`}>{st.label}</div>
                    </div>
                  );
                })}
             </div>
             <button onClick={() => setSelectedStudent(null)} className="mt-8 mx-auto block text-slate-400 font-bold">Cerrar Ficha</button>
          </div>
        )}

        {/* TABLA DOCENTE (Excel Style) */}
        {isTeacher && !selectedStudent && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mt-6">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><ClipboardCheck size={18}/> Editor de Notas</h3>
              <div className="flex gap-2">
                <input type="file" onChange={handleFileUpload} className="text-[10px] file:bg-indigo-500 file:border-0 file:text-white file:px-2 file:py-1 file:rounded cursor-pointer"/>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[9px]">
                  <tr>
                    <th className="p-4 text-left border-b sticky left-0 bg-slate-50 z-10 w-48">Estudiante</th>
                    {currentCourse.students[0]?.topics.map((t, i) => (
                      <th key={i} className="p-2 border-b border-l min-w-[160px]">
                        <span className="text-indigo-600 font-black">{t.name}</span>
                        <div className="flex justify-around mt-1"><span>1º</span><span>R1</span><span>R2</span><span className="text-indigo-600">Col</span></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentCourse.students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 text-left font-bold border-r sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{s.name}</td>
                      {s.topics.map((t, ti) => (
                        <td key={ti} className="p-2 border-l">
                          <div className="flex flex-col gap-1 items-center">
                            <div className="flex gap-1">
                              {['primera', 'recuperatorio1', 'recuperatorio2', 'coloquio'].map(f => (
                                <div key={f} className="relative group">
                                  <input 
                                    className={`w-7 h-7 text-center border rounded outline-none focus:ring-1 focus:ring-indigo-500 ${f === 'coloquio' ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}
                                    value={t[f]}
                                    onChange={(e) => {
                                      const newVal = e.target.value;
                                      const newStudents = currentCourse.students.map(std => {
                                        if(std.id === s.id) {
                                          const nt = [...std.topics];
                                          nt[ti][f] = newVal;
                                          return {...std, topics: nt};
                                        }
                                        return std;
                                      });
                                      saveAll({...courses, [activeCourse]: {...currentCourse, students: newStudents}});
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => markSpecial(s.id, ti, 'AJ')} className="text-[8px] px-1 bg-amber-100 text-amber-700 rounded font-bold">AJ</button>
                              <button onClick={() => markSpecial(s.id, ti, 'AI')} className="text-[8px] px-1 bg-red-100 text-red-700 rounded font-bold">AI</button>
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GradesDashboard;