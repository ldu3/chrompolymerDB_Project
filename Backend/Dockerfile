FROM python:3.13.0-bookworm

WORKDIR /chromosome/backend

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 5000
CMD ["sh", "-c", "python init_db.py && python app.py"]