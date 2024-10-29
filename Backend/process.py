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
def matched_chromosome_data(chromosome_name, chromosomeSequence):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT *
        FROM non_random_hic
        WHERE chrID = %s
        AND ibp >= %s
        AND ibp <= %s
        AND jbp >= %s
        AND jbp <= %s
    """, (chromosome_name, chromosomeSequence["start"], chromosomeSequence["end"], chromosomeSequence["start"], chromosomeSequence["end"]))
    chromosome_data = cur.fetchall()
    conn.close()
    return pd.DataFrame(chromosome_data)

"""
Returns the existing chromosome sequence data in the given chromosome name
"""
def chromosome_sequence(chromosome_name):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT MIN(start_value) as min_start, MAX(end_value) as max_end
        FROM non_random_hic
        WHERE chrID = %s
        GROUP BY start_value, end_value
    """, (chromosome_name,))
    chromosome_sequence = cur.fetchall()
    conn.close()

    print(chromosome_sequence)
    min_start = min(row['min_start'] for row in chromosome_sequence)
    max_end = max(row['max_end'] for row in chromosome_sequence)
    
    
    chromosome_sequence_result = {
        "seqs": chromosome_sequence,
        "min_start": min_start,
        "max_end": max_end
    }
    return chromosome_sequence_result