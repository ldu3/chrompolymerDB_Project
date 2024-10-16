from flask import Flask, jsonify, request, render_template
from process import ( chromosomes_list, chromosome_sequences, matched_chromosome_data )
import os
import psycopg2

app = Flask(__name__)

# data root path
data_path = '../data'

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
    return jsonify(matched_chromosome_data(data_path, chromosome_name, chromosomeSequence).to_dict(orient='records'))

if __name__ == "__main__":
    app.run(debug=True)
