# Fantasy Football Analyzer

A web application for analyzing Fantasy Premier League (FPL) data and providing recommendations for transfers, substitutes, and captaincy.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
uvicorn main:app --reload
```

## API Endpoints

- GET `/players`: Fetch all FPL players
- GET `/player/{player_id}`: Get detailed information for a specific player
- GET `/league/{league_id}`: Get league standings
- GET `/team/{manager_id}`: Get a manager's team (optional query parameter: gameweek)

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
