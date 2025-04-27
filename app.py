import os
import io
import base64
from flask import Flask, request, jsonify, send_file
import pandas as pd
from itertools import product

app = Flask(__name__)

# Cargar archivo Excel una vez al iniciar
archivo = "HORARIOS.xlsx"
df = pd.read_excel(archivo, sheet_name='Hoja1', skiprows=2)

# Renombrar columnas
df.columns = [
    "ESP", "COD", "SECC", "CURSO", "DOCENTE",
    "TIPO", "CICLO", "DIA", "H_INI", "H_FIN", "SALON"
]

# Limpiar datos
df = df.dropna(subset=["CURSO", "SECC", "DIA", "H_INI", "H_FIN"])
df = df[df["CURSO"] != "CURSO"]
df["H_INI"] = pd.to_numeric(df["H_INI"], errors="coerce")
df["H_FIN"] = pd.to_numeric(df["H_FIN"], errors="coerce")

# Agrupar por curso y sección
df_grouped = df.groupby(["CURSO", "SECC"])

# --------------------
# Función para validar cruces
def cruces_validos(horarios):
    filas = horarios[["CURSO", "SECC", "TIPO", "DIA", "H_INI", "H_FIN"]].to_dict(orient="records")
    cruces = 0
    for i in range(len(filas)):
        for j in range(i+1, len(filas)):
            h1, h2 = filas[i], filas[j]
            if h1["DIA"] == h2["DIA"]:
                if not (h1["H_FIN"] <= h2["H_INI"] or h2["H_FIN"] <= h1["H_INI"]):
                    tipos = {h1["TIPO"], h2["TIPO"]}
                    if "T" not in tipos:
                        return False
                    cruces += 1
                    if cruces > 2:
                        return False
    return True

# --------------------
@app.route('/procesar', methods=['POST'])
def procesar():
    data = request.get_json()
    cursos_objetivo = data.get('cursos', [])

    if not cursos_objetivo:
        return jsonify({"error": "No se enviaron cursos"}), 400

    # Obtener secciones por curso
    cursos_data = {}
    for curso_dict in cursos_objetivo:
    curso_nombre = curso_dict["CURSO"]
    secciones = []
    try:
        for secc in df[df["CURSO"] == curso_nombre]["SECC"].unique():
                grupo = df_grouped.get_group((curso, secc))
                secciones.append(grupo)
            cursos_data[curso] = secciones
        except KeyError:
            return jsonify({"error": f"Curso '{curso}' no encontrado"}), 404

    # Generar todas las combinaciones posibles
    combinaciones = list(product(*cursos_data.values()))

    # Filtrar combinaciones válidas
    combinaciones_validas = []
    for combinacion in combinaciones:
        horarios = pd.concat(combinacion)
        if cruces_validos(horarios):
            horarios_dict = horarios[["CURSO", "SECC", "TIPO", "DIA", "H_INI", "H_FIN", "SALON"]].to_dict(orient="records")
            combinaciones_validas.append(horarios_dict)

    return jsonify({"cantidad": len(combinaciones_validas), "horarios": combinaciones_validas})

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/api/cursos")
def api_cursos():
    try:
        cursos = df.drop_duplicates(subset=['CURSO'])[['COD', 'CURSO', 'CICLO']]
        cursos_list = cursos.to_dict(orient='records')
        return jsonify(cursos_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/procesar_2", methods=["POST"])
def procesar_2():
    data = request.get_json()
    cursos = data.get("cursos", [])

    if not cursos:
        return jsonify({"status": "error", "message": "No se recibieron cursos."}), 400

    # Aquí debes generar la imagen del horario
    # Como ejemplo, simplemente devolvemos una imagen en blanco
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots()
    ax.text(0.5, 0.5, "\n".join(cursos), fontsize=12, ha="center")
    ax.axis('off')

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    buf.close()

    return jsonify({"status": "success", "image": img_base64})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
