from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fpl_api import FPLApi
import os

app = FastAPI(title="Fantasy Football Analyzer")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
@app.get("/api/players")
async def get_players():
    """Get all players from FPL"""
    try:
        return FPLApi.get_all_players()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/player/{player_id}")
async def get_player(player_id: int):
    """Get detailed information for a specific player"""
    try:
        return FPLApi.get_player_details(player_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/league/{league_id}")
async def get_league(league_id: int):
    """Get league standings"""
    try:
        return FPLApi.get_league_standings(league_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/team/{manager_id}")
async def get_team(manager_id: int, gameweek: int = None):
    """Get a manager's team"""
    try:
        return FPLApi.get_manager_team(manager_id, gameweek)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve static files
@app.get("/")
async def read_root():
    return FileResponse('static/index.html')

# Mount static files after all routes
app.mount("/static", StaticFiles(directory="static"), name="static")
