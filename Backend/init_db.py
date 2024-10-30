import os
import re
from psycopg2 import sql
import psycopg2.extras
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")


def get_db_connection(database=None):
    """Create a connection to the database."""
    return psycopg2.connect(
        host=DB_HOST, user=DB_USERNAME, password=DB_PASSWORD, database=database
    )


def table_exists(cur, table_name):
    """Check if a table exists in the database."""
    cur.execute(
        sql.SQL(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = %s);"
        ),
        [table_name],
    )
    return cur.fetchone()[0]


def data_exists(cur, table_name):
    """Check if a table has data."""
    cur.execute(
        sql.SQL("SELECT EXISTS (SELECT 1 FROM {} LIMIT 1);").format(
            sql.Identifier(table_name)
        )
    )
    return cur.fetchone()[0]


def initialize_tables():
    """Create tables."""
    
    # Connect to the newly created database to create tables
    conn = get_db_connection(database=DB_NAME)
    cur = conn.cursor()

    # Check if tables already exist
    if not table_exists(cur, "chromosome"):
        print("Creating chromosome table...")
        cur.execute(
            "CREATE TABLE IF NOT EXISTS chromosome ("
            "chrID varchar(50) PRIMARY KEY,"
            "size INT NOT NULL DEFAULT 0"
            ");"
        )
        conn.commit()
        print("chromosome table created successfully.")
    else:
        print("chromosome table already exists, skipping creation.")
        return

    if not table_exists(cur, "gene"):
        print("Creating gene table...")
        cur.execute(
            "CREATE TABLE IF NOT EXISTS gene ("
            "gID serial PRIMARY KEY,"
            "gene_id BIGINT NOT NULL,"
            "chromosome VARCHAR(50) NOT NULL,"
            "start_location BIGINT NOT NULL DEFAULT 0,"
            "end_location BIGINT NOT NULL DEFAULT 0,"
            "gene_name VARCHAR(255) NOT NULL,"
            "symbol VARCHAR(30) NOT NULL"
            ");"
        )
        conn.commit()
        print("gene table created successfully.")
    else:
        print("gene table already exists, skipping creation.")
        return

    if not table_exists(cur, "non_random_hic"):
        print("Creating non_random_hic table...")
        cur.execute(
            "CREATE TABLE IF NOT EXISTS non_random_hic ("
            "hID serial PRIMARY KEY,"
            "chrID VARCHAR(50) NOT NULL,"
            "i1 INT NOT NULL DEFAULT 0,"
            "j1 INT NOT NULL DEFAULT 0,"
            "fq FLOAT NOT NULL DEFAULT 0.0,"
            "pval FLOAT NOT NULL DEFAULT 0.0,"
            "fdr FLOAT NOT NULL DEFAULT 0.0,"
            "bon FLOAT NOT NULL DEFAULT 0.0,"
            "ibp BIGINT NOT NULL DEFAULT 0,"
            "jbp BIGINT NOT NULL DEFAULT 0,"
            "rawc FLOAT NOT NULL DEFAULT 0.0,"
            "start_value BIGINT NOT NULL DEFAULT 0,"
            "end_value BIGINT NOT NULL DEFAULT 0,"
            "CONSTRAINT fk_non_random_hic_chrID FOREIGN KEY (chrID) REFERENCES chromosome(chrID) ON DELETE CASCADE ON UPDATE CASCADE"
            ");"
        )
        conn.commit()
        print("non_random_hic table created successfully.")
    else:
        print("non_random_hic table already exists, skipping creation.")
        return

    if not table_exists(cur, "position"):
        print("Creating position table...")
        cur.execute(
            "CREATE TABLE IF NOT EXISTS position ("
            "pID serial PRIMARY KEY,"
            "chrID VARCHAR(50) NOT NULL,"
            "sampleID INT NOT NULL DEFAULT 0,"
            "start_value BIGINT NOT NULL DEFAULT 0,"
            "end_value BIGINT NOT NULL DEFAULT 0,"
            "X FLOAT NOT NULL DEFAULT 0.0,"
            "Y FLOAT NOT NULL DEFAULT 0.0,"
            "Z FLOAT NOT NULL DEFAULT 0.0"
            ");"
        )
        conn.commit()
        print("position table created successfully.")
    else:
        print("position table already exists, skipping creation.")

    # Close connection
    cur.close()
    conn.close()
    return


def process_chromosome_data(cur, file_path):
    """Process and insert chromosome data from the specified file."""
    with open(file_path, "r") as f:
        data_to_insert = []
        query = "INSERT INTO chromosome (chrID, size) VALUES (%s, %s);"
        for line in f:
            # Split each line by tab and strip extra spaces/newlines
            data = line.strip().split("\t")
            data_to_insert.append((data[0], int(data[1])))

        psycopg2.extras.execute_batch(cur, query, data_to_insert)


def process_gene_data(cur, file_path):
    """Process and insert gene data from the specified file."""
    gene_df = pd.read_csv(file_path, sep="\t")
    gene_df = gene_df[["Gene ID", "Name", "Symbol", "Chromosome", "Begin", "End"]]

    query = """
    INSERT INTO gene (gene_id, chromosome, start_location, end_location, gene_name, symbol)
    VALUES (%s, %s, %s, %s, %s, %s);
    """
    data_to_insert = gene_df[["Gene ID", "Chromosome", "Begin", "End", "Name", "Symbol"]].values.tolist()

    psycopg2.extras.execute_batch(cur, query, data_to_insert)


def process_non_random_hic_data(cur, folder_path, start_value, end_value, chromosome_name):
    """Process and insert Hi-C data from the specified folder."""        
    csv_path = os.path.join(folder_path, "hic.clean.1/hic.clean.csv.gz")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path, compression="gzip")
        df["chrID"] = chromosome_name
        df["start_value"] = start_value
        df["end_value"] = end_value

        query = """
        INSERT INTO non_random_hic (chrID, i1, j1, fq, pval, fdr, bon, ibp, jbp, rawc, start_value, end_value)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        data_to_insert = df[["chrID", "i1", "j1", "fq", "pval", "fdr", "bon", "ibp", "jbp", "rawc", "start_value", "end_value"]].values.tolist()

        psycopg2.extras.execute_batch(cur, query, data_to_insert)


def insert_data():
    """Insert data into the database if not already present."""
    conn = get_db_connection(database=DB_NAME)
    cur = conn.cursor()

    # Insert chromosome data only if the table is empty
    if not data_exists(cur, "chromosome"):
        file_path = "../Data/chromosome_sizes.txt"
        print("Inserting chromosome data...")
        process_chromosome_data(cur, file_path)
        print("Chromosome data inserted successfully.")
    else:
        print("Chromosome data already exists, skipping insertion.")

    # Insert gene data only if the table is empty
    if not data_exists(cur, "gene"):
        file_path = "../Data/ncbi_dataset.tsv"
        print("Inserting gene data...")
        process_gene_data(cur, file_path)
        print("Gene data inserted successfully.")
    else:
        print("Gene data already exists, skipping insertion.")

    # Insert non-random Hi-C data only if the table is empty
    if not data_exists(cur, "non_random_hic"):
        chromosome_dir = "../Data/chromosomes"
        for folder_name in os.listdir(chromosome_dir):
            folder_path = os.path.join(chromosome_dir, folder_name)
            if os.path.isdir(folder_path):
                chromosome_name = folder_name.split(".")[0]
                start_value = folder_name.split(".")[1]
                end_value = folder_name.split(".")[2]
                print(f"Inserting non-random Hi-C data for chromosome {folder_name}...")
                process_non_random_hic_data(cur, folder_path, start_value, end_value, chromosome_name)
                print(
                    f"Non-random Hi-C data for chromosome {folder_name} inserted successfully."
                )
    else:
        print("Non-random Hi-C data already exists, skipping insertion.")

    # Commit and close connection
    conn.commit()
    cur.close()
    conn.close()
    return


initialize_tables()
insert_data()