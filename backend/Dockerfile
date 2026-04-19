FROM python:3.12-slim AS base

# opencv-python-headless still needs libgl + glib at runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
      libgl1 \
      libglib2.0-0 \
      ca-certificates \
      curl \
  && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY app ./app
COPY scraper ./scraper
COPY main.py ./main.py

EXPOSE 8000

# 1 worker is the right call for a 1 vCPU box — requests are I/O bound on
# Dedalus / Higgsfield anyway. Keep-alive bumped to 120s so long image gens
# don't get killed by the proxy.
CMD ["gunicorn", "main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-w", "1", \
     "-b", "0.0.0.0:8000", \
     "--timeout", "180", \
     "--keep-alive", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
