const cursos_objetivo = [];
const contenedor = document.getElementById("lista-cursos");
const salida = document.getElementById("seleccionados");

document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/cursos")
    .then(res => res.json())
    .then(data => mostrarTabla(data));

  document.getElementById("buscarCurso").addEventListener("input", filtrarTabla);
  document.getElementById("buscarCiclo").addEventListener("input", filtrarTabla);

  document.getElementById("procesar").addEventListener("click", () => {
    console.log("Cursos seleccionados:", cursos_objetivo);
    // Puedes enviar cursos_objetivo al backend si quieres
    mostrarCursosSeleccionados();
    // Envía los cursos seleccionados al backend (Flask)
    fetch("/procesar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cursos: cursos_objetivo })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        // Mostrar la imagen del horario generado
        const img = document.createElement("img");
        img.src = `data:image/png;base64,${data.image}`;
        document.getElementById("resultado").innerHTML = "";
        document.getElementById("resultado").appendChild(img);
      } else {
        alert(data.message || "Error al generar el horario.");
      }
    })
    .catch(err => {
      console.error("Error al procesar los datos:", err);
      alert("Hubo un error al procesar los datos.");
    });
  });
});

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
    checkbox.addEventListener("change", (e) => {
      const cursoSeleccionado = JSON.parse(e.target.dataset.curso);
      if (e.target.checked) {
        cursos_objetivo.push(cursoSeleccionado);
        fila.classList.add("selected");  // Agregar clase "selected" (verde) cuando se selecciona
      } else {
        const index = cursos_objetivo.findIndex(c => c.COD === cursoSeleccionado.COD);
        if (index !== -1) cursos_objetivo.splice(index, 1);
        fila.classList.remove("selected");  // Eliminar clase "selected" cuando se deselecciona
      }
      mostrarCursosSeleccionados();
    });

    tbody.appendChild(fila);
  });
}

function mostrarCursosSeleccionados() {
  // Limpiar la tabla de cursos seleccionados antes de agregar los nuevos datos
  const tbodySeleccionados = document.getElementById("tablaSeleccionados").getElementsByTagName("tbody")[0];
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

function guardarCursos() {
  const blob = new Blob([JSON.stringify(cursos_objetivo)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cursos_seleccionados.json";
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("procesar").addEventListener("click", async () => {
  try {
      if (cursos_objetivo.length === 0) {
          alert("Por favor selecciona al menos un curso");
          return;
      }

      const response = await fetch("http://127.0.0.1:10000/procesar", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
              cursos: cursos_objetivo.map(curso => curso.CURSO) 
          }),
      });

      if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === "success") {
          const img = document.createElement("img");
          img.src = `data:image/png;base64,${data.image}`;
          document.getElementById("resultado").innerHTML = "";
          document.getElementById("resultado").appendChild(img);
      } else {
          alert(data.message || "Error al generar el horario");
      }
  } catch (error) {
      console.error("Error al procesar:", error);
      alert(`Error al conectar con el servidor: ${error.message}`);
  }
});
