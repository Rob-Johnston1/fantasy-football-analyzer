from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import requests
import os
from ai_analyzer import TeamAnalyzer
from typing import Dict, Any

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/", StaticFiles(directory="."), name="static")

@app.get("/api/players")
async def get_players():
    try:
        url = "https://fantasy.premierleague.com/api/bootstrap-static/"
        response = requests.get(url)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fixtures")
async def get_fixtures():
    try:
        # Get bootstrap data for teams and current gameweek
        bootstrap_url = "https://fantasy.premierleague.com/api/bootstrap-static/"
        bootstrap_response = requests.get(bootstrap_url)
        bootstrap_data = bootstrap_response.json()
        
        # Get current gameweek
        current_gameweek = next((event['id'] for event in bootstrap_data['events'] 
                               if event['is_current']), None)
        
        if not current_gameweek:
            raise HTTPException(status_code=400, detail='Could not determine current gameweek')

        # Get fixtures
        fixtures_url = "https://fantasy.premierleague.com/api/fixtures/"
        fixtures_response = requests.get(fixtures_url)
        fixtures_data = fixtures_response.json()

        # Filter and sort upcoming fixtures
        upcoming_fixtures = [f for f in fixtures_data if not f['finished'] and f['event'] is not None]
        upcoming_fixtures.sort(key=lambda x: x['event'])
        
        # Create team fixtures mapping
        team_next_fixtures = {}
        teams = {team['id']: team['name'] for team in bootstrap_data['teams']}
        
        for fixture in upcoming_fixtures:
            # Add home team's next fixture
            if fixture['team_h'] not in team_next_fixtures:
                team_next_fixtures[fixture['team_h']] = {
                    'opponent': fixture['team_a'],
                    'is_home': True,
                    'event': fixture['event'],
                    'kickoff_time': fixture['kickoff_time'],
                    'team_name': teams.get(fixture['team_h'], 'Unknown'),
                    'opponent_name': teams.get(fixture['team_a'], 'Unknown'),
                    'formatted_fixture': f"vs {teams.get(fixture['team_a'], 'Unknown')} (H)"
                }
            
            # Add away team's next fixture
            if fixture['team_a'] not in team_next_fixtures:
                team_next_fixtures[fixture['team_a']] = {
                    'opponent': fixture['team_h'],
                    'is_home': False,
                    'event': fixture['event'],
                    'kickoff_time': fixture['kickoff_time'],
                    'team_name': teams.get(fixture['team_a'], 'Unknown'),
                    'opponent_name': teams.get(fixture['team_h'], 'Unknown'),
                    'formatted_fixture': f"vs {teams.get(fixture['team_h'], 'Unknown')} (A)"
                }

        return {
            'current_gameweek': current_gameweek,
            'team_next_fixtures': team_next_fixtures
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gameweek/{gameweek}")
async def get_gameweek(gameweek: int, manager_id: str):
    try:
        url = f"https://fantasy.premierleague.com/api/entry/{manager_id}/event/{gameweek}/picks/"
        response = requests.get(url)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_team(team_data: Dict[str, Any]):
    try:
        analyzer = TeamAnalyzer()
        analysis = analyzer.analyze_team(team_data)
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
