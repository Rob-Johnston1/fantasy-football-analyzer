import requests
from typing import Dict, List, Optional

class FPLApi:
    BASE_URL = "https://fantasy.premierleague.com/api"
    
    @staticmethod
    def get_all_players() -> List[Dict]:
        """Fetch all player data from the FPL API"""
        url = f"{FPLApi.BASE_URL}/bootstrap-static/"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()["elements"]
    
    @staticmethod
    def get_player_details(player_id: int) -> Dict:
        """Fetch detailed information for a specific player"""
        url = f"{FPLApi.BASE_URL}/element-summary/{player_id}/"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    
    @staticmethod
    def get_league_standings(league_id: int) -> Dict:
        """Fetch league standings"""
        url = f"{FPLApi.BASE_URL}/leagues-classic/{league_id}/standings/"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    
    @staticmethod
    def get_manager_team(manager_id: int, gameweek: Optional[int] = None) -> Dict:
        """Fetch a manager's team for a specific gameweek"""
        url = f"{FPLApi.BASE_URL}/entry/{manager_id}/event/{gameweek}/picks/"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
