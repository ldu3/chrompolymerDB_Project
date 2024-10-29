from flask import Flask, jsonify, request, render_template
from process import chromosomes_list, matched_chromosome_data, chromosome_sequence
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return 'Hello, World!'


@app.route('/getChromosList', methods=['GET'])
def get_ChromosList():
    return jsonify(chromosomes_list())


@app.route('/getChromosData', methods=['POST'])
def get_ChromosData():
    chromosome_name = request.json['chromosome_name']
    chromosomeSequence = request.json['selectedChromosomeSequence']
    return jsonify(matched_chromosome_data(chromosome_name, chromosomeSequence).to_dict(orient='records'))

@app.route('/getChromosSequence', methods=['POST'])
def get_ChromosSequence():
    chromosome_name = request.json['chromosome_name']
    return jsonify(chromosome_sequence(chromosome_name))


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
