const cursos_objetivo = [];

document.addEventListener("DOMContentLoaded", () => {
  inicializarEventos();
  cargarCursos();
});

function inicializarEventos() {
  document.getElementById("buscarCurso").addEventListener("input", filtrarTabla);
  document.getElementById("buscarCiclo").addEventListener("input", filtrarTabla);
  document.getElementById("procesar").addEventListener("click", procesarCursos);
}

function cargarCursos() {
  fetch("/api/cursos")
    .then(res => res.json())
    .then(data => mostrarTabla(data))
    .catch(err => console.error("Error al cargar cursos:", err));
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
  if (e.target.checked) {
    cursos_objetivo.push(cursoSeleccionado);
    fila.classList.add("selected");
  } else {
    const index = cursos_objetivo.findIndex(c => c.COD === cursoSeleccionado.COD);
    if (index !== -1) cursos_objetivo.splice(index, 1);
    fila.classList.remove("selected");
  }
  mostrarCursosSeleccionados();
}

function mostrarCursosSeleccionados() {
  const tbodySeleccionados = document.getElementById("tablaSeleccionados").querySelector("tbody");
  tbodySeleccionados.innerHTML = "";

  cursos_objetivo.forEach(curso => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${curso.COD}</td>
      <td>${curso.CURSO}</td>
      <td>${curso.CICLO}</td>
    `;
    tbodySeleccionados.appendChild(fila);
  });
}

function filtrarTabla() {
  const textoCurso = document.getElementById("buscarCurso").value.toLowerCase();
  const textoCiclo = document.getElementById("buscarCiclo").value.toLowerCase();

  const filas = document.querySelectorAll("#tablaCursos tbody tr");

  filas.forEach(fila => {
    const curso = fila.children[2].textContent.toLowerCase();
    const ciclo = fila.children[3].textContent.toLowerCase();

    const coincideCurso = curso.includes(textoCurso);
    const coincideCiclo = ciclo.includes(textoCiclo);

    fila.style.display = (coincideCurso && coincideCiclo) ? "" : "none";
  });
}

async function procesarCursos() {
  if (cursos_objetivo.length === 0) {
    alert("Por favor selecciona al menos un curso");
    return;
  }

  try {
    const response = await fetch("/procesar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cursos: cursos_objetivo })
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const data = await response.json();
    if (data.status === "success") {
      mostrarImagenHorario(data.image);
    } else {
      alert(data.message || "Error al generar el horario.");
    }
  } catch (error) {
    console.error("Error al procesar:", error);
    alert(`Error al conectar con el servidor: ${error.message}`);
  }
}

function mostrarImagenHorario(base64Image) {
  const resultado = document.getElementById("resultado");
  resultado.innerHTML = "";  // Limpiar resultados anteriores

  const img = document.createElement("img");
  img.src = `data:image/png;base64,${base64Image}`;
  resultado.appendChild(img);
}
