import os
import openai
from typing import Dict, Any

class TeamAnalyzer:
    def __init__(self, api_key: str = None):
        """Initialize the TeamAnalyzer with OpenAI API key."""
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set it via constructor or OPENAI_API_KEY environment variable.")
        openai.api_key = self.api_key

    def format_team_data(self, team_data: Dict[str, Any]) -> str:
        """Format team data into a clear text representation for the AI."""
        team_text = "Current Team Analysis:\n\n"
        
        # Starting XI
        team_text += "Starting XI:\n"
        starters = [p for p in team_data['picks'] if p['position'] <= 11]
        for player in starters:
            captain_status = "(C)" if player['is_captain'] else "(VC)" if player['is_vice_captain'] else ""
            team_text += f"- {player['web_name']} {captain_status} - {player['position_type']} - £{player['now_cost']/10}m - Form: {player['form']} - Points: {player['total_points']}\n"
        
        # Substitutes
        team_text += "\nSubstitutes:\n"
        subs = [p for p in team_data['picks'] if p['position'] > 11]
        for player in subs:
            team_text += f"- {player['web_name']} - {player['position_type']} - £{player['now_cost']/10}m - Form: {player['form']} - Points: {player['total_points']}\n"
        
        # Team Stats
        team_text += f"\nTeam Value: £{team_data['team_value']}m\n"
        team_text += f"Formation: {team_data['formation']}\n"
        
        return team_text

    def analyze_team(self, team_data: Dict[str, Any]) -> str:
        """
        Analyze the team using OpenAI's API and provide suggestions.
        Returns a string with the analysis.
        """
        formatted_team = self.format_team_data(team_data)
        
        prompt = f"""As a Fantasy Premier League expert, analyze this team and provide:
1. Overall team assessment
2. Key strengths
3. Areas for improvement
4. Specific transfer suggestions
5. Captain recommendation for next gameweek

Team Data:
{formatted_team}

Provide your analysis in a clear, concise format with numbered sections. Be specific with player names and explain your reasoning."""

        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a Fantasy Premier League expert providing team analysis and advice."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        return response.choices[0].message.content

    async def get_transfer_suggestions(self, team_data: Dict[str, Any], budget: float) -> Dict[str, Any]:
        """Get specific transfer suggestions based on budget and team needs."""
        formatted_team = self.format_team_data(team_data)
        
        prompt = f"""As a Fantasy Premier League expert, provide specific transfer suggestions for this team.
Available budget: £{budget}m

Team Data:
{formatted_team}

Please suggest:
1. Priority transfers (up to 3)
2. Players to sell
3. Reasoning for each suggestion
4. Alternative options within the budget"""

        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a Fantasy Premier League expert analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            suggestions = response.choices[0].message.content
            
            return {
                "success": True,
                "suggestions": suggestions,
                "timestamp": team_data.get('timestamp', None)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": team_data.get('timestamp', None)
            }
