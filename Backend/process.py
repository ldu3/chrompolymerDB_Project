import pandas as pd
import psycopg2
import os
import re
import tempfile
import subprocess
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")


"""
Establish a connection to the database.
"""
def get_db_connection():
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
    cur.execute(
        """
        SELECT DISTINCT cell_line
        FROM sequence
    """
    )
    rows = cur.fetchall()

    label_mapping = {
        'IMR': 'Lung',
        'K': 'Blood Leukemia',
        'GM': 'Lymphoblastoid Cell Line'
    }
    options = [
        {
            'value': row['cell_line'],
            'label': label_mapping.get(row['cell_line'], 'Unknown')
        }
        for row in rows
    ]

    conn.close()
    return options


"""
Returns the list of chromosomes in the cell line
"""
def chromosomes_list(cell_line):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT DISTINCT chrID
        FROM sequence
        WHERE cell_line = %s
    """,
        (cell_line,),
    )

    chromosomes = [row["chrid"] for row in cur.fetchall()]

    def sort_key(chromosome):
        match = re.match(r"chr(\d+|\D+)", chromosome)
        if match:
            value = match.group(1)
            return (int(value) if value.isdigit() else float("inf"), value)
        return (float("inf"), "")

    sorted_chromosomes_list = sorted(chromosomes, key=sort_key)
    sorted_chromosomes_list = [
        {"value": chrom, "label": chrom} for chrom in sorted_chromosomes_list
    ]

    conn.close()
    return sorted_chromosomes_list


"""
Returns the all sequences of the chromosome data in the given cell line, chromosome name
"""
def chromosome_sequences(cell_line, chromosome_name):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT start_value, end_value
        FROM sequence
        WHERE cell_line = %s
        AND chrID = %s
        ORDER BY start_value
    """,
        (cell_line, chromosome_name),
    )

    ranges = [{"start": row["start_value"], "end": row["end_value"]} for row in cur.fetchall()]

    conn.close()
    return ranges


"""
Returns the existing chromosome data in the given cell line, chromosome name, start, end
"""
def chromosome_data(cell_line, chromosome_name, sequences):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT cell_line, chrid, fdr, ibp, jbp, fq
        FROM non_random_hic
        WHERE chrID = %s
        AND cell_line = %s
        AND ibp >= %s
        AND ibp <= %s
        AND jbp >= %s
        AND jbp <= %s
        ORDER BY ibp
    """,
        (chromosome_name, cell_line, sequences['start'], sequences["end"]),
    )
    chromosome_sequence = cur.fetchall()
    conn.close()

    return chromosome_sequence


"""
Returns the example(3) 3D chromosome data in the given cell line, chromosome name, start, end
"""
def example_chromosome_3d_data(cell_line, chromosome_name, sequences):
    conn = get_db_connection()
    cur = conn.cursor()

    def get_spe_inter(hic_data, alpha=0.05):
        """Filter Hi-C data for significant interactions based on the alpha threshold."""
        hic_spe = hic_data.loc[hic_data["fdr"] < alpha]
        return hic_spe

    def get_fold_inputs(spe_df):
        """Prepare folding input file from the filtered significant interactions."""
        spe_out_df = spe_df[["ibp", "jbp", "fq", "chr", "fdr"]]
        spe_out_df["w"] = 1
        result = spe_out_df[["cell_line", "chr", "ibp", "jbp", "fq", "w"]]
        return result

    cur.execute(
        """
        SELECT *
        FROM non_random_hic
        WHERE chrID = %s
        AND cell_line = %s
        AND ibp >= %s
        AND ibp <= %s
        ORDER BY start_value
    """,
        (chromosome_name, cell_line, sequences["start"], sequences["end"]),
    )
    original_data = cur.fetchall()
    conn.close()

    column_names = [desc[0] for desc in cur.description]
    original_df = pd.DataFrame(original_data, columns=column_names)

    filtered_df = get_spe_inter(original_df)
    fold_inputs = get_fold_inputs(filtered_df)

    txt_data = fold_inputs.to_csv(index=False, sep="\t")
    custom_name = (
        f"{cell_line}_{chromosome_name}_{sequences['start']}_{sequences['end']}"
    )
    with tempfile.NamedTemporaryFile(
        delete=False, mode="w", suffix=".txt"
    ) as temp_file:
        temp_file.write(txt_data)
        temp_file_path = temp_file.name
        os.rename(temp_file_path, custom_name)
        temp_file_path = custom_name

    script = "./sBIF.sh"
    n_samples = 3
    n_runs = 1
    is_download = False
    subprocess.run(
        ["bash", script, n_samples, n_runs, is_download],
        capture_output=True,
        text=True,
        check=True,
    )

    os.remove(custom_name)

    return "Success send example chromosome 3D data request"


"""
Download the full 3D chromosome data(including distances, 50000) in the given cell line, chromosome name, start, end
"""
def download_full_chromosome_3d_data(cell_line, chromosome_name, sequences):
    conn = get_db_connection()
    cur = conn.cursor()

    def get_spe_inter(hic_data, alpha=0.05):
        """Filter Hi-C data for significant interactions based on the alpha threshold."""
        hic_spe = hic_data.loc[hic_data["fdr"] < alpha]
        return hic_spe

    def get_fold_inputs(spe_df):
        """Prepare folding input file from the filtered significant interactions."""
        spe_out_df = spe_df[["ibp", "jbp", "fq", "chr", "fdr"]]
        spe_out_df["w"] = 1
        result = spe_out_df[["cell_line", "chr", "ibp", "jbp", "fq", "w"]]
        return result

    cur.execute(
        """
        SELECT *
        FROM non_random_hic
        WHERE chrID = %s
        AND cell_line = %s
        AND ibp >= %s
        AND ibp <= %s
        ORDER BY start_value
    """,
        (chromosome_name, cell_line, sequences["start"], sequences["end"]),
    )
    original_data = cur.fetchall()
    conn.close()

    column_names = [desc[0] for desc in cur.description]
    original_df = pd.DataFrame(original_data, columns=column_names)

    filtered_df = get_spe_inter(original_df)
    fold_inputs = get_fold_inputs(filtered_df)

    txt_data = fold_inputs.to_csv(index=False, sep="\t")
    custom_name = (
        f"{cell_line}_{chromosome_name}_{sequences['start']}_{sequences['end']}"
    )
    with tempfile.NamedTemporaryFile(
        delete=False, mode="w", suffix=".txt"
    ) as temp_file:
        temp_file.write(txt_data)
        temp_file_path = temp_file.name
        os.rename(temp_file_path, custom_name)
        temp_file_path = custom_name

    script = "./sBIF.sh"
    n_samples = 50000
    n_runs = 100
    is_download = True
    subprocess.run(
        ["bash", script, n_samples, n_runs, is_download],
        capture_output=True,
        text=True,
        check=True,
    )

    os.remove(custom_name)

    return "Success send download full chromosome 3D data request"
