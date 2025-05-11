import os
from flask import Flask, request, jsonify, send_file
import pandas as pd
from itertools import product

app = Flask(__name__)

# -------------------- CONFIGURACIÓN --------------------

ARCHIVO_EXCEL = "HORARIOS.xlsx"

# Cargar y limpiar datos
try:
    df = pd.read_excel(ARCHIVO_EXCEL, sheet_name="Hoja1", skiprows=2)
except Exception as e:
    raise RuntimeError(f"Error al cargar el archivo Excel: {e}")

df.columns = [
    "ESP", "COD", "SECC", "CURSO", "DOCENTE",
    "TIPO", "CICLO", "DIA", "H_INI", "H_FIN", "SALON"
]

# Preprocesamiento
df = (df
      .dropna(subset=["CURSO", "SECC", "DIA", "H_INI", "H_FIN"])
      .query("CURSO != 'CURSO'")
)

df["H_INI"] = pd.to_numeric(df["H_INI"], errors="coerce")
df["H_FIN"] = pd.to_numeric(df["H_FIN"], errors="coerce")

df_grouped = df.groupby(["CURSO", "SECC"])

# -------------------- FUNCIONES --------------------

def cruces_validos(horarios):
    filas = horarios[["CURSO", "SECC", "TIPO", "DIA", "H_INI", "H_FIN"]].to_dict(orient="records")
    cruces = 0
    for i, h1 in enumerate(filas):
        for h2 in filas[i+1:]:
            if h1["DIA"] == h2["DIA"] and not (h1["H_FIN"] <= h2["H_INI"] or h2["H_FIN"] <= h1["H_INI"]):
                if "T" not in {h1["TIPO"], h2["TIPO"]}:
                    return False
                cruces += 1
                if cruces > 2:
                    return False
    return True

def obtener_cursos_data(cursos_objetivo):
    cursos_data = {}
    for curso_dict in cursos_objetivo:
        curso = curso_dict.get("CURSO")
        if not curso:
            continue
        secciones = []
        try:
            for secc in df[df["CURSO"] == curso]["SECC"].unique():
                grupo = df_grouped.get_group((curso, secc))
                secciones.append(grupo)
            if not secciones:
                raise KeyError
            cursos_data[curso] = secciones
        except KeyError:
            raise ValueError(f"Curso '{curso}' no encontrado")
    return cursos_data

# -------------------- RUTAS --------------------

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/api/cursos")
def api_cursos():
    try:
        cursos_completos = []

        # Iteramos sobre los cursos únicos
        for curso in df["CURSO"].unique():
            # Filtramos las secciones para este curso
            secciones = []
            for secc in df[df["CURSO"] == curso]["SECC"].unique():
                grupo = df_grouped.get_group((curso, secc))
                detalles = grupo[["TIPO", "DIA", "H_INI", "H_FIN", "DOCENTE"]].to_dict(orient="records")
                secciones.append({
                    "SECC": secc,
                    "detalles": detalles
                })

            cursos_completos.append({
                "COD": df[df["CURSO"] == curso]["COD"].iloc[0],  # El código del curso
                "CURSO": curso,
                "CICLO": df[df["CURSO"] == curso]["CICLO"].iloc[0],  # El ciclo del curso
                "secciones": secciones  # Secciones con detalles
            })

        # Imprimimos los datos para verificar que están completos
        print("Datos completos de los cursos:", cursos_completos)

        # Devolvemos la información completa como JSON
        return jsonify(cursos_completos)

    except Exception as e:
        return jsonify({"error": f"Error al cargar los cursos completos: {e}"}), 500

@app.route('/procesar', methods=['POST'])
def procesar():
    # Obtener los datos JSON enviados desde el frontend
    data = request.get_json()
    print("Datos recibidos:", data)  # Para verificar qué datos estamos recibiendo

    cursos_objetivo = data.get('cursos', [])
    
    if not cursos_objetivo:
        return jsonify({"error": "No se enviaron cursos"}), 400

    cursos_data = {}

    # Procesar cada curso en el objeto 'cursos_objetivo'
    for curso_dict in cursos_objetivo:
        curso_nombre = curso_dict["CURSO"]
        secciones_deseadas = curso_dict.get("secciones", [])
        print(f"Procesando curso: {curso_nombre} con secciones {secciones_deseadas}")

        secciones = []

        # Filtrar solo las secciones especificadas en 'secciones_deseadas'
        for secc in secciones_deseadas:
            secc_nombre = secc["SECC"]
            print(f"🔍 Buscando sección: {secc_nombre} para el curso {curso_nombre}")

            # Verificar si la sección existe en el DataFrame
            if (curso_nombre, secc_nombre) in df_grouped.groups:
                grupo = df_grouped.get_group((curso_nombre, secc_nombre))
                secciones.append(grupo)
            else:
                print(f"⚠️ No se encontró la sección {secc_nombre} para el curso {curso_nombre}")

        # Si se encontraron secciones, agregamos el curso y sus secciones
        if secciones:
            cursos_data[curso_nombre] = secciones
        else:
            print(f"⚠️ No se encontraron secciones válidas para el curso '{curso_nombre}'")

    # Si no se encontraron cursos o secciones válidas, devolvemos un error
    if not cursos_data:
        return jsonify({"error": "No se encontraron secciones para los cursos seleccionados."}), 404

    # Generar todas las combinaciones posibles con las secciones de los cursos
    combinaciones = list(product(*cursos_data.values()))

    combinaciones_validas = []
    for combinacion in combinaciones:
        horarios = pd.concat(combinacion)
        if cruces_validos(horarios):
            horarios_dict = horarios[["COD", "CURSO", "DOCENTE", "SECC", "TIPO", "DIA", "H_INI", "H_FIN", "SALON"]].to_dict(orient="records")
            combinaciones_validas.append(horarios_dict)

    if not combinaciones_validas:
        return jsonify({"error": "No se encontraron combinaciones válidas."}), 404

    return jsonify({
        "cantidad": len(combinaciones_validas),
        "horarios": combinaciones_validas
    })




# -------------------- MAIN --------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)

