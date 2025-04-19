const cursos_objetivo = [];
const contenedor = document.getElementById("lista-cursos");
const salida = document.getElementById("seleccionados");

fetch("/api/cursos")
  .then(response => response.json())
  .then(cursos => {
    cursos.forEach((curso, index) => {
      const div = document.createElement("div");
      div.className = "curso";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `curso_${index}`;
      checkbox.value = curso;

      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          cursos_objetivo.push(e.target.value);
        } else {
          const i = cursos_objetivo.indexOf(e.target.value);
          if (i !== -1) cursos_objetivo.splice(i, 1);
        }
        salida.textContent = JSON.stringify(cursos_objetivo, null, 2);
      });

      const label = document.createElement("label");
      label.htmlFor = `curso_${index}`;
      label.textContent = curso;

      div.appendChild(checkbox);
      div.appendChild(label);
      contenedor.appendChild(div);
    });
  });

function guardarCursos() {
  const blob = new Blob([JSON.stringify(cursos_objetivo)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cursos_seleccionados.json";
  a.click();
  URL.revokeObjectURL(url);
}