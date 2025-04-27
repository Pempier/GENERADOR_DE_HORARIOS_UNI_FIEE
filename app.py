import os
from flask import Flask, jsonify, send_file
import pandas as pd

app = Flask(__name__)

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/api/cursos")
def api_cursos():
    try:
        df = pd.read_excel("HORARIOS.xlsx", skiprows=2)
        df.columns = ['ESP', 'COD', 'SECC', 'CURSO', 'DOCENTE', 'TIPO', 'CICLO', 'DIA', 'H_INI', 'H_FIN', 'SALON']
        df = df[df['CURSO'].notna()]

        # Nos quedamos con un curso por nombre (sin repetir), y guardamos también el COD y CICLO
        cursos = df.drop_duplicates(subset=['CURSO'])[['COD', 'CURSO', 'CICLO']]
        
        cursos_list = cursos.to_dict(orient='records')  # Lista de diccionarios
        return jsonify(cursos_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/procesar", methods=["POST"])
def procesar():
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
