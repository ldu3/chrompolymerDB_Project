from flask import Flask, jsonify, request
from process import ( chromosomes_list, chromosome_sequences, chromosome_data )

data_path = '../data'
app = Flask(__name__)


@app.route('/getChromosList', methods=['GET'])
def get_ChromosList():
    return jsonify(chromosomes_list(data_path))

@app.route('/getChromosSeq', methods=['POST'])
def get_ChromosSeq():
    chromosome_name = request.json['chromosome_name']
    return jsonify(chromosome_sequences(data_path, chromosome_name))

@app.route('/getChromosData', methods=['POST'])
def get_ChromosData():
    chromosome_name = request.json['chromosome_name']
    chromosomeSequence = request.json['chromosomeSequence']
    return jsonify(chromosome_data(chromosome_name, chromosomeSequence).to_dict(orient='records'))

if __name__ == "__main__":
    app.run(debug=True)
