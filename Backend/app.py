from flask import Flask, jsonify, request, render_template
from process import cell_lines_list, chromosomes_list, chromosome_sequences, chromosome_data
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return 'Hello, World!'


@app.route('/getCellLines', methods=['GET'])
def get_CellLines():
    return jsonify(cell_lines_list())

@app.route('/getChromosList', methods=['POST'])
def get_ChromosList():
    cell_line = request.json['cell_line']
    return jsonify(chromosomes_list(cell_line))


@app.route('/getChromosData', methods=['POST'])
def get_ChromosSequences():
    cell_line = request.json['cell_line']
    chromosome_name = request.json['chromosome_name']
    return jsonify(chromosome_sequences(cell_line, chromosome_name).to_dict(orient='records'))

@app.route('/getChromosSequence', methods=['POST'])
def get_ChromosData():
    cell_line = request.json['cell_line']
    chromosome_name = request.json['chromosome_name']
    sequences = request.json['sequences']
    return jsonify(chromosome_data(cell_line, chromosome_name, sequences))


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
