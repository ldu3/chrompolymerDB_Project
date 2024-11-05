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
Returns the list of cell line in the given data path
"""
def cell_lines_list():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT cell_line
        FROM seqs
    """)
    cell_lines = [row[0] for row in cur.fetchall()]
    conn.close()
    return cell_lines


"""
Returns the list of chromosomes in the cell line
"""
def chromosomes_list(cell_line):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT chrID
        FROM seqs
        WHERE cell_line = %s
    """, (cell_line,))
    
    chromosomes = [row[0] for row in cur.fetchall()]

    def sort_key(chromosome):
        match = re.match(r"chr(\d+|\D+)", chromosome)
        if match:
            value = match.group(1)
            return (int(value) if value.isdigit() else float('inf'), value)
        return (float('inf'), '')

    sorted_chromosomes_list = sorted(chromosomes, key=sort_key)
    sorted_chromosomes_list = [{"value": chrom, "label": chrom} for chrom in sorted_chromosomes_list]
    
    conn.close()
    return sorted_chromosomes_list


"""
Returns the all sequences of the chromosome data in the given cell line, chromosome name
"""
def chromosome_sequences(cell_line, chromosome_name):
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT start_value, end_value
        FROM seqs
        WHERE cell_line = %s
        AND chrID = %s
        ORDER BY start_value
    """, (cell_line, chromosome_name))
    
    ranges = [{"start": row[0], "end": row[1]} for row in cur.fetchall()]
    
    conn.close()
    return ranges

"""
Returns the existing chromosome data in the given cell line, chromosome name, start, end
"""
def chromosome_data(cell_line, chromosome_name, sequences):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM non_random_hic
        WHERE chrID = %s
        AND cell_line = %s
        AND ibp >= %s
        AND ibp <= %s
        ORDER BY start_value
    """, (chromosome_name, cell_line, sequences.start, sequences.end))
    chromosome_sequence = cur.fetchall()
    conn.close()

    return chromosome_sequence
