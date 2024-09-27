from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route("/members")
def members():
    members = [{"name": "John Doe"}]
    return jsonify(members)


if __name__ == "__main__":
    app.run(debug=True)
