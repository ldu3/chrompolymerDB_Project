#!/bin/bash

##parameters
interfile="../folding_input/chr1.27120000.27895000.txt"
chrlensfile="./chromosome_sizes.txt"
chrom="chr1"
start=27120000
end=27895000
outfolder="../output"
res=5000
job_prefix="chr1"
threads=20
EXE_PATH="../../sBIF/bin/sBIF"

##command
cmd="$EXE_PATH -i $interfile -c $chrom -l $chrlensfile -s $start -e $end -o $outfolder -r $res -j $job_prefix -p $threads "
echo $cmd
$cmd 
echo "Done."