FROM python:3.13.0-bookworm

WORKDIR /chromosome/backend

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Install git
RUN apt-get update && apt-get install -y git cmake
WORKDIR /chromosome
RUN git clone https://github.com/ScheWann/sBIF.git

# Build sBIF
WORKDIR /chromosome/sBIF
ENV CXX=g++
RUN mkdir output
RUN cmake . && make

WORKDIR /chromosome/backend

COPY . .

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 5000
CMD ["sh", "-c", "python init_db.py && /usr/local/bin/entrypoint.sh && python app.py"]