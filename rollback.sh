#!/bin/bash
cd /home/runner/work/mvp/mvp/prisma/migrations 
ls -d */  > errors.txt
cat errors.txt
file=$(cat errors.txt)
cd /home/runner/work/mvp/mvp
for line in $file
do
         modified_line=${line::-1}
        # migration[$i]=modified_line
         npx prisma migrate resolve --rolled-back $modified_line || true
done
