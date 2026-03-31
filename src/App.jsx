const parsed = lines.slice(1).map((line, idx) => {
  const v = line.split(',').map(val => val.trim());
  const student = { id: idx, name: v[0], topics: [] };  
  
  // Estructura: Alumno (0), Tema1_1ra(1), Tema1_R1(2), Tema1_R2(3), Tema1_Col(4), Tema2_1ra(5)...
  for (let i = 1; i < v.length; i += 4) {
    student.topics.push({
      name: headers[i]?.trim() || `Tema ${(i+3)/4}`,
      primera: v[i] || '-',$
      recuperatorio1: v[i+1] || '-',$
      recuperatorio2: v[i+2] || '-',$
      coloquio: v[i+3] || '-'
    });
  }
  return student;
});
