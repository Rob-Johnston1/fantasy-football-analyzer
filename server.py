from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs
import requests
import time

class RequestHandler(SimpleHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Accept, Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def handle_players_request(self):
        try:
            url = "https://fantasy.premierleague.com/api/bootstrap-static/"
            response = requests.get(url)
            data = response.json()
            self.send_json_response(data)
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)

    def handle_fixtures_request(self):
        try:
            # Get bootstrap data for teams and current gameweek
            bootstrap_url = "https://fantasy.premierleague.com/api/bootstrap-static/"
            bootstrap_response = requests.get(bootstrap_url)
            bootstrap_data = bootstrap_response.json()
            
            # Get current gameweek
            current_gameweek = next((event['id'] for event in bootstrap_data['events'] 
                                   if event['is_current']), None)
            
            if not current_gameweek:
                self.send_json_response({'error': 'Could not determine current gameweek'}, 400)
                return

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

            self.send_json_response({
                'current_gameweek': current_gameweek,
                'team_next_fixtures': team_next_fixtures
            })
        except Exception as e:
            print(f"Error in fixtures request: {str(e)}")
            self.send_json_response({'error': str(e)}, 500)

    def handle_gameweek_request(self, gameweek, manager_id):
        try:
            url = f"https://fantasy.premierleague.com/api/entry/{manager_id}/event/{gameweek}/picks/"
            response = requests.get(url)
            data = response.json()
            self.send_json_response(data)
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)

    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # API endpoints
        if parsed_path.path == '/api/players':
            self.handle_players_request()
            return
        elif parsed_path.path == '/api/fixtures':
            self.handle_fixtures_request()
            return
        elif parsed_path.path.startswith('/api/gameweek/'):
            gameweek = parsed_path.path.split('/')[-1]
            query_params = parse_qs(parsed_path.query)
            manager_id = query_params.get('manager_id', [''])[0]
            
            if not manager_id:
                self.send_json_response({'error': 'Missing manager_id parameter'}, 400)
                return
                
            self.handle_gameweek_request(gameweek, manager_id)
            return
        
        # For all other paths, serve static files
        return SimpleHTTPRequestHandler.do_GET(self)

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting server on port {port}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
