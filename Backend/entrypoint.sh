#!/bin/sh

##parameters
chrlensfile="../Data/chromosome_sizes.txt"
res=5000
threads=50
EXE_PATH="../sBIF/bin/sBIF"
FLAG_FILE="/chromosome/backend/.position_inserted"

total_files=$(find ../Data/Folding_input -name "*.txt" | wc -l | xargs)
count=1

# Check if the position table has already been inserted
if [ -f "$FLAG_FILE" ]; then
    echo "Position table already inserted, skipping entrypoint script."
    exit 0
fi


for interfile in ../Data/Folding_input/*.txt; do
    filename=$(basename "$interfile")

    chrom=$(echo "$filename" | cut -d'.' -f1)
    job_prefix="$chrom"

    start=$(echo "$filename" | cut -d'.' -f2)
    end=$(echo "$filename" | cut -d'.' -f3 | sed 's/.txt//')

    ##command
    cmd="$EXE_PATH -i $interfile -c $chrom -l $chrlensfile -s $start -e $end -r $res -j $job_prefix -p $threads"
    
    echo "Processing file $count of $total_files: $filename"
    echo "Running command: $cmd"
    
    $cmd
    count=$((count + 1))  
done


# Mark the position table as inserted
touch "$FLAG_FILE"
echo "Position table insert complete. Flag file created at $FLAG_FILE."

echo "Done."