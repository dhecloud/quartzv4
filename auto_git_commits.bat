cd C:\Users\andre\Documents\quartz
git add --all
git diff-index --quiet HEAD || git commit -m "scheduled commit"
git pull
git push