#!/bin/bash
cd /home/runner/work/mvp/mvp/prisma/migrations 
ls -d */  > errors.txt
cat errors.txt
for i in {1..5}
do
         migration[$i]=$(sed "$i!d ; s/.\$//" errors.txt)
done
cd /home/runner/work/mvp/mvp

for i in {1..5}
do
          npx prisma migrate resolve --rolled-back ${migration[$i]} || true
done
