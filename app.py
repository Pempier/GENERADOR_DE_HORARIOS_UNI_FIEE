from flask import Flask, jsonify, send_file
import pandas as pd

app = Flask(__name__)

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/api/cursos")
def get_cursos():
    df = pd.read_excel("HORARIOS.xlsx", skiprows=2)
    df.columns = ['ESP', 'COD', 'SECC', 'CURSO', 'DOCENTE', 'TIPO', 'CICLO', 'DIA', 'H_INI', 'H_FIN', 'SALON']
    df = df[df['CURSO'].notna()]
    cursos_unicos = df.drop_duplicates(subset=['CURSO'])['CURSO'].tolist()
    return jsonify(cursos_unicos)

if __name__ == "__main__":
    app.run(debug=True)
