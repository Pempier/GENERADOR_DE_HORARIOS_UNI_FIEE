import os
from flask import Flask, jsonify, send_file
import pandas as pd

app = Flask(__name__)

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/api/cursos")
def api_cursos():
    df = pd.read_excel("HORARIOS.xlsx", skiprows=2)
    df.columns = ['ESP', 'COD', 'SECC', 'CURSO', 'DOCENTE', 'TIPO', 'CICLO', 'DIA', 'H_INI', 'H_FIN', 'SALON']
    df = df[df['CURSO'].notna()]
    cursos = df.drop_duplicates(subset=['CURSO'])['CURSO'].tolist()
    return jsonify(cursos)

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
