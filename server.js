const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for bootstrap-static
app.get('/api/bootstrap-static', async (req, res) => {
    try {
        const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching bootstrap-static:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Proxy endpoint for manager picks
app.get('/api/picks/:managerId/:gameweek', async (req, res) => {
    try {
        const { managerId, gameweek } = req.params;
        const response = await fetch(`https://fantasy.premierleague.com/api/entry/${managerId}/event/${gameweek}/picks/`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching manager picks:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
