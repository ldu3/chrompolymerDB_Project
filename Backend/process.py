import pandas as pd
import os
import re


"""
Returns the list of chromosomes in the given data path
"""
def chromosomes_list(data_path):
    chromosomes = set()

    # Iterate through the folders in the given path
    for folder_name in os.listdir(data_path):
        full_path = os.path.join(data_path, folder_name)
        if os.path.isdir(full_path):
            # Extract the chromosome Name
            chrom_part = folder_name.split('.')[0]
            chromosomes.add(chrom_part)

    # Sort chromosomes, placing numeric ones first, followed by 'X'
    def chromosome_sort_key(chrom):
        try:
            # Numeric chromosomes sorted by their value
            return (int(chrom[3:]), '')  
        except ValueError:
            # Non-numeric ones like 'X' are placed last
            return (float('inf'), chrom)  

    sorted_chromosomes = sorted(chromosomes, key=chromosome_sort_key)

    # Convert to the desired object array format
    object_array = [{'value': chrom, 'label': chrom} for chrom in sorted_chromosomes]

    return object_array


"""
Returns the list of chromosome sequences in the given data path
"""
def chromosome_sequences(data_path, chromosome_name):
    result = []
    pattern = re.compile(rf'({chromosome_name})\.(?P<start>\d+)\.(?P<end>\d+)')
    
    # List all folders in the directory
    for folder in os.listdir(data_path):
        match = pattern.match(folder)
        if match:
            result.append({
                'start': match.group('start'),
                'end': match.group('end')
            })
    
    return result