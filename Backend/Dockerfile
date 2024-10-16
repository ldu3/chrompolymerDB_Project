FROM python:3.10.14

WORKDIR /chromosome/backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["sh", "-c", "python init_db.py && python insert_db.py & python app.py"]
