import os
import psycopg2
from dotenv import load_dotenv


load_dotenv()


conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USERNAME"),
    password=os.getenv("DB_PASSWORD"),
)

# Open a cursor to perform database operations
cur = conn.cursor()

# Drop table if it exists
cur.execute("DROP TABLE IF EXISTS 3Dposition, folding_input, non_random_HiC, chormosome;")

# create a new chormosome table
cur.execute(
    "CREATE TABLE chormosome ("
    "chrID varchar(50) PRIMARY KEY,"
    "size INT NOT NULL DEFAULT 0,"
    ");"
)

# create a new non_random_HiC table
cur.execute(
    "CREATE TABLE non_random_HiC ("
    "hID serial PRIMARY KEY,"
    "chrID VARCHAR(50) NOT NULL,"
    "i1 INT NOT NULL DEFAULT 0,"
    "ji INT NOT NULL DEFAULT 0,"
    "fq FLOAT NOT NULL DEFAULT 0.0,,"
    "pval FLOAT NOT NULL DEFAULT 0.0,,"
    "fdr FLOAT NOT NULL DEFAULT 0.0,,"
    "bon FLOAT NOT NULL DEFAULT 0.0,"
    "ibp BIGINT NOT NULL DEFAULT 0,"
    "jbp BIGINT NOT NULL DEFAULT 0,"
    "rawc FLOAT NOT NULL DEFAULT 0.0,"
    "CONSTRAINT fk_non_random_HiC_chrID FOREIGN KEY (chrID) REFERENCES chormosome(chrID) ON DELETE CASCADE ON UPDATE CASCADE"
    ");"
)


# create a new folding_input table
cur.execute(
    "CREATE TABLE folding_input ("
    "fID serial PRIMARY KEY,"
    "chrID VARCHAR(50) NOT NULL,"
    "weight SMALLINT NOT NULL DEFAULT 0,"
    "CONSTRAINT fk_folding_input_chrID FOREIGN KEY (chrID) REFERENCES chormosome(chrID) ON DELETE CASCADE ON UPDATE CASCADE"
    ");"
)

# create a new 3Dposition table
cur.execute(
    "CREATE TABLE 3Dposition ("
    "pID serial PRIMARY KEY,"
    "hID SMALLINT NOT NULL,"
    "X FLOAT NOT NULL DEFAULT 0.0,"
    "Y FLOAT NOT NULL DEFAULT 0.0,,"
    "Z FLOAT NOT NULL DEFAULT 0.0,,"
    "CONSTRAINT fk_3Dposition_hID FOREIGN KEY (hID) REFERENCES non_random_HiC(hID) ON DELETE CASCADE ON UPDATE CASCADE"
    ");"
)


conn.commit()

cur.close()
conn.close()

