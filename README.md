# 📚 Portal de Consulta de Notas (Mis Notas)

Este proyecto es una aplicación web sencilla y eficiente construida con **React y Vite** que actúa como un visor público de las calificaciones de los alumnos. El sistema obtiene todas las notas directamente desde una o varias hojas de cálculo de **Google Sheets** publicadas como archivos CSV.

### 📌 Características Principales

  * **Sistema de Evaluación de Córdoba:** La lógica de calificación (aprobación con 7) se basa en la normativa provincial.
  * **Sincronización Automática:** Lee datos de Google Sheets en tiempo real (con un *delay* de caché de Google, generalmente de 1-5 minutos).
  * **Organización Flexible:** Soporta múltiples cursos/materias con estructuras de temas diferentes, gestionados mediante pestañas individuales de Google Sheets.
  * **Resumen Docente:** Muestra un listado de los nombres de los alumnos desaprobados en cada tema para un seguimiento focalizado.
  * **Ficha Individual:** Permite al alumno buscar su nombre para ver su reporte detallado.
  * **Reporte PDF:** Los alumnos pueden descargar su ficha de notas en formato PDF.

-----

### ⚙️ Configuración de Datos (Google Sheets)

El único lugar donde se modifican las notas es en la hoja de cálculo de Google.

#### 1\. Estructura de la Hoja de Cálculo

Debe tener un solo archivo de Google Sheets, pero **cada curso debe estar en una pestaña (Hoja)** diferente.

  * **Pestaña:** `4to A`, `5to B`, etc.
  * **Fila 1 (Encabezados):** Siga este formato estricto. Las columnas se agrupan de a cuatro para cada tema:

| Columna | A | B | C | D | E | F | G | H | I | J | ... |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Encabezado** | `Alumno` | `Tema 1` | `R1` | `R2` | `Col` | `Tema 2` | `R1` | `R2` | `Col` | `...` |

**Valores Válidos y Criterio de Córdoba:**

  * **Aprobación:** $\ge 7$ (Siete).
  * **Notas:** Números del 1 al 10.
  * **Ausentes:** `AI` (Ausente Injustificado) o `AJ` (Ausente Justificado).
  * **Sin Dato:** `-` (Guion, no deje la celda en blanco).

#### 2\. Publicación de los Enlaces CSV

Necesita un enlace CSV **diferente para cada pestaña** de curso:

1.  En la Hoja de Cálculo: Vaya a **Archivo \> Compartir \> Publicar en la web**.
2.  En el menú de la izquierda, **seleccione la pestaña** (ej. `4to A`).
3.  En el menú de la derecha, seleccione el formato **Valores separados por comas (.csv)**.
4.  Haga clic en **Publicar** y copie el enlace que aparece.
5.  Repita los pasos 2-4 para cada una de sus pestañas (`5to B`, etc.).

#### 3\. Conexión en el Código

En el archivo **`src/App.jsx`**, reemplace los enlaces en el objeto `CURSOS_CONFIG` con sus enlaces CSV únicos:

```javascript
  const CURSOS_CONFIG = {
    // ESTOS ENLACES DEBEN SER LOS OBTENIDOS DEL PASO ANTERIOR:
    "4to Año A": "TU_LINK_CSV_PARA_LA_PESTAÑA_4TO_A",
    "5to Año B": "TU_LINK_CSV_PARA_LA_PESTAÑA_5TO_B",
    "6to Año C": "TU_LINK_CSV_PARA_LA_PESTAÑA_6TO_C",
    // Agregue o quite cursos aquí, el nombre de la izquierda será el botón
  };
```

-----

### 📐 Estructura de Calificación (Sistema Córdoba)

La lógica del código determina la nota final de cada tema tomando la última instancia de evaluación registrada:

$$\text{Nota Final} = \text{Coloquio} \rightarrow \text{R2} \rightarrow \text{R1} \rightarrow \text{1ra Nota}$$

  * **AJ:** Ausente Justificado.
  * **AI:** Ausente Insuficiente (cuenta como desaprobado).

-----

### 🚀 Instalación y Despliegue

Este proyecto utiliza **Vite** y se despliega mediante **GitHub Pages**.

#### Requisitos

  * Node.js (v14+ o superior)
  * Una cuenta de GitHub con el repositorio creado.
  * El paquete `gh-pages` instalado (`npm install gh-pages --save-dev`).

#### 1\. Configuración de Rutas (Importante)

Asegúrese de que el archivo `vite.config.js` esté configurado con la ruta de su repositorio (por defecto, `/mis-notas/`):

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // RUTA BASE: Debe ser el nombre de su repositorio en GitHub
  base: '/mis-notas/', 
})
```

#### 2\. Comandos de Despliegue

Cada vez que se modifique el código (`App.jsx` con nuevos links o funcionalidades) debe ejecutar el siguiente proceso para actualizar la web pública:

```bash
# 1. Registrar todos los cambios en el código
git add .

# 2. Crear un punto de guardado (commit)
git commit -m "Actualización de notas o cambios de código"

# 3. Subir y publicar la versión final en GitHub Pages
npm run deploy
```

-----

### 🔧 Mantenimiento de la Aplicación

| Tarea | Archivo/Lugar | Acción |
| :--- | :--- | :--- |
| **Actualizar Notas** | Google Sheets | Cambiar el valor en la celda. **No necesita código.** |
| **Agregar Curso** | `src/App.jsx` | 1. Crear nueva pestaña en Sheets y obtener su link CSV. 2. Añadir el nuevo par `nombre: link` al objeto `CURSOS_CONFIG`. 3. Ejecutar `npm run deploy`. |
| **Cambiar Siglas/Reglas** | `src/App.jsx` | Modificar la función `calculateStatus`. |




# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
