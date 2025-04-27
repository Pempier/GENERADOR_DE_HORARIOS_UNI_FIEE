const cursos_objetivo = [];

document.addEventListener("DOMContentLoaded", () => {
  inicializarEventos();
  cargarCursos();
});

function inicializarEventos() {
  document.getElementById("buscarCurso").addEventListener("input", filtrarTabla);
  document.getElementById("buscarCiclo").addEventListener("input", filtrarTabla);
  document.getElementById("procesar").addEventListener("click", procesarSeleccion);
}

async function cargarCursos() {
  try {
    const res = await fetch("/api/cursos");
    const data = await res.json();
    mostrarTabla(data);
  } catch (err) {
    console.error("Error al cargar cursos:", err);
  }
}

function mostrarTabla(cursos) {
  const tbody = document.getElementById("contenidoTabla");
  tbody.innerHTML = "";

  cursos.forEach((curso, index) => {
    const fila = document.createElement("tr");
    fila.classList.add("seleccion");
    fila.innerHTML = `
      <td><input type="checkbox" id="check_${index}" data-curso='${JSON.stringify(curso)}'></td>
      <td>${curso.COD}</td>
      <td>${curso.CURSO}</td>
      <td>${curso.CICLO}</td>
    `;
    const checkbox = fila.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", (e) => manejarSeleccion(e, fila));
    tbody.appendChild(fila);
  });
}

function manejarSeleccion(e, fila) {
  const cursoSeleccionado = JSON.parse(e.target.dataset.curso);
  const index = cursos_objetivo.findIndex(c => c.COD === cursoSeleccionado.COD);

  if (e.target.checked && index === -1) {
    cursos_objetivo.push(cursoSeleccionado);
    fila.classList.add("selected");
  } else if (!e.target.checked && index !== -1) {
    cursos_objetivo.splice(index, 1);
    fila.classList.remove("selected");
  }

  mostrarCursosSeleccionados();
}

function mostrarCursosSeleccionados() {
  const tbody = document.querySelector("#tablaSeleccionados tbody");
  tbody.innerHTML = cursos_objetivo.map(curso => `
    <tr>
      <td>${curso.COD}</td>
      <td>${curso.CURSO}</td>
      <td>${curso.CICLO}</td>
    </tr>
  `).join("");
}

function filtrarTabla() {
  const textoCurso = document.getElementById("buscarCurso").value.toLowerCase();
  const textoCiclo = document.getElementById("buscarCiclo").value.toLowerCase();

  document.querySelectorAll("#tablaCursos tbody tr").forEach(fila => {
    const [ , , curso, ciclo ] = fila.children;
    const visible = curso.textContent.toLowerCase().includes(textoCurso) &&
                    ciclo.textContent.toLowerCase().includes(textoCiclo);
    fila.style.display = visible ? "" : "none";
  });
}

async function procesarSeleccion() {
  if (cursos_objetivo.length === 0) {
    alert("Por favor selecciona al menos un curso.");
    return;
  }

  try {
    const response = await fetch('/procesar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cursos: cursos_objetivo })
    });
    const data = await response.json();

    if (response.ok) {
      console.log("✅ Horarios válidos encontrados:", data);
      guardarHorarios(data.horarios);
    } else {
      console.error("❌ Error:", data.error);
      alert("Error: " + data.error);
    }
  } catch (error) {
    console.error("⚠️ Error en la solicitud:", error);
    alert("Error de conexión con el servidor.");
  }
}

// Días de la semana en abreviado
const diasSemana = ["LU", "MA", "MI", "JU", "VI", "SA"];

// Horas base (puedes ajustar según tus bloques horarios)
const horas = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
    "19:00", "20:00", "21:00", "22:00"
];

// Función para limpiar y crear 14 casillas por cada día
function inicializarCalendario() {
    diasSemana.forEach(dia => {
        const contenedor = document.getElementById(dia);
        contenedor.innerHTML = '';

        for (let i = 0; i < 14; i++) {
            const casilla = document.createElement('div');
            casilla.className = 'calendar_event';
            casilla.style.cssText = `
                left: 0%; position:relative; top: -490px; width: 100%;
                height: 35px; overflow: hidden; cursor: n-resize;
            `;

            const contenido = document.createElement('div');
            contenido.className = 'calendar_event_inner';
            contenido.style.cssText = `
                font-size: 10px; text-align: center;
            `;
            contenido.innerHTML = '<br><br>'; // vacías inicialmente

            const barra = document.createElement('div');
            barra.className = 'calendar_event_bar';
            barra.style.backgroundColor = 'transparent';

            casilla.appendChild(contenido);
            casilla.appendChild(barra);
            contenedor.appendChild(casilla);
        }
    });
}

// Función para convertir hora "HH:MM" a índice de casilla
function horaAHoraIndex(hora) {
    if (!hora) return -1;
    
    if (typeof hora === 'number') {
        return hora - 8;  // ya es número de la hora
    }
    
    if (typeof hora === 'string') {
        const [h, m] = hora.split(':').map(Number);
        return h - 8;
    }
    
    return -1; // otro tipo raro
}

// Función para llenar el horario en el calendario
function llenarHorario(horario) {
    inicializarCalendario(); // limpia todo

    horario.forEach(clase => {
        const dia = clase.DIA;  // LU, MA, MI, etc.
        const h_ini = clase.H_INI; // ejemplo: "15:00"
        const h_fin = clase.H_FIN; // ejemplo: "18:00"

        // Calculamos en qué casillas colocar
        const inicioIndex = horaAHoraIndex(h_ini);
        const finIndex = horaAHoraIndex(h_fin);

        if (inicioIndex >= 0 && finIndex > inicioIndex) {
            for (let i = inicioIndex; i < finIndex; i++) {
                const contenedor = document.getElementById(dia);
                if (contenedor && contenedor.children[i]) {
                    contenedor.children[i].querySelector('.calendar_event_inner').innerHTML = `
                        ${clase.CURSO} <br> ${clase.TIPO} <br>
                    `;
                }
            }
        }
    });
}

let horariosGlobal = [];
let horarioActual = 0;

// Función para guardar los horarios recibidos
function guardarHorarios(horarios) {
    horariosGlobal = horarios;
    horarioActual = 0;
    mostrarHorarioBonito(horariosGlobal[horarioActual]);
}

// Función para mostrar un horario
function mostrarHorarioBonito(horario) {
    const contenedor = document.getElementById('resultado');
    contenedor.innerHTML = '';
  
    //Mostrar Contador
    const contador = document.createElement('p');
    contador.innerHTML = `<strong>Horario ${horarioActual + 1} de ${horariosGlobal.length}</strong>`;
    contenedor.appendChild(contador);
  
    const tabla = document.createElement('table');
    tabla.className = "table table-striped";
    tabla.id = "tablaHorarios";

    const thead = document.createElement('thead');
    thead.className = "table-dark";
    thead.innerHTML = `
        <tr>
            <th>Código</th>
            <th>Curso</th>
            <th>Docente</th>
            <th>Sección</th>
            <th>Tipo</th>
            <th>Día</th>
            <th>Hora Inicio</th>
            <th>Hora Fin</th>
            <th>Salón</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');

    horario.forEach(fila => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fila.COD}</td>
            <td>${fila.CURSO}</td>
            <td>${fila.DOCENTE}</td>
            <td>${fila.SECC}</td>
            <td>${fila.TIPO}</td>
            <td>${fila.DIA}</td>
            <td>${fila.H_INI}</td>
            <td>${fila.H_FIN}</td>
            <td>${fila.SALON}</td>
        `;
        tbody.appendChild(tr);
    });

    tabla.appendChild(thead);
    tabla.appendChild(tbody);
    contenedor.appendChild(tabla);

    // AQUI ACTUALIZAMOS EL CALENDARIO GRAFICO
    llenarHorario(horario);
}

// Funciones para botones
function mostrarAnterior() {
    if (horarioActual > 0) {
        horarioActual--;
        mostrarHorarioBonito(horariosGlobal[horarioActual]);
    }
}

function mostrarSiguiente() {
    if (horarioActual < horariosGlobal.length - 1) {
        horarioActual++;
        mostrarHorarioBonito(horariosGlobal[horarioActual]);
    }
}

