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
        cursos = df.drop_duplicates(subset=["CURSO"])[["COD", "CURSO", "CICLO"]]
        return jsonify(cursos.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": f"Error al cargar cursos: {e}"}), 500

@app.route("/procesar", methods=["POST"])
def procesar():
    data = request.get_json()
    cursos_objetivo = data.get("cursos", [])

    if not cursos_objetivo:
        return jsonify({"error": "No se enviaron cursos"}), 400

    try:
        cursos_data = obtener_cursos_data(cursos_objetivo)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

    combinaciones = list(product(*cursos_data.values()))

    combinaciones_validas = [
        pd.concat(combinacion)[["CURSO", "SECC", "TIPO", "DIA", "H_INI", "H_FIN", "SALON"]].to_dict(orient="records")
        for combinacion in combinaciones
        if cruces_validos(pd.concat(combinacion))
    ]

    return jsonify({
        "cantidad": len(combinaciones_validas),
        "horarios": combinaciones_validas
    })

# -------------------- MAIN --------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)

