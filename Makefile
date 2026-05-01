.PHONY: install backend frontend dev build test clean

PYTHON := /opt/homebrew/bin/python3.12
VENV   := backend/.venv

install:
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/pip install -r backend/requirements.txt -q
	cd frontend && npm install

backend:
	cd backend && .venv/bin/uvicorn main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting backend and frontend..."
	@cd backend && .venv/bin/uvicorn main:app --reload --port 8000 & \
	 cd frontend && npm run dev

build:
	cd frontend && npm run build

test:
	cd backend && .venv/bin/python -m pytest tests/ -v

clean:
	rm -rf backend/.venv frontend/node_modules frontend/dist backend/strategy_lab.db
