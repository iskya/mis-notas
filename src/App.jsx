import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Users, Eye, ChevronLeft, Download, Search, AlertCircle, Loader2, BarChart2 } from 'lucide-react';

// Cargar la librería jsPDF globalmente si se usa la opción de CDN en index.html
// const { jsPDF } = window.jspdf; // Esta línea se usa DENTRO de downloadPDF

const GradesDashboard = () => {
  // --- 1. CONFIGURACIÓN DE TUS LINKS ---
  // Reemplaza cada "LINK_CSV_..." por el enlace que te da Google Sheets al publicar cada PESTAÑA como CSV.
  const CURSOS_CONFIG = {
    "4to Año D Física": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1GKSL-lyXI45UanB4aunjI4Q4IXPDcrZdUoShk6DFWA89E7tWlNTHsAOaqfTilE3d_R6mHJ5Q2mC1/pub?gid=269490703&single=true&output=csv",
    "4to Año D Electrotecnia": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1GKSL-lyXI45UanB4aunjI4Q4IXPDcrZdUoShk6DFWA89E7tWlNTHsAOaqfTilE3d_R6mHJ5Q2mC1/pub?gid=1423441074&single=true&output=csv",
    "5to Año D Física": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1GKSL-lyXI45UanB4aunjI4Q4IXPDcrZdUoShk6DFWA89E7tWlNTHsAOaqfTilE3d_R6mHJ5Q2mC1/pub?gid=1950775004&single=true&output=csv",
    "5to Año E Física": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1GKSL-lyXI45UanB4aunjI4Q4IXPDcrZdUoShk6DFWA89E7tWlNTHsAOaqfTilE3d_R6mHJ5Q2mC1/pub?gid=1071694189&single=true&output=csv"
  };

  // --- ESTADOS ---
  const [data, setData] = useState([]); 
  const [activeCourse, setActiveCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- LÓGICA DE CALCIFICACIÓN ---
  const calculateStatus = (t) => {
    // Prioridad: Coloquio > R2 > R1 > 1ra
    const last = t.coloquio !== '-' ? t.coloquio : 
                 t.recuperatorio2 !== '-' ? t.recuperatorio2 : 
                 t.recuperatorio1 !== '-' ? t.recuperatorio1 : t.primera;

    if (last === '-' || last === '') return { label: 'S/D', color: 'bg-slate-100 text-slate-400', long: 'Sin Datos', isFailed: false };
    if (last === 'AJ') return { label: 'AJ', color: 'bg-amber-100 text-amber-700', long: 'Ausente Justificado', isFailed: false };
    
    const num = parseFloat(last);
    
    // AI o cualquier nota < 7 se considera desaprobada
    if (last === 'AI' || num < 7) return { label: last, color: 'bg-red-100 text-red-700', long: 'Desaprobado', isFailed: true };
    
    return { label: num, color: 'bg-emerald-100 text-emerald-700', long: 'Aprobado', isFailed: false };
  };
  
  // --- ESTADÍSTICAS POR TEMA (Calculado al cargar un curso) ---
  const statsByTopic = useMemo(() => {
    if (!data.length) return [];
    
    const topicCount = data[0].topics.length;
    
    // Inicializar el array de estadísticas
    const stats = Array(topicCount).fill(0).map((_, i) => ({
      name: data[0].topics[i].name,
      failedCount: 0,
    }));

    // Iterar sobre todos los alumnos para contar los desaprobados
    data.forEach(student => {
      student.topics.forEach((topic, topicIndex) => {
        const status = calculateStatus(topic);
        if (status.isFailed) {
          stats[topicIndex].failedCount++;
        }
      });
    });

    return stats;
  }, [data]);


  // --- CARGA DE DATOS DESDE SHEETS ---
  const loadCourseData = async (courseName) => {
    setLoading(true);
    setActiveCourse(courseName);
    setSelectedStudent(null);
    setSearchTerm('');
    
    try {
      const response = await fetch(CURSOS_CONFIG[courseName]);
      const csvText = await response.text();
      
      const lines = csvText.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsed = lines.slice(1).map((line, idx) => {
        const v = line.split(',').map(val => val.trim());
        const student = { id: idx, name: v[0], topics: [] };
        
        // Estructura: Alumno (0), P(1), R1(2), R2(3), Col(4)...
        for (let i = 1; i < v.length; i += 4) {
          student.topics.push({
            name: headers[i]?.replace(/1ra|P/i, '').trim() || `Tema ${(i+3)/4}`,
            primera: v[i] || '-',
            recuperatorio1: v[i+1] || '-',
            recuperatorio2: v[i+2] || '-',
            coloquio: v[i+3] || '-'
          });
        }
        return student;
      });
      setData(parsed);
    } catch (err) {
      console.error(err);
      alert("No se pudo conectar con Google Sheets. Verifica que la pestaña esté 'Publicada en la web' como CSV.");
      setActiveCourse(null);
    } finally {
      setLoading(false);
    }
  };

  // --- GENERACIÓN DE PDF (Vía CDN) ---
  const downloadPDF = (student) => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(67, 56, 202); 
      doc.text("REPORTE DE NOTAS", 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Estudiante: ${student.name}`, 20, 32);
      doc.text(`Curso: ${activeCourse}`, 20, 39);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 46);

      const tableRows = student.topics.map(t => [
        t.name, t.primera, t.recuperatorio1, t.recuperatorio2, t.coloquio, calculateStatus(t).long
      ]);

      doc.autoTable({
        startY: 55,
        head: [['Tema', '1ra', 'Recup 1', 'Recup 2', 'Coloquio', 'Estado']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillStyle: [67, 56, 202], textColor: 255 },
        styles: { fontSize: 9 }
      });

      doc.save(`Notas_${student.name.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
      alert("Error al generar el PDF. Asegúrate de tener las librerías CDN en index.html.");
    }
  };

  // --- VISTA: CARGANDO ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="font-bold text-slate-600">Sincronizando con Google Sheets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10 font-sans text-slate-900">
      {/* NAVBAR */}
      <nav className="bg-white border-b px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={28}/>
            <h1 className="text-xl font-black text-indigo-900 tracking-tight uppercase">Portal Escolar</h1>
          </div>
          {activeCourse && (
            <button 
              onClick={() => {setActiveCourse(null); setSelectedStudent(null);}}
              className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600 transition"
            >
              <ChevronLeft size={18}/> Cambiar Curso
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        
        {/* SELECTOR DE CURSOS (INICIO) */}
        {!activeCourse && (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Bienvenido</h2>
              <p className="text-slate-500">Selecciona tu curso para consultar tus calificaciones</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(CURSOS_CONFIG).map(curso => (
                <button 
                  key={curso} 
                  onClick={() => loadCourseData(curso)}
                  className="bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-indigo-500 hover:shadow-xl transition-all text-left group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                    <Users size={60}/>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 mb-1">{curso}</h3>
                  <p className="text-slate-400 font-bold text-sm">Acceder al listado →</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- RESUMEN DE DESEMPEÑO (NUEVA SECCIÓN) --- */}
        {activeCourse && !selectedStudent && data.length > 0 && (
          <div className="mb-8 animate-in fade-in duration-500">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart2 size={16}/> Resumen de Desempeño del Curso
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {statsByTopic.map((stat, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase block truncate mb-2">{stat.name}</span>
                  <div className={`text-2xl font-black ${stat.failedCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {stat.failedCount}
                  </div>
                  <p className="text-xs text-slate-400">Desaprobados</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTADO DE ALUMNOS DEL CURSO */}
        {activeCourse && !selectedStudent && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
              <div className="p-6 bg-indigo-900 text-white">
                <h2 className="text-xl font-bold mb-4">{activeCourse}</h2>
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 text-white/40" size={20}/>
                  <input 
                    type="text" 
                    placeholder="Escribe tu nombre para buscar..." 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-12 pr-4 outline-none focus:bg-white/20 transition placeholder:text-white/40 font-medium"
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="divide-y max-h-[60vh] overflow-y-auto">
                {data.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                  data
                    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => setSelectedStudent(s)} 
                        className="w-full p-5 flex justify-between items-center hover:bg-indigo-50 transition group"
                      >
                        <span className="text-lg font-bold text-slate-700 group-hover:text-indigo-600">{s.name}</span>
                        <Eye size={20} className="text-slate-300 group-hover:text-indigo-400"/>
                      </button>
                    ))
                ) : (
                  <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
                    <AlertCircle size={32} className="opacity-20"/>
                    <p className="font-medium">No se encontraron alumnos con ese nombre.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FICHA DETALLADA DEL ALUMNO */}
        {selectedStudent && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden mb-6">
              <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 leading-tight mb-2">{selectedStudent.name}</h2>
                  <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    <Users size={14}/> {activeCourse}
                  </div>
                </div>
                <button 
                  onClick={() => downloadPDF(selectedStudent)} 
                  className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 w-full md:w-auto justify-center"
                >
                  <Download size={20}/> Descargar Notas
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {selectedStudent.topics.map((t, i) => {
                  const st = calculateStatus(t);
                  return (
                    <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center hover:shadow-md transition">
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-lg mb-3">{t.name}</h4>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center bg-white p-2 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">1ra</p>
                            <p className="font-bold text-sm">{t.primera}</p>
                          </div>
                          <div className="text-center bg-white p-2 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">R1</p>
                            <p className="font-bold text-sm">{t.recuperatorio1}</p>
                          </div>
                          <div className="text-center bg-white p-2 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">R2</p>
                            <p className="font-bold text-sm">{t.recuperatorio2}</p>
                          </div>
                          <div className="text-center bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                            <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Col</p>
                            <p className="font-bold text-sm text-indigo-700">{t.coloquio}</p>
                          </div>
                        </div>
                      </div>
                      <div className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center font-black ml-6 border-b-4 ${st.color} shadow-sm`}>
                        <span className="text-[10px] opacity-60 uppercase mb-0.5">Nota</span>
                        <span className="text-lg leading-none">{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button 
              onClick={() => setSelectedStudent(null)} 
              className="w-full py-4 text-slate-400 font-bold hover:text-indigo-600 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20}/> Volver al listado
            </button>
          </div>
        )}
      </main>
      
      {/* FOOTER INFORMATIVO */}
      <footer className="text-center p-6 text-slate-400 text-xs font-medium">
        Actualizado mediante Google Sheets • Sistema de Gestión Escolar v3.0
      </footer>
    </div>
  );
};

export default GradesDashboard;