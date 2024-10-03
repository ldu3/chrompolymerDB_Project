import pandas as pd
import os
import re
import glob


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


"""
Returns the concated dataframe of the chromosome data in the given chromosome name and sequence start and end
"""
def matched_chromosome_data(data_dir, chromosome_name, chromosomeSequence):
    start = chromosomeSequence['start']
    end = chromosomeSequence['end']

    file_pattern = f"{data_dir}/{chromosome_name}.*.*"
    matching_files = glob.glob(file_pattern)

    selected_files = []
    for file in matching_files:
        dir_name = os.path.basename(file)
        dir_parts = dir_name.split(".")

        if len(dir_parts) == 3:
            try:
                file_start = int(dir_parts[1])
                file_end = int(dir_parts[2])
            except ValueError:
                print(f"Skipping file due to invalid format: {file}")
                continue

            # Check if the file is within the provided range
            if file_start >= start and file_end <= end:
                folder_path = os.path.join(file, 'hic.clean.1', 'hic.clean.csv.gz')
                selected_files.append(folder_path)
        else:
            print(f"Skipping file due to insufficient parts: {file}")

    data_frames = [pd.read_csv(file) for file in selected_files]
    
    if data_frames:
        chromosome_data_df = pd.concat(data_frames, ignore_index=True)
    else:
        chromosome_data_df = pd.DataFrame()
    
    return chromosome_data_df