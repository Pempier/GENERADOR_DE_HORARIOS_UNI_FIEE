# GENERADOR_DE_HORARIOS_UNI_FIEE
Este proyecto es una **plataforma web para generar horarios académicos personalizados**. Permite seleccionar cursos fijos y variables conforme al **reglamento de matrícula**, y genera todas las combinaciones posibles de horarios válidos, los cuales pueden visualizarse en un calendario descargable en formato **PDF**.

---

## 🚀 Funcionalidades principales

- Carga de cursos desde archivos Excel a la base de datos.
- Interfaz intuitiva con selección de cursos fijos y variables.
- Generación automática de combinaciones válidas de horarios.
- Visualización de horarios en un calendario académico.
- Exportación del calendario en formato PDF.
- Cumplimiento del reglamento de matrícula al validar combinaciones.

---

## 🧩 Arquitectura del Sistema

### 🔹 Frontend

Desarrollado con:

- **HTML**
- **JavaScript**
- **CSS + Bootstrap**

El frontend permite la interacción con el usuario, desde la selección de cursos hasta la visualización del calendario generado.

### 🔹 Backend

Implementado con:

- **Python + Flask** como framework principal.
- **API REST** para comunicar el cliente con el servidor.
- **Supabase** como sistema de base de datos en la nube.
- **Algoritmo en Python** para generación de combinaciones horarias válidas.

---

## ⚙️ Flujo de funcionamiento

1. El usuario selecciona cursos fijos y variables desde el navegador.
2. La selección es enviada vía `fetch` al backend (API Flask).
3. El backend consulta los horarios en **Supabase**, cargados previamente desde un archivo Excel.
4. Se ejecuta un **algoritmo de generación de combinaciones** en Python, respetando el reglamento de matrícula.
5. Las combinaciones válidas son devueltas en formato **JSON** al cliente.
6. El cliente renderiza estas combinaciones en un **calendario visual**.
7. El usuario puede **descargar el calendario como PDF**.

---

## 🗃️ Base de Datos

- La base de datos está alojada en **Supabase**.
- Se carga mediante un archivo **Excel** que contiene la tabla de cursos, horarios, códigos, secciones, créditos y requisitos.
- Las peticiones de la API se basan en esta tabla para obtener información precisa.

---

## 📦 Tecnologías utilizadas

| Componente   | Tecnología                 |
|--------------|----------------------------|
| Frontend     | HTML, CSS, Bootstrap, JS   |
| Backend      | Python, Flask              |
| API          | RESTful API con Flask      |
| Base de datos| Supabase (PostgreSQL)      |
| Exportación  | JavaScript (ej. html2pdf)  |
| Hosting      | Local / Nube (Heroku, etc) |

---

## 📄 Formato de entrada (Excel)

El archivo Excel debe contener las siguientes columnas mínimas:

- Código del curso
- Nombre
- Sección
- Días y horas
- Créditos
- Tipo (fijo/variable)
- Requisitos (si aplica)

---

## 📤 Respuesta de la API

```json
{
  "combinaciones_validas": [
    {
      "horarios": [
        { "curso": "MAT101", "dia": "Lunes", "hora": "8:00 - 10:00" },
        { "curso": "FIS102", "dia": "Martes", "hora": "10:00 - 12:00" }
      ],
      "total_creditos": 20
    }
  ]
}
