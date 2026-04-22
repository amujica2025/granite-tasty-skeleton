# Git Workflow Cheatsheet

## Main Repo
C:\Users\alexm\granite_tasty_skeleton

## Before work
git status
git log --oneline -n 5

## Create branch
git checkout -b watchlist-dev
git checkout -b scanner-dev
git checkout -b artifact-dev
git checkout -b journal-dev
git checkout -b alerts-dev

## After a stable step
git add .
git commit -m ""watchlist pass 1""
git push -u origin watchlist-dev

## Merge later
git checkout main
git merge watchlist-dev
git push

## Frontend build
cd frontend
npm run build

## Backend run
cd backend
.\venv\Scripts\python main.py

## App URL
http://localhost:8000/app
