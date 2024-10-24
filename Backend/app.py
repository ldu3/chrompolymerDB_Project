from flask import Flask, jsonify, request, render_template
from process import chromosomes_list
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return 'Hello, World!'


@app.route('/getChromosList', methods=['GET'])
def get_ChromosList():
    return jsonify(chromosomes_list())


# @app.route('/getChromosData', methods=['POST'])
# def get_ChromosData():
#     chromosome_name = request.json['chromosome_name']
#     chromosomeSequence = request.json['chromosomeSequence']
#     return jsonify(matched_chromosome_data(data_path, chromosome_name, chromosomeSequence).to_dict(orient='records'))

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
