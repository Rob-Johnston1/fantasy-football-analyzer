from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
from urllib.parse import urlparse

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
    }
]

class RequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/players':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(PLAYERS_DATA).encode())
            return
            
        return SimpleHTTPRequestHandler.do_GET(self)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting server on port {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run()
