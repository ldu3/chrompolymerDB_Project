#!/bin/sh

##parameters
chrlensfile="../Example_Data/chromosome_sizes.txt"
res=5000
threads=50
EXE_PATH="../sBIF/bin/sBIF"
n_samples=$1
n_runs=$2
is_download=$3
# FLAG_FILE="/chromosome/backend/flags/.position_inserted"

count=1

# Check if the position table has already been inserted
# if [ -f "$FLAG_FILE" ]; then
#     echo "Position table already inserted, skipping entrypoint script."
#     exit 0
# fi


for interfile in ../Example_Data/Folding_input/*.txt; do
    filename=$(basename "$interfile")

    chrom=$(echo "$filename" | cut -d'.' -f1)
    job_prefix="$chrom"

    start=$(echo "$filename" | cut -d'.' -f2)
    end=$(echo "$filename" | cut -d'.' -f3 | sed 's/.txt//')

    ##command
    cmd="$EXE_PATH -i $interfile -c $chrom -l $chrlensfile -s $start -e $end -r $res -do $is_download -j $job_prefix -p $threads"
    
    echo "Processing file $count of $total_files: $filename"
    echo "Running command: $cmd"
    
    $cmd
    count=$((count + 1))  
done


# Mark the position table as inserted
# touch "$FLAG_FILE"
# echo "Position table insert complete. Flag file created at $FLAG_FILE."

echo "Done."