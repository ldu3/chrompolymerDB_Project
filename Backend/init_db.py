import os
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
        host=DB_HOST,
        user=DB_USERNAME,
        password=DB_PASSWORD,
        database=database
    )


def initialize_tables():
    """Create tables."""
    
    # Connect to the newly created database to create tables
    conn = get_db_connection(database=DB_NAME)
    cur = conn.cursor()

    # Drop tables if they exist
    cur.execute("DROP TABLE IF EXISTS position, non_random_HiC, chromosome;")

    # Create the chromosome table
    print("Creating chromosome table...")
    cur.execute(
        "CREATE TABLE chromosome ("
            "chrID varchar(50) PRIMARY KEY,"
            "size INT NOT NULL DEFAULT 0"
        ");"
    )
    print("chromosome table created successfully.")

    # Create other tables...
    print("Creating non_random_HiC table...")
    cur.execute(
        "CREATE TABLE non_random_HiC ("
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
            "CONSTRAINT fk_non_random_HiC_chrID FOREIGN KEY (chrID) REFERENCES chromosome(chrID) ON DELETE CASCADE ON UPDATE CASCADE"
        ");"
    )
    print("non_random_HiC table created successfully.")

    # Create the position table
    print("Creating position table...")
    cur.execute(
        "CREATE TABLE position ("
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
    print("position table created successfully.")
    print("Tables creation completed successfully.")
    
    # Commit and close connection
    conn.commit()
    cur.close()
    conn.close()


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


def process_non_random_hic_data(cur, folder_path, chromosome_name):
    """Process and insert Hi-C data from the specified folder."""
    csv_path = os.path.join(folder_path, "hic.clean.1/hic.clean.csv.gz")
    if os.path.exists(csv_path):
        # Read the CSV file
        df = pd.read_csv(csv_path, compression="gzip")
        df["chrID"] = chromosome_name
        # Prepare for batch insert
        query = """
        INSERT INTO non_random_HiC (chrID, i1, j1, fq, pval, fdr, bon, ibp, jbp, rawc)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        data_to_insert = df[["chrID", "i1", "j1", "fq", "pval", "fdr", "bon", "ibp", "jbp", "rawc"]].values.tolist()

        psycopg2.extras.execute_batch(cur, query, data_to_insert)


def insert_data():
    """Insert data into the database."""
    conn = get_db_connection(database=DB_NAME)
    cur = conn.cursor()

    # Insert chromosome data
    file_path = "../Data/chromosome_sizes.txt"
    print("Inserting chromosome data...")
    process_chromosome_data(cur, file_path)
    print("Chromosome data inserted successfully.")

    # Insert non-random Hi-C data
    chromosome_dir = "../Data/chromosomes"
    for folder_name in os.listdir(chromosome_dir):
        folder_path = os.path.join(chromosome_dir, folder_name)
        if os.path.isdir(folder_path):
            chromosome_name = folder_name.split(".")[0]
            print_name = folder_name.split(".")
            print_name = ".".join(print_name)
            print(f"Inserting non-random Hi-C data for chromosome {print_name}...")
            process_non_random_hic_data(cur, folder_path, chromosome_name)
            print(f"Non-random Hi-C data for chromosome {print_name} inserted successfully.")

    # Commit and close connection
    conn.commit()
    cur.close()
    conn.close()


initialize_tables()
insert_data()