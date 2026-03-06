#!/bin/bash
pip install --upgrade pip
pip install -r requirements.txt
gunicorn main:app --bind 0.0.0.0:8000 --workers 2 --worker-class uvicorn.workers.UvicornWorker --timeout 600
