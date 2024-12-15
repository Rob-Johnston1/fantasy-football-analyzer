from fastapi import FastAPI, HTTPException
from fpl_api import FPLApi

app = FastAPI(title="Fantasy Football Analyzer")

@app.get("/players")
async def get_players():
    """Get all players from FPL"""
    try:
        return FPLApi.get_all_players()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/player/{player_id}")
async def get_player(player_id: int):
    """Get detailed information for a specific player"""
    try:
        return FPLApi.get_player_details(player_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/league/{league_id}")
async def get_league(league_id: int):
    """Get league standings"""
    try:
        return FPLApi.get_league_standings(league_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/team/{manager_id}")
async def get_team(manager_id: int, gameweek: int = None):
    """Get a manager's team"""
    try:
        return FPLApi.get_manager_team(manager_id, gameweek)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
