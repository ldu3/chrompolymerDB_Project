import pandas as pd
import psycopg2
import os
import re
import glob
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")


def get_db_connection():
    """Establish a connection to the database."""
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USERNAME,
        password=DB_PASSWORD,
        cursor_factory=RealDictCursor,
    )
    return conn


"""
Returns the list of chromosomes in the given data path
"""
def chromosomes_list():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT chrid
        FROM non_random_hic
    """)
    chromosomes = cur.fetchall()
    
    def sort_key(chromosome):
        match = re.match(r"chr(\d+|\D+)", chromosome['chrid'])
        if match:
            value = match.group(1)
            return (int(value) if value.isdigit() else float('inf'), value)
        return (float('inf'), '')
    
    # Sort the chromosomes by the numeric or character suffix
    sorted_chromosomes_list = sorted(chromosomes, key=sort_key)
    sorted_chromosomes_list = [{"value": chrom['chrid'], "label": chrom['chrid']} for chrom in sorted_chromosomes_list]
    
    conn.close()
    return sorted_chromosomes_list


"""
Returns the concated dataframe of the chromosome data in the given chromosome name and sequence start and end
"""


# def matched_chromosome_data(data_dir, chromosome_name, chromosomeSequence):
#     start = chromosomeSequence["start"]
#     end = chromosomeSequence["end"]

#     file_pattern = f"{data_dir}/{chromosome_name}.*.*"
#     matching_files = glob.glob(file_pattern)

#     selected_files = []
#     for file in matching_files:
#         dir_name = os.path.basename(file)
#         dir_parts = dir_name.split(".")

#         if len(dir_parts) == 3:
#             try:
#                 file_start = int(dir_parts[1])
#                 file_end = int(dir_parts[2])
#             except ValueError:
#                 print(f"Skipping file due to invalid format: {file}")
#                 continue

#             # Check if the file is within the provided range
#             if file_start >= start and file_end <= end:
#                 folder_path = os.path.join(file, "hic.clean.1", "hic.clean.csv.gz")
#                 selected_files.append(folder_path)
#         else:
#             print(f"Skipping file due to insufficient parts: {file}")

#     data_frames = [pd.read_csv(file) for file in selected_files]

#     if data_frames:
#         chromosome_data_df = pd.concat(data_frames, ignore_index=True)
#     else:
#         chromosome_data_df = pd.DataFrame()

#     return chromosome_data_df