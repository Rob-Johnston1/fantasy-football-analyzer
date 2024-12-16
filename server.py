from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
from urllib.parse import urlparse
import requests
import time

# Cache mechanism
cache = {
    'last_update': 0,
    'data': None
}

def fetch_fpl_data():
    current_time = time.time()
    # Cache for 5 minutes
    if cache['data'] is None or current_time - cache['last_update'] > 300:
        try:
            response = requests.get('https://fantasy.premierleague.com/api/bootstrap-static/')
            if response.status_code == 200:
                data = response.json()
                cache['data'] = data
                cache['last_update'] = current_time
                return data
            else:
                print(f"Error fetching FPL data: {response.status_code}")
                return None
        except Exception as e:
            print(f"Exception fetching FPL data: {e}")
            return None
    return cache['data']

class RequestHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path_parts = parsed_path.path.split('/')
        
        if parsed_path.path == '/api/players':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                data = fetch_fpl_data()
                if data:
                    # Return both players and teams data
                    response_data = {
                        'elements': data['elements'],
                        'teams': data['teams']
                    }
                    self.wfile.write(json.dumps(response_data).encode())
                else:
                    self.wfile.write(json.dumps({
                        'error': 'Failed to fetch player data'
                    }).encode())
            except Exception as e:
                self.wfile.write(json.dumps({
                    'error': f'Error fetching player data: {str(e)}'
                }).encode())
            return

        elif parsed_path.path.startswith('/api/gameweek/'):
            # Handle direct gameweek URL format (e.g., /api/gameweek/14)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                gameweek = path_parts[-1]
                # Use a default manager ID or get it from query params if available
                manager_id = "12345"  # Default manager ID
                if parsed_path.query:
                    params = dict(param.split('=') for param in parsed_path.query.split('&'))
                    manager_id = params.get('manager_id', manager_id)
                
                if not gameweek.isdigit() or not (1 <= int(gameweek) <= 38):
                    raise ValueError("Invalid gameweek number")
                
                # First get the manager's picks for this gameweek
                picks_response = requests.get(f'https://fantasy.premierleague.com/api/entry/{manager_id}/event/{gameweek}/picks/')
                if picks_response.status_code == 200:
                    picks_data = picks_response.json()
                    
                    # Then get the live gameweek data for all players
                    live_response = requests.get(f'https://fantasy.premierleague.com/api/event/{gameweek}/live/')
                    if live_response.status_code == 200:
                        live_data = live_response.json()
                        
                        # Add live points to each picked player
                        for pick in picks_data['picks']:
                            player_live = next((p for p in live_data['elements'] if p['id'] == pick['element']), None)
                            if player_live:
                                pick['points'] = player_live['stats']['total_points']
                    
                    self.wfile.write(json.dumps(picks_data).encode())
                else:
                    self.wfile.write(json.dumps({
                        'error': f'Failed to fetch gameweek data: {picks_response.status_code}'
                    }).encode())
            except Exception as e:
                self.wfile.write(json.dumps({
                    'error': f'Error fetching gameweek data: {str(e)}'
                }).encode())
            return

        elif parsed_path.path == '/api/gameweek':
            # Handle query parameter format (e.g., /api/gameweek?manager_id=123&gameweek=14)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                params = dict(param.split('=') for param in parsed_path.query.split('&'))
                manager_id = params.get('manager_id')
                gameweek = params.get('gameweek')
                
                if not manager_id or not gameweek:
                    raise ValueError("Missing manager_id or gameweek parameter")
                
                response = requests.get(f'https://fantasy.premierleague.com/api/entry/{manager_id}/event/{gameweek}/picks/')
                if response.status_code == 200:
                    picks_data = response.json()
                    self.wfile.write(json.dumps(picks_data).encode())
                else:
                    self.wfile.write(json.dumps({
                        'error': f'Failed to fetch gameweek data: {response.status_code}'
                    }).encode())
            except Exception as e:
                self.wfile.write(json.dumps({
                    'error': f'Error fetching gameweek data: {str(e)}'
                }).encode())
            return

        elif parsed_path.path.startswith('/api/manager/'):
            # Handle direct manager ID format (e.g., /api/manager/12345)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                manager_id = path_parts[-1]
                if not manager_id.isdigit():
                    raise ValueError("Invalid manager ID")
                
                response = requests.get(f'https://fantasy.premierleague.com/api/entry/{manager_id}/')
                if response.status_code == 200:
                    manager_data = response.json()
                    
                    # Also fetch the manager's current team
                    picks_response = requests.get(f'https://fantasy.premierleague.com/api/entry/{manager_id}/event/{manager_data["current_event"]}/picks/')
                    if picks_response.status_code == 200:
                        picks_data = picks_response.json()
                        manager_data['picks'] = picks_data['picks']
                    
                    self.wfile.write(json.dumps(manager_data).encode())
                else:
                    self.wfile.write(json.dumps({
                        'error': f'Failed to fetch manager data: {response.status_code}'
                    }).encode())
            except Exception as e:
                self.wfile.write(json.dumps({
                    'error': f'Error fetching manager data: {str(e)}'
                }).encode())
            return

        elif parsed_path.path == '/api/manager':
            # Handle query parameter format (e.g., /api/manager?id=12345)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                manager_id = parsed_path.query.split('=')[1]
                response = requests.get(f'https://fantasy.premierleague.com/api/entry/{manager_id}/')
                if response.status_code == 200:
                    manager_data = response.json()
                    
                    # Also fetch the manager's current team
                    picks_response = requests.get(f'https://fantasy.premierleague.com/api/entry/{manager_id}/event/{manager_data["current_event"]}/picks/')
                    if picks_response.status_code == 200:
                        picks_data = picks_response.json()
                        manager_data['picks'] = picks_data['picks']
                    
                    self.wfile.write(json.dumps(manager_data).encode())
                else:
                    self.wfile.write(json.dumps({
                        'error': f'Failed to fetch manager data: {response.status_code}'
                    }).encode())
            except Exception as e:
                self.wfile.write(json.dumps({
                    'error': f'Error fetching manager data: {str(e)}'
                }).encode())
            return

        return SimpleHTTPRequestHandler.do_GET(self)

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print("Starting server on port %d..." % port)
    httpd.serve_forever()

if __name__ == '__main__':
    run()
