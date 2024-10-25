#!/bin/sh

##parameters
chrlensfile="../Data/chromosome_sizes.txt"
res=5000
threads=1
EXE_PATH="../sBIF/bin/sBIF"
FLAG_FILE="/chromosome/backend/.position_inserted"

# Check if the position table has already been inserted
if [ -f "$FLAG_FILE" ]; then
    echo "Position table already inserted, skipping entrypoint script."
    exit 0
fi


for interfile in ../Data/folding_input/*.txt; do
    filename=$(basename "$interfile")

    chrom=$(echo "$filename" | cut -d'.' -f1)
    job_prefix="$chrom"

    start=$(echo "$filename" | cut -d'.' -f2)
    end=$(echo "$filename" | cut -d'.' -f3 | sed 's/.txt//')

    ##command
    cmd="$EXE_PATH -i $interfile -c $chrom -l $chrlensfile -s $start -e $end -r $res -j $job_prefix -p $threads"
    
    echo "Running command: $cmd"
    
    $cmd 
done

# Mark the position table as inserted
touch "$FLAG_FILE"
echo "Position table insert complete. Flag file created at $FLAG_FILE."

echo "Done."