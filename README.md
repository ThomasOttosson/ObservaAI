# Django AI Assistant

AI-assistent byggd med Django REST Framework och React.

## Funktioner

* JWT-inloggning
* Kodanalys med AI
* Filuppladdning (.py, .txt, .zip)
* Favoriter
* Historik
* PDF-export
* Statistik och grafer

## Installation

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Miljövariabler

Skapa en `.env`-fil:

```env
OPENAI_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
DEBUG=True
```
