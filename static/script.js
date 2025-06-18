let cursos_objetivo = [];
let contenidoTablaFijo1 = [];

document.addEventListener("DOMContentLoaded", () => {
  inicializarEventos();
  cargarCursos();
});

function inicializarEventos() {
  document.getElementById("buscarCurso").addEventListener("input", filtrarTabla);
  document.getElementById("buscarCiclo").addEventListener("input", filtrarTabla);
  document.getElementById("buscarCursoFijo").addEventListener("input", filtrarTablaFijo);
  document.getElementById("buscarCicloFijo").addEventListener("input", filtrarTablaFijo);
  document.getElementById("procesar").addEventListener("click", procesarSeleccion);
}

async function cargarCursos() {
  try {
    const res = await fetch("/api/cursos");
    const data = await res.json();
    console.log("Datos planos:", data);
    mostrarTabla(data);
    mostrarTablaFijo(data);
    console.log("Datos contenidotablafijo1:", contenidoTablaFijo1);
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
      <td style="width: 0%;text-align: center;"><input type="checkbox" id="check_${index}" data-curso='${JSON.stringify(curso)}'></td>
      <td style="width: 11%;text-align: center;">${curso.COD}</td>
      <td style="width: 50%;text-align: center;">${curso.CURSO}</td>
      <td style="width: 10%;text-align: center;">${curso.CICLO}</td>
    `;
    const checkbox = fila.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", (e) => {
      manejarSeleccion(e, fila);
      // Llamar a la función para bloquear/desbloquear los checkboxes de la tabla fija
      sincronizarCheckboxes(e.target, curso.COD);
        const estaMarcado = e.target.checked;
        const codigoCurso = curso.COD; // este es el código de la fila marcada
      
        // 🔥 Buscar las filas de contenidoTablaFijo que tengan el mismo código
        const filasFijas = document.querySelectorAll("#contenidoTablaFijo tr.fila-curso");
        
        filasFijas.forEach(filaFija => {
          const codigoFijo = filaFija.children[1].textContent.trim();
          
          if (codigoFijo === codigoCurso) {
            // Esta fila corresponde al mismo curso
            
            // Buscar los checkboxes dentro de su subtabla
            const filaSecciones = filaFija.nextElementSibling; // la fila de secciones está justo después
            const checkboxesSecciones = filaSecciones.querySelectorAll("input[type='checkbox']");
            if (!estaMarcado) {
              // 🔴 Si se desmarca el checkbox, eliminar curso de contenidoTablaFijo1
              contenidoTablaFijo1 = contenidoTablaFijo1.filter(c => c.COD !== codigoCurso);
            }          
            checkboxesSecciones.forEach(chk => {
              chk.disabled = estaMarcado; // desactivar si el principal está marcado
              if (estaMarcado) {
                chk.checked = false; // opcional: quitar selección si lo desactivas
              }
            });

            // Opcional: añadir clase para mostrar deshabilitado visualmente
            if (estaMarcado) {
              filaFija.classList.add("selected");
              filaFija.classList.add("deshabilitado");
            } else {
              filaFija.classList.remove("selected");
              filaFija.classList.remove("deshabilitado");
            }
          }
        });
    });
    tbody.appendChild(fila);
  });
}

function manejarSeleccion(e, fila) {
  const checked = e.target.checked;
  const codigoCurso = fila.children[1].textContent.trim();  // columna COD

  // Cambiar clase visual en la fila
  if (checked) {
    fila.classList.add("selected");
  } else {
    fila.classList.remove("selected");
  }

  // 🔥 SINCRONIZAR hacia contenidoTablaFijo al desmarcar
  if (!checked) {
    const filasTablaFijo = document.querySelectorAll("#contenidoTablaFijo tr.fila-curso");
    filasTablaFijo.forEach(filaFijo => {
      const codigoFilaFijo = filaFijo.children[1].textContent.trim();
      if (codigoFilaFijo === codigoCurso) {
        // buscar TODOS los checkboxes dentro de la subtabla
        const checkboxesSecciones = filaFijo.nextElementSibling.querySelectorAll("input[type='checkbox']");
        checkboxesSecciones.forEach(checkbox => {
          if (checkbox.checked) {
            checkbox.checked = false;
          }
        });

        // quitar la clase si estaba seleccionada
        filaFijo.classList.remove("selected");
      }
    });
  }

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
  const textoCiclo = document.getElementById("buscarCiclo").value;

  // Filtrar en ambas barras de búsqueda
  document.querySelectorAll("#tablaCursos tbody tr").forEach(fila => {
    const [ , , curso, ciclo ] = fila.children;

    const coincideCurso = curso.textContent.toLowerCase().includes(textoCurso);
    const coincideCiclo = (textoCiclo === "" || ciclo.textContent.trim() === textoCiclo);

    fila.style.display = (coincideCurso && coincideCiclo) ? "" : "none";
  });
}

function filtrarTablaFijo() {
  const textoCurso = document.getElementById("buscarCursoFijo").value.toLowerCase();
  const textoCiclo = document.getElementById("buscarCicloFijo").value;

  // Iterar solo sobre las filas de cursos
  document.querySelectorAll("#contenidoTablaFijo tr.fila-curso").forEach(filaCurso => {
    const celdas = filaCurso.querySelectorAll("td");

    const ciclo = celdas[0].textContent.trim();
    const curso = celdas[2].textContent.trim().toLowerCase();

    const coincideCurso = curso.includes(textoCurso);
    const coincideCiclo = (textoCiclo === "" || ciclo === textoCiclo);

    const mostrar = coincideCurso && coincideCiclo;

    // Mostrar/ocultar fila del curso
    filaCurso.style.display = mostrar ? "" : "none";

    // También mostrar/ocultar la fila de secciones asociada (que es la siguiente fila)
    const filaSecciones = filaCurso.nextElementSibling;
    if (filaSecciones && filaSecciones.classList.contains("fila-secciones")) {
      filaSecciones.style.display = mostrar ? "" : "none";
    }
  });
}

async function procesarSeleccion() {
  // Filtramos cursos_objetivos con base en contenidoTablaFijo1
  const cursosFiltrados = cursos_objetivo.map(cursoObj => {
  // Buscar si este curso está en contenidoTablaFijo1
  const cursoMatch = contenidoTablaFijo1.find(cursoSel => cursoSel.COD === cursoObj.COD);

  if (cursoMatch) {
    // Si hay coincidencia, filtrar las secciones
    const seccionesFiltradas = cursoObj.secciones.filter(seccionObj =>
      cursoMatch.secciones.some(seccionSel => seccionSel.SECC === seccionObj.SECC)
    );

    // Si quedan secciones, devolvemos el curso con solo esas secciones
    if (seccionesFiltradas.length > 0) {
      return {
        ...cursoObj,
        secciones: seccionesFiltradas
      };
    } else {
      return null; // Eliminar curso si no tiene secciones válidas
    }
  }

  // Si no hay coincidencia, dejar el curso tal cual
  return cursoObj;
}).filter(Boolean); // Eliminar los nulls

// Reasignar si quieres sobrescribir
cursos_objetivo.splice(0, cursos_objetivo.length, ...cursosFiltrados);

if (cursos_objetivo.length === 0) {
  alert("Por favor selecciona al menos un curso.");
  return;
}

console.log("cursos_objetivo actualizados:", cursos_objetivo);

  try {
    const response = await fetch('/procesar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cursos: cursos_objetivo })
    });
    const data = await response.json();

    console.log("✅ Horarios válidos encontrados:", data);

    if (response.ok) {
      // Filtrar los horarios basados en las secciones de cursos_objetivo
      const horariosFiltrados = data.horarios.filter(combinacion => {
        return combinacion.every(horario => {
          const cursoObj = cursos_objetivo.find(curso => curso.COD === horario.COD);
          if (!cursoObj) return false;
      
          return cursoObj.secciones.some(seccion => seccion.SECC === horario.SECC);
        });
      });

      if (horariosFiltrados.length > 0) {
        console.log("✅ Horarios válidos encontrados:", horariosFiltrados);
        guardarHorarios(horariosFiltrados);
      } else {
        console.log("❌ No se encontraron horarios válidos.");
        alert("No se encontraron horarios válidos para las secciones seleccionadas.");
      }
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
            contenido.innerHTML = ''; // vacías inicialmente

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
                    const calendarEventInner = contenedor.children[i].querySelector('.calendar_event_inner');
                    
                    // Si ya hay contenido en la celda (cruce de horarios)
                    if (calendarEventInner.innerHTML.trim() !== "") {
                        calendarEventInner.innerHTML += ` / ${clase.CURSO} ${clase.TIPO} `;
                    } else {
                        // Si no hay contenido, asignamos el primer curso
                        calendarEventInner.innerHTML = `${clase.CURSO} ${clase.TIPO} `;
                    }
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

function toggleCursos(boton) {
const filaEstudiante = boton.closest('.fila-estudiante');
const filaCursos = filaEstudiante.nextElementSibling;
filaCursos.classList.toggle('hidden');
boton.classList.toggle('open');
boton.textContent = filaCursos.classList.contains('hidden') ? '▼' : '▲';
}

function toggleDetalles(boton) {
const filaCurso = boton.closest('tr');
const filaDetalles = filaCurso.nextElementSibling;
filaDetalles.classList.toggle('hidden');
boton.textContent = filaDetalles.classList.contains('hidden') ? '+' : '-';
}

function seleccionarUnico(checkbox) {
const filaCurso = checkbox.closest('tr');
const tabla = checkbox.closest('table');

// DESMARCAR las demás casillas en esta tabla
tabla.querySelectorAll('input[type="checkbox"]').forEach(cb => {
if (cb !== checkbox) cb.checked = false;
});

const estudianteRow = tabla.closest('.fila-curso').previousElementSibling;
const estudianteNombre = estudianteRow.querySelector('td').textContent;
const cursoNombre = filaCurso.children[1].textContent;
const nota = filaCurso.children[2].textContent;

const tbody = document.getElementById('tablaSeleccionadosBody');

// ELIMINAR cualquier fila existente de este estudiante
[...tbody.rows].forEach(row => {
if (row.cells[0].textContent === estudianteNombre) {
  tbody.deleteRow(row.rowIndex - 1);
}
});

// Si la casilla está marcada, agregar la nueva fila
if (checkbox.checked) {
const nuevaFila = tbody.insertRow();
nuevaFila.insertCell().textContent = estudianteNombre;
nuevaFila.insertCell().textContent = cursoNombre;
nuevaFila.insertCell().textContent = nota;
}
}

function mostrarTablaFijo(cursos) {
  const tbody = document.getElementById("contenidoTablaFijo");
  cursos.forEach(curso => {
    // Crear la fila principal del curso
    const filaCurso = document.createElement("tr");
    filaCurso.classList.add("fila-curso");
  
    filaCurso.innerHTML = `
      <td style="width: 0%; text-align:center;">${curso.CICLO}</td>
      <td style="width: 20%; text-align:center;">${curso.COD}</td>
      <td style="width: 45%; text-align:center;">${curso.CURSO}</td>
      <td style="width: 10%; text-align:center;"><button class="btn-toggle">▼</button></td>
    `;
    tbody.appendChild(filaCurso);
  
    // Crear la fila de secciones (subtabla)
    const filaSecciones = document.createElement("tr");
    filaSecciones.classList.add("fila-secciones", "hidden");
    const tdSecciones = document.createElement("td");
    tdSecciones.colSpan = 4;
  
    // Crear tabla de secciones
    const tablaSecciones = document.createElement("table");
    tablaSecciones.classList.add("table", "table-bordered", "tabla-secciones");
  
    tablaSecciones.innerHTML = `
      <thead style="position: static; background-color: #212529;">
        <tr>
          <th style="position: static;">Seleccionar</th>
          <th style="position: static;">Sección</th>
          <th style="position: static;">Acción</th>
        </tr>
      </thead>
    `;
  
    const tbodySecciones = document.createElement("tbody");
  
    // Iteramos sobre las secciones del curso
    curso.secciones.forEach(seccion => {
      // Fila de la sección
      const filaSeccion = document.createElement("tr");
  
      filaSeccion.innerHTML = `
        <td><input type="checkbox"></td>
        <td>${seccion.SECC}</td>
        <td><button class="btn-toggle">+</button></td>
      `;
      tbodySecciones.appendChild(filaSeccion);
      const checkbox = filaSeccion.querySelector("input[type=checkbox]");

      checkbox.addEventListener("change", (e) => {
        // Desmarcar otros checkboxes
        tbodySecciones.querySelectorAll("input[type=checkbox]").forEach(cb => {
          if (cb !== e.target) cb.checked = false;
        });
      
        const filaCurso = filaSecciones.previousElementSibling;
        const codigoCurso = filaCurso.children[1].textContent.trim();
      
        // Quitar curso anterior si existe
        const index = contenidoTablaFijo1.findIndex(item => item.COD === codigoCurso);
        if (index !== -1) {
          contenidoTablaFijo1.splice(index, 1);
        }
      
        if (e.target.checked) {
          // Obtener datos completos del curso actual
          const cursoSeleccionado = {
            CICLO: curso.CICLO,
            COD: curso.COD,
            CURSO: curso.CURSO,
            secciones: [
              {
                SECC: seccion.SECC,
                detalles: [...seccion.detalles]
              }
            ]
          };
          contenidoTablaFijo1.push(cursoSeleccionado);
        }
      
        console.log("contenidoTablaFijo1", contenidoTablaFijo1);
      });

      tbodySecciones.addEventListener("change", (e) => {
        const filaSecciones = e.currentTarget.closest("tr.fila-secciones");
        const filaCurso = filaSecciones.previousElementSibling;
        if (e.target.type === "checkbox") {
          // Desmarcar los demás checkboxes de esta subtabla
          tbodySecciones.querySelectorAll("input[type=checkbox]").forEach(cb => {
            if (cb !== e.target && cb.checked) {
              cb.checked = false;
              cb.dispatchEvent(new Event("change", { bubbles: true }));
            }
          });
      
          const haySeleccionado = Array.from(tbodySecciones.querySelectorAll("input[type=checkbox]"))
                                      .some(checkbox => checkbox.checked);
      
          // Cambiar color de filaCurso
          if (haySeleccionado) {
            filaCurso.classList.add("selected");
          } else {
            filaCurso.classList.remove("selected");
          }
      
          // 🔥 SINCRONIZAR COLOR CON LA TABLA DE CURSOS VARIABLES
          const codigoCurso = filaCurso.children[1].textContent.trim();
          const filasTablaCursos = document.querySelectorAll("#tablaCursos tbody tr");
          filasTablaCursos.forEach(fila => {
            const codigoFila = fila.children[1].textContent.trim();
            if (codigoFila === codigoCurso) {
              if (haySeleccionado) {
                fila.classList.add("selected");
              } else {
                fila.classList.remove("selected");
              }
      
              // ✅ AQUÍ: sincronizar checkbox de tabla principal
              const checkboxMostrarTabla = fila.querySelector("input[type=checkbox]");
              if (haySeleccionado) {
                if (!checkboxMostrarTabla.checked) {
                  checkboxMostrarTabla.checked = true;
                  manejarSeleccion({ target: checkboxMostrarTabla }, fila);
                }
              } else {
                if (checkboxMostrarTabla.checked) {
                  checkboxMostrarTabla.checked = false;
                  manejarSeleccion({ target: checkboxMostrarTabla }, fila);
                }
              }
            }
          });
        }
      });

      // Fila de detalles (sub-subtabla)
      const filaDetalles = document.createElement("tr");
      filaDetalles.classList.add("fila-detalles", "hidden");
  
      const tdDetalles = document.createElement("td");
      tdDetalles.colSpan = 3;
  
      const tablaDetalles = document.createElement("table");
      tablaDetalles.classList.add("table", "table-sm", "tabla-detalles");
  
      tablaDetalles.innerHTML = `
        <thead style="position: static; background-color: #212529;">
          <tr>
            <th style="position: static;">Tipo</th>
            <th style="position: static;">Día</th>
            <th style="position: static;">Hora_i</th>
            <th style="position: static;">Hora_f</th>
            <th style="position: static;">Profesor</th>
          </tr>
        </thead>
      `;
  
      const tbodyDetalles = document.createElement("tbody");
  
      // Iteramos sobre los detalles de la sección
      seccion.detalles.forEach(detalle => {
        const filaDet = document.createElement("tr");
        filaDet.innerHTML = `
          <td>${detalle.TIPO}</td>
          <td>${detalle.DIA}</td>
          <td>${detalle.H_INI}</td>
          <td>${detalle.H_FIN}</td>
          <td>${detalle.DOCENTE}</td>
        `;
        tbodyDetalles.appendChild(filaDet);
      });
  
      tablaDetalles.appendChild(tbodyDetalles);
      tdDetalles.appendChild(tablaDetalles);
      filaDetalles.appendChild(tdDetalles);
  
      // Agregar fila detalles a subtabla
      tbodySecciones.appendChild(filaDetalles);
  
      // Listener para botón "+"
      const btnDetalle = filaSeccion.querySelector(".btn-toggle");
      btnDetalle.addEventListener("click", () => {
        filaDetalles.classList.toggle("hidden");
      });
    });
  
    tablaSecciones.appendChild(tbodySecciones);
    tdSecciones.appendChild(tablaSecciones);
    filaSecciones.appendChild(tdSecciones);
  
    tbody.appendChild(filaSecciones);
  
    // Listener para botón "▼"
    const btnSeccion = filaCurso.querySelector(".btn-toggle");
    btnSeccion.addEventListener("click", () => {
      filaSecciones.classList.toggle("hidden");
    });
  });
}

function sincronizarCheckboxes(checkboxTablaCursos, codigoCurso) {
  const checkboxesFijos = document.querySelectorAll("#contenidoTablaFijo .fila-curso");
  
  checkboxesFijos.forEach(filaCursoFijo => {
    const codigoFilaFijo = filaCursoFijo.children[1].textContent.trim();
    
    if (codigoFilaFijo === codigoCurso) {
      // Encontramos la fila del curso correspondiente en la tabla fija
      const checkboxesSecciones = filaCursoFijo.querySelectorAll(".tabla-secciones input[type='checkbox']");
      
      // Si el checkbox en la tabla principal está marcado, deshabilitamos los checkboxes en la tabla fija
      checkboxesSecciones.forEach(checkbox => {
        checkbox.disabled = checkboxTablaCursos.checked;  // Deshabilitar si está marcado
      });
    }
  });
}

const pdfGenerate = document.querySelector("#pdf_generate");

pdfGenerate.addEventListener('click', event => {
    event.preventDefault();

    const scheduleGroup = document.querySelector("#schedule-group");

    html2pdf().from(scheduleGroup).set({
        margin: [0, 0, 0, 0],
        filename: 'horario_generado_uni.pdf',
        image: { 
          type: 'jpeg', 
          quality: 500
        },
        html2canvas: { 
          scale: 1 
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'landscape' 
        }
    }).save();

});
