#!/bin/bash
cd /home/runner/work/mvp/mvp/prisma/migrations 
ls -d */  > errors.txt
for i in {1..5}
do
         $i=$(sed '1!d ; s/.$//' errors.txt)
done
cd /home/runner/work/mvp/mvp
for i in {1..5}
do
          npx prisma migrate resolve --rolled-back $.$i || true
done
