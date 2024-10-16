import psycopg2
import glob
import pandas as pd
import os
from dotenv import load_dotenv


load_dotenv()


def process_chromosome_data(cur, file_path):
    """Process and insert chromosome data from the specified file."""
    with open(file_path, "r") as f:
        data_to_insert = []
        query = "INSERT INTO chromosome (chrID, length) VALUES (%s, %s);"
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
        INSERT INTO non_random_HiC (chrID, i1, ji, fq, pval, fdr, bon, ibp, jbp, rawc)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        data_to_insert = df[["chrID", "i1", "ji", "fq", "pval", "fdr", "bon", "ibp", "jbp", "rawc"]].values.tolist()

        psycopg2.extras.execute_batch(cur, query, data_to_insert)


def insert_data():
    """Insert data into the database."""
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USERNAME"),
        password=os.getenv("DB_PASSWORD"),
    )
    cur = conn.cursor()

    base_directory = os.getenv("DATA_DIR")

    # Insert chromosome list data
    file_path = os.path.join(base_directory, "chromosome_sizes.txt")
    process_chromosome_data(cur, file_path)

    # Insert non random Hi-C data
    chromosome_dir = os.path.join(base_directory, "chromosomes")
    for folder_name in os.listdir(chromosome_dir):
        folder_path = os.path.join(chromosome_dir, folder_name)
        if os.path.isdir(folder_path):
            chromosome_name = folder_name.split(".")[0]
            process_non_random_hic_data(cur, folder_path, chromosome_name)

    # Commit the transaction and close the connection
    conn.commit()
    cur.close()
    conn.close()


insert_data()
