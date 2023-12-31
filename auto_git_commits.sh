cd /Users/andrew/Documents/quartzv4
git add --all
git diff-index --quiet HEAD || git commit -m "scheduled commit"
git pull
git push