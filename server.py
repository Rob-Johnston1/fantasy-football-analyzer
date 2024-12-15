from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
from urllib.parse import urlparse
import requests
import time

# Sample player data
PLAYERS_DATA = [
    {
        "id": 1,
        "first_name": "Erling",
        "second_name": "Haaland",
        "team": "Manchester City",
        "element_type": 4,  # FWD
        "price": 14.0,
        "total_points": 120,
        "form": "8.5",
        "selected_by_percent": "45.2",
        "minutes": 1200,
        "goals_scored": 15,
        "assists": 5,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 2,
        "red_cards": 0
    },
    {
        "id": 2,
        "first_name": "Mohamed",
        "second_name": "Salah",
        "team": "Liverpool",
        "element_type": 4,  # FWD
        "price": 13.0,
        "total_points": 110,
        "form": "7.8",
        "selected_by_percent": "42.1",
        "minutes": 1350,
        "goals_scored": 12,
        "assists": 8,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 1,
        "red_cards": 0
    },
    {
        "id": 3,
        "first_name": "Kevin",
        "second_name": "De Bruyne",
        "team": "Manchester City",
        "element_type": 3,  # MID
        "price": 12.0,
        "total_points": 95,
        "form": "7.2",
        "selected_by_percent": "38.5",
        "minutes": 1150,
        "goals_scored": 5,
        "assists": 12,
        "clean_sheets": 8,
        "goals_conceded": 0,
        "yellow_cards": 3,
        "red_cards": 0
    },
    {
        "id": 4,
        "first_name": "Virgil",
        "second_name": "van Dijk",
        "team": "Liverpool",
        "element_type": 2,  # DEF
        "price": 11.0,
        "total_points": 85,
        "form": "6.8",
        "selected_by_percent": "35.4",
        "minutes": 1440,
        "goals_scored": 2,
        "assists": 1,
        "clean_sheets": 10,
        "goals_conceded": 12,
        "yellow_cards": 2,
        "red_cards": 0
    },
    {
        "id": 5,
        "first_name": "Alisson",
        "second_name": "Becker",
        "team": "Liverpool",
        "element_type": 1,  # GK
        "price": 10.0,
        "total_points": 80,
        "form": "6.5",
        "selected_by_percent": "32.8",
        "minutes": 1440,
        "goals_scored": 0,
        "assists": 0,
        "clean_sheets": 10,
        "goals_conceded": 12,
        "yellow_cards": 0,
        "red_cards": 0
    },
    {
        "id": 6,
        "first_name": "Bruno",
        "second_name": "Fernandes",
        "team": "Manchester United",
        "element_type": 3,  # MID
        "price": 12.0,
        "total_points": 90,
        "form": "7.0",
        "selected_by_percent": "36.2",
        "minutes": 1350,
        "goals_scored": 8,
        "assists": 10,
        "clean_sheets": 6,
        "goals_conceded": 0,
        "yellow_cards": 4,
        "red_cards": 0
    },
    {
        "id": 7,
        "first_name": "Harry",
        "second_name": "Kane",
        "team": "Bayern Munich",
        "element_type": 4,  # FWD
        "price": 13.0,
        "total_points": 105,
        "form": "7.5",
        "selected_by_percent": "40.1",
        "minutes": 1260,
        "goals_scored": 14,
        "assists": 6,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 1,
        "red_cards": 0
    },
    {
        "id": 8,
        "first_name": "Trent",
        "second_name": "Alexander-Arnold",
        "team": "Liverpool",
        "element_type": 2,  # DEF
        "price": 11.0,
        "total_points": 88,
        "form": "7.1",
        "selected_by_percent": "34.8",
        "minutes": 1350,
        "goals_scored": 3,
        "assists": 8,
        "clean_sheets": 9,
        "goals_conceded": 14,
        "yellow_cards": 2,
        "red_cards": 0
    },
    {
        "id": 9,
        "first_name": "Ederson",
        "second_name": "Moraes",
        "team": "Manchester City",
        "element_type": 1,  # GK
        "price": 10.0,
        "total_points": 82,
        "form": "6.7",
        "selected_by_percent": "33.5",
        "minutes": 1440,
        "goals_scored": 0,
        "assists": 1,
        "clean_sheets": 11,
        "goals_conceded": 10,
        "yellow_cards": 1,
        "red_cards": 0
    },
    {
        "id": 10,
        "first_name": "Marcus",
        "second_name": "Rashford",
        "team": "Manchester United",
        "element_type": 4,  # FWD
        "price": 12.0,
        "total_points": 85,
        "form": "6.8",
        "selected_by_percent": "32.4",
        "minutes": 1170,
        "goals_scored": 10,
        "assists": 5,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 2,
        "red_cards": 0
    },
    {
        "id": 11,
        "first_name": "Phil",
        "second_name": "Foden",
        "team": "Manchester City",
        "element_type": 3,  # MID
        "price": 11.5,
        "total_points": 82,
        "form": "6.9",
        "selected_by_percent": "31.8",
        "minutes": 1080,
        "goals_scored": 7,
        "assists": 7,
        "clean_sheets": 7,
        "goals_conceded": 0,
        "yellow_cards": 1,
        "red_cards": 0
    },
    {
        "id": 12,
        "first_name": "Ruben",
        "second_name": "Dias",
        "team": "Manchester City",
        "element_type": 2,  # DEF
        "price": 10.5,
        "total_points": 78,
        "form": "6.4",
        "selected_by_percent": "30.2",
        "minutes": 1350,
        "goals_scored": 1,
        "assists": 2,
        "clean_sheets": 11,
        "goals_conceded": 10,
        "yellow_cards": 3,
        "red_cards": 0
    },
    {
        "id": 13,
        "first_name": "Bruno",
        "second_name": "Fernandes",
        "team": "Manchester United",
        "element_type": 3,  # MID
        "price": 11.5,
        "total_points": 85,
        "form": "6.8",
        "selected_by_percent": "35.2",
        "minutes": 1260,
        "goals_scored": 8,
        "assists": 10,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 3,
        "red_cards": 0
    },
    {
        "id": 14,
        "first_name": "Bukayo",
        "second_name": "Saka",
        "team": "Arsenal",
        "element_type": 3,  # MID
        "price": 10.5,
        "total_points": 92,
        "form": "7.1",
        "selected_by_percent": "38.5",
        "minutes": 1350,
        "goals_scored": 9,
        "assists": 7,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 1,
        "red_cards": 0
    },
    {
        "id": 15,
        "first_name": "Virgil",
        "second_name": "van Dijk",
        "team": "Liverpool",
        "element_type": 2,  # DEF
        "price": 9.5,
        "total_points": 75,
        "form": "6.2",
        "selected_by_percent": "25.8",
        "minutes": 1440,
        "goals_scored": 2,
        "assists": 1,
        "clean_sheets": 8,
        "goals_conceded": 12,
        "yellow_cards": 2,
        "red_cards": 0
    },
    {
        "id": 16,
        "first_name": "Alisson",
        "second_name": "Becker",
        "team": "Liverpool",
        "element_type": 1,  # GK
        "price": 8.5,
        "total_points": 82,
        "form": "6.5",
        "selected_by_percent": "28.3",
        "minutes": 1440,
        "goals_scored": 0,
        "assists": 0,
        "clean_sheets": 8,
        "goals_conceded": 12,
        "yellow_cards": 0,
        "red_cards": 0
    },
    {
        "id": 17,
        "first_name": "Marcus",
        "second_name": "Rashford",
        "team": "Manchester United",
        "element_type": 4,  # FWD
        "price": 11.0,
        "total_points": 88,
        "form": "6.9",
        "selected_by_percent": "32.1",
        "minutes": 1260,
        "goals_scored": 10,
        "assists": 5,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 2,
        "red_cards": 0
    },
    {
        "id": 18,
        "first_name": "Rodri",
        "second_name": "Hernandez",
        "team": "Manchester City",
        "element_type": 3,  # MID
        "price": 9.5,
        "total_points": 70,
        "form": "6.0",
        "selected_by_percent": "18.5",
        "minutes": 1350,
        "goals_scored": 4,
        "assists": 3,
        "clean_sheets": 6,
        "goals_conceded": 15,
        "yellow_cards": 4,
        "red_cards": 0
    },
    {
        "id": 19,
        "first_name": "Ollie",
        "second_name": "Watkins",
        "team": "Aston Villa",
        "element_type": 4,  # FWD
        "price": 8.8,
        "total_points": 95,
        "form": "7.2",
        "selected_by_percent": "28.5",
        "minutes": 1350,
        "goals_scored": 11,
        "assists": 8,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 2,
        "red_cards": 0
    },
    {
        "id": 20,
        "first_name": "James",
        "second_name": "Maddison",
        "team": "Tottenham",
        "element_type": 3,  # MID
        "price": 9.8,
        "total_points": 88,
        "form": "6.9",
        "selected_by_percent": "25.3",
        "minutes": 1080,
        "goals_scored": 7,
        "assists": 9,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 3,
        "red_cards": 0
    },
    {
        "id": 21,
        "first_name": "Kieran",
        "second_name": "Trippier",
        "team": "Newcastle",
        "element_type": 2,  # DEF
        "price": 7.0,
        "total_points": 82,
        "form": "6.5",
        "selected_by_percent": "35.8",
        "minutes": 1440,
        "goals_scored": 1,
        "assists": 8,
        "clean_sheets": 7,
        "goals_conceded": 15,
        "yellow_cards": 2,
        "red_cards": 0
    },
    {
        "id": 22,
        "first_name": "Son",
        "second_name": "Heung-min",
        "team": "Tottenham",
        "element_type": 4,  # FWD
        "price": 9.5,
        "total_points": 98,
        "form": "7.5",
        "selected_by_percent": "32.1",
        "minutes": 1350,
        "goals_scored": 12,
        "assists": 5,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 1,
        "red_cards": 0
    },
    {
        "id": 23,
        "first_name": "Jarrod",
        "second_name": "Bowen",
        "team": "West Ham",
        "element_type": 4,  # FWD
        "price": 8.2,
        "total_points": 85,
        "form": "6.8",
        "selected_by_percent": "22.4",
        "minutes": 1260,
        "goals_scored": 9,
        "assists": 6,
        "clean_sheets": 0,
        "goals_conceded": 0,
        "yellow_cards": 2,
        "red_cards": 0
    }
]

# Cache mechanism
cache = {
    'last_update': 0,
    'data': None,
    'cache_duration': 3600  # Cache for 1 hour
}

def fetch_fpl_data():
    """Fetch data from Fantasy Premier League API with caching"""
    current_time = time.time()
    
    # Return cached data if it's still valid
    if cache['data'] is not None and (current_time - cache['last_update']) < cache['cache_duration']:
        return cache['data']
    
    try:
        # Fetch bootstrap-static data from FPL API
        response = requests.get('https://fantasy.premierleague.com/api/bootstrap-static/')
        response.raise_for_status()
        data = response.json()
        
        # Transform the data into our format
        players = []
        for player in data['elements']:
            players.append({
                'id': player['id'],
                'first_name': player['first_name'],
                'second_name': player['second_name'],
                'team': data['teams'][player['team'] - 1]['name'],
                'element_type': player['element_type'],
                'price': player['now_cost'] / 10.0,
                'total_points': player['total_points'],
                'form': player['form'],
                'selected_by_percent': player['selected_by_percent'],
                'minutes': player['minutes'],
                'goals_scored': player['goals_scored'],
                'assists': player['assists'],
                'clean_sheets': player['clean_sheets'],
                'goals_conceded': player['goals_conceded'],
                'yellow_cards': player['yellow_cards'],
                'red_cards': player['red_cards']
            })
        
        # Update cache
        cache['data'] = players
        cache['last_update'] = current_time
        return players
        
    except Exception as e:
        print(f"Error fetching FPL data: {e}")
        # Return sample data as fallback
        return PLAYERS_DATA

class RequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/players':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Accept, Content-Type')
            self.end_headers()
            
            # Fetch live data from FPL API
            players = fetch_fpl_data()
            self.wfile.write(json.dumps(players).encode())
            return
            
        return SimpleHTTPRequestHandler.do_GET(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Accept, Content-Type')
        self.end_headers()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting server on port {port}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
