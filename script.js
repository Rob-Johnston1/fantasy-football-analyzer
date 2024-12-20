// Global variables
window.selectedPlayers = [];
let allPlayers = [];
let teamNextFixtures = {};

// Utility functions
function getPositionType(elementType) {
    switch (elementType) {
        case 1: return 'GK';
        case 2: return 'DEF';
        case 3: return 'MID';
        case 4: return 'FWD';
        default: return '';
    }
}

function getPositionName(elementType) {
    switch (elementType) {
        case 1: return 'Goalkeeper';
        case 2: return 'Defender';
        case 3: return 'Midfielder';
        case 4: return 'Forward';
        default: return 'Unknown';
    }
}

function calculateFormation() {
    const formation = {
        GK: 0,
        DEF: 0,
        MID: 0,
        FWD: 0
    };

    // Only count starting 11
    const startingEleven = window.selectedPlayers.filter(p => !p.is_sub);
    startingEleven.forEach(player => {
        switch (player.element_type) {
            case 1: formation.GK++; break;
            case 2: formation.DEF++; break;
            case 3: formation.MID++; break;
            case 4: formation.FWD++; break;
        }
    });

    return `${formation.DEF}-${formation.MID}-${formation.FWD}`;
}

function updateTeamStats() {
    // Update formation and counts
    const formation = calculateFormation();
    document.getElementById('formationDisplay').textContent = formation;

    // Count players by position
    const counts = {
        GK: window.selectedPlayers.filter(p => p.element_type === 1).length,
        DEF: window.selectedPlayers.filter(p => p.element_type === 2).length,
        MID: window.selectedPlayers.filter(p => p.element_type === 3).length,
        FWD: window.selectedPlayers.filter(p => p.element_type === 4).length
    };

    // Update position counts
    document.getElementById('gkCount').textContent = `${counts.GK}/2 GK`;
    document.getElementById('defCount').textContent = `${counts.DEF}/5 DEF`;
    document.getElementById('midCount').textContent = `${counts.MID}/5 MID`;
    document.getElementById('fwdCount').textContent = `${counts.FWD}/3 FWD`;

    // Calculate and update team value
    const teamValue = window.selectedPlayers.reduce((total, player) => total + player.now_cost, 0) / 10;
    document.getElementById('teamValue').textContent = `£${teamValue.toFixed(1)}m`;

    // Enable/disable analyze button based on having exactly 11 starting players
    const startingCount = window.selectedPlayers.filter(p => !p.is_sub).length;
    const analyzeButton = document.getElementById('analyzeButton');
    analyzeButton.disabled = startingCount !== 11;
}

function updatePitchDisplay() {
    console.log('Updating pitch display with players:', window.selectedPlayers);
    
    // Clear all positions first
    document.querySelectorAll('.player-position').forEach(position => {
        // Get all elements, checking if they exist
        const circle = position.querySelector('.player-circle');
        const name = position.querySelector('.player-name');
        const points = position.querySelector('.player-points');
        const form = position.querySelector('.player-form');

        // Reset each element if it exists
        if (circle) circle.textContent = '+';
        if (name) name.textContent = '';
        if (points) points.textContent = '';
        if (form) form.textContent = '';

        position.classList.remove('occupied');
        if (circle) circle.classList.remove('captain', 'vice-captain');
        delete position.dataset.playerId;
    });

    // Sort players by position and whether they are subs
    const sortedPlayers = [...window.selectedPlayers].sort((a, b) => {
        // First sort by whether they are subs
        if (a.is_sub !== b.is_sub) {
            return a.is_sub ? 1 : -1;
        }
        // Then by position number
        return a.position_number - b.position_number;
    });

    console.log('Sorted players:', sortedPlayers);

    // Display players in their positions
    sortedPlayers.forEach(player => {
        const positionType = getPositionType(player.element_type);
        console.log('Finding position for player:', player.web_name, 'type:', positionType, 'is_sub:', player.is_sub, 'position:', player.position_number);
        
        // For substitutes, use the substitute positions
        let availablePosition;
        if (player.is_sub) {
            // Positions 12-15 are substitutes
            availablePosition = document.querySelector(`#position${player.position_number}`);
        } else {
            // For starting players, use their exact position number (1-11)
            availablePosition = document.querySelector(`#position${player.position_number}`);
            
            // Fallback to any available position of the correct type if exact position is taken
            if (!availablePosition || availablePosition.classList.contains('occupied')) {
                const positions = Array.from(document.querySelectorAll(`.player-position[data-position="${positionType}"]:not(.occupied):not(.substitute)`));
                availablePosition = positions[0];
            }
        }
        
        console.log('Found position:', availablePosition);
        
        if (availablePosition) {
            // Get all elements, checking if they exist
            const circle = availablePosition.querySelector('.player-circle');
            const nameDisplay = availablePosition.querySelector('.player-name');
            const pointsDisplay = availablePosition.querySelector('.player-points');
            const formDisplay = availablePosition.querySelector('.player-form');

            // Update each element if it exists
            if (circle) {
                circle.textContent = player.web_name.charAt(0);

                // Remove any existing indicators
                const existingIndicator = circle.querySelector('.captain-indicator, .vice-captain-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }

                // Add captain/vice-captain indicator if applicable
                if (player.is_captain) {
                    const captainIndicator = document.createElement('div');
                    captainIndicator.className = 'captain-indicator';
                    captainIndicator.textContent = 'C';
                    circle.appendChild(captainIndicator);
                } else if (player.is_vice_captain) {
                    const viceCaptainIndicator = document.createElement('div');
                    viceCaptainIndicator.className = 'vice-captain-indicator';
                    viceCaptainIndicator.textContent = 'V';
                    circle.appendChild(viceCaptainIndicator);
                }
            }
            if (nameDisplay) nameDisplay.textContent = player.web_name;
            if (pointsDisplay) pointsDisplay.textContent = `${player.total_points} (${player.gameweek_points || 0})`;
            if (formDisplay) formDisplay.textContent = player.form || '0.0';

            availablePosition.classList.add('occupied');
            availablePosition.dataset.playerId = player.id;
            console.log('Placed player in position:', player.web_name);
        } else {
            console.warn('No available position found for player:', player.web_name);
        }
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getPositionType,
        getPositionName,
        calculateFormation,
        updateTeamStats,
        updatePitchDisplay,
        selectedPlayers: window.selectedPlayers
    };
}

// DOM Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let filteredPlayers = [];
    let teamMap = {};
    const currentPage = 1;
    const playersTable = document.getElementById('playersTable');
    const playersTableBody = document.getElementById('playersTableBody');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const startRangeSpan = document.getElementById('startRange');
    const endRangeSpan = document.getElementById('endRange');
    const totalPlayersSpan = document.getElementById('totalPlayers');
    const managerIdInput = document.getElementById('managerId');
    const gameweekInput = document.getElementById('gameweek');
    const loadDataBtn = document.getElementById('loadData');
    const loadingSpinner = loadDataBtn.querySelector('.spinner-border');
    const analyzeTeamBtn = document.getElementById('analyzeTeamBtn');
    const analysisSection = document.getElementById('analysisSection');
    const analysisContent = document.getElementById('analysisContent');

    let currentSortColumn = ''; // Track current sort column
    let isAscending = true; // Track sort direction
    const playersPerPage = 10;

    // Team constraints
    const BUDGET_LIMIT = 100.0;
    const MAX_PLAYERS_PER_TEAM = 3;
    const POSITION_LIMITS = {
        'GK': 2,
        'DEF': 5,
        'MID': 5,
        'FWD': 3
    };

    // Position mapping and order
    const positionMap = {
        1: 'GK',
        2: 'DEF',
        3: 'MID',
        4: 'FWD'
    };

    const positionOrder = {
        1: 1, // GK
        2: 2, // DEF
        3: 3, // MID
        4: 4  // FWD
    };

    function createActionButton(playerId) {
        return `
            <button class="btn btn-success action-btn" data-player-id="${playerId}">
                <span class="add-btn">+</span>
            </button>
        `;
    }

    // Add click handlers to all table headers
    document.querySelectorAll('#playersTable th').forEach((headerCell, index) => {
        // Skip the Actions column
        if (index === 0) return;

        headerCell.addEventListener('click', () => {
            const columnName = headerCell.textContent.toLowerCase().trim();

            // Toggle sort direction if clicking the same column
            if (currentSortColumn === columnName) {
                isAscending = !isAscending;
            } else {
                currentSortColumn = columnName;
                isAscending = true;
            }

            // Remove sort classes from all headers
            document.querySelectorAll('#playersTable th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });

            // Add sort class to current header
            headerCell.classList.add(isAscending ? 'sort-asc' : 'sort-desc');

            // Sort the entire players array
            sortTable(columnName);

            // Reset to first page after sorting
            currentPage = 1;

            // Update table with sorted data
            displayPlayers(filteredPlayers, currentPage);
        });
    });

    function sortTable(columnName) {
        filteredPlayers.sort((a, b) => {
            let aValue, bValue;

            switch(columnName) {
                case 'id':
                    aValue = parseInt(a.id);
                    bValue = parseInt(b.id);
                    break;
                case 'name':
                    aValue = `${a.first_name} ${a.second_name}`;
                    bValue = `${b.first_name} ${b.second_name}`;
                    break;
                case 'team':
                    aValue = a.team;
                    bValue = b.team;
                    break;
                case 'position':
                    aValue = positionMap[a.element_type];
                    bValue = positionMap[b.element_type];
                    break;
                case 'price':
                    aValue = parseFloat(a.price);
                    bValue = parseFloat(b.price);
                    break;
                case 'total points':
                    aValue = parseInt(a.total_points);
                    bValue = parseInt(a.total_points);
                    break;
                case 'points/£m':
                    aValue = parseFloat(a.total_points) / parseFloat(a.price);
                    bValue = parseFloat(b.total_points) / parseFloat(b.price);
                    break;
                case 'form':
                    aValue = parseFloat(a.form);
                    bValue = parseFloat(a.form);
                    break;
                case 'selected by':
                    aValue = parseFloat(a.selected_by_percent);
                    bValue = parseFloat(a.selected_by_percent);
                    break;
                case 'minutes':
                    aValue = parseInt(a.minutes);
                    bValue = parseInt(a.minutes);
                    break;
                case 'goals':
                    aValue = parseInt(a.goals_scored);
                    bValue = parseInt(a.goals_scored);
                    break;
                case 'assists':
                    aValue = parseInt(a.assists);
                    bValue = parseInt(a.assists);
                    break;
                case 'clean sheets':
                    aValue = parseInt(a.clean_sheets);
                    bValue = parseInt(a.clean_sheets);
                    break;
                case 'goals conceded':
                    aValue = parseInt(a.goals_conceded);
                    bValue = parseInt(a.goals_conceded);
                    break;
                case 'yellow cards':
                    aValue = parseInt(a.yellow_cards);
                    bValue = parseInt(a.yellow_cards);
                    break;
                case 'red cards':
                    aValue = parseInt(a.red_cards);
                    bValue = parseInt(a.red_cards);
                    break;
                default:
                    console.warn('Unknown column:', columnName);
                    return 0;
            }

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return isAscending ? aValue - bValue : bValue - aValue;
            } else {
                return isAscending ? 
                    aValue.toString().localeCompare(bValue.toString()) : 
                    bValue.toString().localeCompare(aValue.toString());
            }
        });
    }

    function displayPlayers(players, page) {
        const start = (page - 1) * playersPerPage;
        const end = start + playersPerPage;
        const pageData = players.slice(start, end);
        
        playersTableBody.innerHTML = '';
        pageData.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.web_name}</td>
                <td>${teamMap[player.team] || 'Unknown'}</td>
                <td>${getPositionName(player.element_type)}</td>
                <td>£${(player.now_cost / 10).toFixed(1)}m</td>
                <td>${player.total_points}</td>
                <td>${player.form}</td>
                <td>${teamNextFixtures[player.team]?.formatted_fixture || 'No fixture'}</td>
                <td>${createActionButton(player.id)}</td>
            `;
            playersTableBody.appendChild(row);
        });

        // Update pagination buttons
        const totalPages = Math.ceil(players.length / playersPerPage);
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    function updateCurrentTeamTable() {
        const currentTeamTableBody = document.getElementById('currentTeamTableBody');
        if (!currentTeamTableBody) return;

        currentTeamTableBody.innerHTML = '';
        
        window.selectedPlayers.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.web_name}</td>
                <td>${teamMap[player.team] || 'Unknown'}</td>
                <td>${getPositionName(player.element_type)}</td>
                <td>£${(player.now_cost / 10).toFixed(1)}m</td>
                <td>${player.total_points}</td>
                <td>${player.form}</td>
                <td>${teamNextFixtures[player.team]?.formatted_fixture || 'No fixture'}</td>
                <td>${player.gameweek_points || 0}</td>
                <td>${player.is_captain ? '(C)' : player.is_vice_captain ? '(VC)' : ''}</td>
                <td>${player.is_sub ? 'Sub' : 'Starting'}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="removePlayer(${player.id})">
                        Remove
                    </button>
                </td>
            `;
            currentTeamTableBody.appendChild(row);
        });
    }

    function updateTeamStats() {
        // Update team value
        const teamValue = window.selectedPlayers.reduce((sum, player) => sum + player.now_cost / 10, 0);
        document.getElementById('teamValue').textContent = `£${teamValue.toFixed(1)}m`;

        // Update position counts
        const counts = {
            1: 0, // GK
            2: 0, // DEF
            3: 0, // MID
            4: 0  // FWD
        };

        window.selectedPlayers.forEach(player => {
            counts[player.element_type]++;
        });

        document.getElementById('gkCount').textContent = `${counts[1]}/2 GK`;
        document.getElementById('defCount').textContent = `${counts[2]}/5 DEF`;
        document.getElementById('midCount').textContent = `${counts[3]}/5 MID`;
        document.getElementById('fwdCount').textContent = `${counts[4]}/3 FWD`;

        // Update pitch display
        updatePitchDisplay();
    }

    function calculateTeamStats() {
        let totalValue = 0;
        let teamCounts = {};
        let positionCounts = {
            'GK': 0,
            'DEF': 0,
            'MID': 0,
            'FWD': 0
        };

        window.selectedPlayers.forEach((player) => {
            // Calculate total value
            totalValue += player.price;

            // Count players per team
            teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;

            // Count players per position
            const position = positionMap[player.element_type];
            positionCounts[position]++;
        });

        return {
            totalValue,
            teamCounts,
            positionCounts
        };
    }

    function validateTeamSelection(playerToAdd) {
        const stats = calculateTeamStats();
        const playerPosition = positionMap[playerToAdd.element_type];

        // Check budget limit
        if (stats.totalValue + playerToAdd.price > BUDGET_LIMIT) {
            alert(`Cannot add player: Team value would exceed £${BUDGET_LIMIT}m`);
            return false;
        }

        // Check team limit
        if (stats.teamCounts[playerToAdd.team] >= MAX_PLAYERS_PER_TEAM) {
            alert(`Cannot add player: Maximum of ${MAX_PLAYERS_PER_TEAM} players from the same team allowed`);
            return false;
        }

        // Check position limit
        if (stats.positionCounts[playerPosition] >= POSITION_LIMITS[playerPosition]) {
            alert(`Cannot add player: Maximum of ${POSITION_LIMITS[playerPosition]} ${playerPosition} players allowed`);
            return false;
        }

        return true;
    }

    function addPlayerToTeam(playerData) {
        console.log('Adding player to team:', {
            pick_number: playerData.position_number,
            player_name: playerData.web_name,
            is_sub: playerData.position_number > 11,
            element_type: playerData.element_type,
            position: positionMap[playerData.element_type]
        });

        // Get the position element
        const positionElement = document.getElementById(`position${playerData.position_number}`);
        if (!positionElement) {
            console.error(`No position element found for position ${playerData.position_number}`);
            return false;
        }

        // Calculate 3-game average
        // Using past_3_games from player history or form if not available
        const avgPoints = playerData.form ? parseFloat(playerData.form).toFixed(1) : '-';

        // Clear any existing content
        const circle = positionElement.querySelector('.player-circle');
        if (circle) {
            circle.textContent = playerData.web_name.charAt(0);

            // Remove any existing indicators
            const existingIndicator = circle.querySelector('.captain-indicator, .vice-captain-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            // Add captain/vice-captain indicator if applicable
            if (playerData.is_captain) {
                const captainIndicator = document.createElement('div');
                captainIndicator.className = 'captain-indicator';
                captainIndicator.textContent = 'C';
                circle.appendChild(captainIndicator);
            } else if (playerData.is_vice_captain) {
                const viceCaptainIndicator = document.createElement('div');
                viceCaptainIndicator.className = 'vice-captain-indicator';
                viceCaptainIndicator.textContent = 'V';
                circle.appendChild(viceCaptainIndicator);
            }
        }

        // Update player name and points
        const nameElement = positionElement.querySelector('.player-name');
        if (nameElement) {
            nameElement.innerHTML = `
                <div class="name">${playerData.web_name}</div>
                <div class="points">${playerData.event_points} pts</div>
                <div class="avg-points">avg ${avgPoints}</div>
            `;
        }

        // Show the position
        positionElement.style.display = 'flex';
        positionElement.classList.add('occupied');

        // Store player data
        window.selectedPlayers.push(playerData);

        onPlayersChanged();
        return true;
    }

    function removePlayerFromTeam(playerData) {
        // Find and clear position
        document.querySelectorAll('.player-position').forEach(position => {
            const playerName = position.querySelector('.player-name').textContent;
            if (playerName === playerData.web_name) {
                position.classList.remove('occupied');
                const circle = position.querySelector('.player-circle');
                circle.textContent = '+';

                // Remove captain/vice-captain indicator if present
                const captainIndicator = circle.querySelector('.captain-indicator');
                const viceCaptainIndicator = circle.querySelector('.vice-captain-indicator');
                if (captainIndicator) captainIndicator.remove();
                if (viceCaptainIndicator) viceCaptainIndicator.remove();

                position.querySelector('.player-name').textContent = '';

                window.selectedPlayers = window.selectedPlayers.filter(player => player.id !== playerData.id);
                onPlayersChanged();
            }
        });
    }

    function updateActionButtons() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            const playerId = parseInt(btn.dataset.playerId);
            const isInTeam = window.selectedPlayers.some(p => p.id === playerId);

            btn.innerHTML = isInTeam ? 
                '<span class="remove-btn">−</span>' : 
                '<span class="add-btn">+</span>';
            btn.classList.toggle('btn-danger', isInTeam);
            btn.classList.toggle('btn-success', !isInTeam);
        });
    }

    function updateCurrentTeamTable() {
        const currentTeamTableBody = document.getElementById('currentTeamTableBody');
        if (!currentTeamTableBody) return;

        currentTeamTableBody.innerHTML = '';
        
        window.selectedPlayers.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.web_name}</td>
                <td>${teamMap[player.team] || 'Unknown'}</td>
                <td>${getPositionName(player.element_type)}</td>
                <td>£${(player.now_cost / 10).toFixed(1)}m</td>
                <td>${player.total_points}</td>
                <td>${player.form}</td>
                <td>${teamNextFixtures[player.team]?.formatted_fixture || 'No fixture'}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="removePlayer(${player.id})">
                        Remove
                    </button>
                </td>
            `;
            currentTeamTableBody.appendChild(row);
        });
    }

    function handleActionClick(e, playerData) {
        e.preventDefault();
        e.stopPropagation();
        const isInTeam = window.selectedPlayers.some(p => p.id === playerData.id);

        if (isInTeam) {
            removePlayerFromTeam(playerData);
        } else {
            addPlayerToTeam(playerData);
        }
    }

    // Drag and Drop functionality
    function initializeDragAndDrop() {
        document.querySelectorAll('#playersTableBody tr').forEach(row => {
            row.setAttribute('draggable', true);
            row.addEventListener('dragstart', handleDragStart);
        });

        document.querySelectorAll('.player-position').forEach(position => {
            position.addEventListener('dragover', handleDragOver);
            position.addEventListener('drop', handleDrop);
        });
    }

    function handleDragStart(e) {
        const playerData = filteredPlayers[e.target.dataset.index];
        e.dataTransfer.setData('text/plain', JSON.stringify(playerData));
        e.target.classList.add('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        e.preventDefault();
        const dropTarget = e.target.closest('.player-position');
        const playerData = JSON.parse(e.dataTransfer.getData('text/plain'));
        const targetPosition = dropTarget.dataset.position;

        if (positionMap[playerData.element_type] !== targetPosition) {
            alert('Invalid position! This player cannot play in this position.');
            return;
        }

        if (window.selectedPlayers.some(player => player.id === dropTarget.id)) {
            alert('Position already occupied! Remove player first.');
            return;
        }

        // Get position number from the circle's ID
        const positionNumber = dropTarget.id.replace('position', '');

        const playerCircle = dropTarget.querySelector('.player-circle');
        playerCircle.innerHTML = positionNumber;
        playerCircle.classList.add('occupied');

        // Add player name below the circle
        const playerNameElement = dropTarget.querySelector('.player-name');
        if (playerNameElement) {
            playerNameElement.textContent = playerData.web_name;
            playerNameElement.classList.add('visible');
        }

        window.selectedPlayers.push(playerData);
        updateActionButtons();
        updateTeamStats();
        updateCurrentTeamTable();

        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    }

    function initializePlayerPositions() {
        // Add click handlers to all player positions
        document.querySelectorAll('.player-position').forEach(position => {
            const circle = position.querySelector('.player-circle');
            circle.addEventListener('click', function(e) {
                e.stopPropagation();
                const player = window.selectedPlayers.find(p => p.id === position.id);
                if (player) {
                    if (confirm(`Remove ${player.first_name} ${player.second_name} from your team?`)) {
                        removePlayerFromTeam(player);
                    }
                }
            });
        });
    }

    function initializeSearch() {
        const searchInput = document.getElementById('playerSearch');
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();

            // Filter all players
            if (searchTerm === '') {
                filteredPlayers = [...allPlayers];
            } else {
                filteredPlayers = allPlayers.filter(player => 
                    `${player.first_name} ${player.second_name}`.toLowerCase().includes(searchTerm)
                );
            }

            // Reset to first page when searching
            currentPage = 1;

            // Display filtered results
            displayPlayers(filteredPlayers, currentPage);
        });
    }

    // Pagination event listeners
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayPlayers(filteredPlayers, currentPage);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayPlayers(filteredPlayers, currentPage);
        }
    });

    async function loadAllData() {
        const managerId = document.getElementById('managerId').value.trim();
        const gameweek = parseInt(document.getElementById('gameweek').value);

        if (!managerId) {
            alert('Please enter a manager ID');
            return;
        }

        const loadButton = document.getElementById('loadData');
        const spinner = loadButton.querySelector('.spinner-border');
        
        try {
            loadButton.disabled = true;
            spinner.classList.remove('d-none');

            // First fetch all players if not already loaded
            if (!allPlayers.length) {
                await fetchPlayers();
            }

            // Then load the team data
            await loadTeamData();

        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data. Please check your manager ID and try again.');
        } finally {
            loadButton.disabled = false;
            spinner.classList.add('d-none');
        }
    }

    // Event Listeners
    document.getElementById('loadData').addEventListener('click', loadAllData);

    async function fetchPlayers() {
        try {
            const response = await fetch('http://localhost:3000/api/bootstrap-static');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Store all players
            allPlayers = data.elements;
            
            // Create team mapping
            data.teams.forEach(team => {
                teamMap[team.id] = team;
            });

            // Add additional data to players
            allPlayers = allPlayers.map(player => ({
                ...player,
                team_name: teamMap[player.team]?.name || 'Unknown',
                price: (player.now_cost / 10).toFixed(1),
                form: parseFloat(player.form).toFixed(1),
                points_per_game: parseFloat(player.points_per_game).toFixed(1)
            }));

            // Display players
            displayPlayers(allPlayers, currentPage);
            updateActionButtons();

            // Hide error message if it was shown
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.classList.add('d-none');
        } catch (error) {
            console.error('Error fetching players:', error);
            // Show error message
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Failed to load players. Please try again.';
            errorMessage.classList.remove('d-none');
        }
    }

    async function loadTeamData() {
        try {
            console.log('Cleared selected players');

            // Load gameweek data
            const managerId = '5602027'; // This should be configurable
            const gameweek = 16; // This should be dynamic based on current gameweek
            const response = await fetch(`http://localhost:3000/api/picks/${managerId}/${gameweek}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Gameweek data:', data);

            if (data.picks && Array.isArray(data.picks)) {
                // Clear current team first
                window.selectedPlayers = [];
                
                // Process each pick
                data.picks.forEach(pick => {
                    const player = allPlayers.find(p => p.id === pick.element);
                    if (player) {
                        const playerData = {
                            ...player,
                            is_captain: pick.is_captain,
                            is_vice_captain: pick.is_vice_captain,
                            position_number: pick.position,
                            is_sub: pick.position > 11
                        };
                        addPlayerToTeam(playerData);
                    }
                });
            } else {
                console.error('No picks data found:', data);
                throw new Error('No team data found');
            }

            console.log('Final selected players:', window.selectedPlayers);
            // Update UI
            onPlayersChanged();

            // Hide error message if it was shown
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.classList.add('d-none');
        } catch (error) {
            console.error('Error loading team data:', error);
            // Show error message
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Failed to load team data. Please try again.';
            errorMessage.classList.remove('d-none');
        }
    }

    // Function to prepare team data for analysis
    function prepareTeamData() {
        const players = window.selectedPlayers;
        const formation = calculateFormation();
        const teamValue = players.reduce((sum, player) => sum + (player.now_cost / 10), 0);

        return {
            picks: players.map(player => ({
                web_name: player.web_name,
                position: player.position_number,
                position_type: positionMap[player.element_type],
                is_captain: player.is_captain,
                is_vice_captain: player.is_vice_captain,
                now_cost: player.now_cost,
                form: player.form,
                total_points: player.total_points,
                team: player.team,
                team_name: teamMap[player.team]
            })),
            formation: formation,
            team_value: teamValue.toFixed(1),
            timestamp: new Date().toISOString()
        };
    }

    async function analyzeTeam() {
        try {
            // Show loading state
            const analyzeButton = document.getElementById('analyzeButton');
            const loadingSpinner = document.getElementById('loadingSpinner');
            analyzeButton.disabled = true;
            loadingSpinner.style.display = 'inline-block';

            // Get current team data
            const teamData = {
                players: window.selectedPlayers.map(player => ({
                    id: player.id,
                    name: player.web_name,
                    team: player.team,
                    position: player.element_type,
                    price: player.now_cost / 10,
                    total_points: player.total_points,
                    form: player.form,
                    next_fixture: teamNextFixtures[player.team]?.formatted_fixture || 'No fixture'
                }))
            };

            // Send POST request
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(teamData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Display analysis
            const analysisContainer = document.getElementById('analysisContainer');
            const analysisContent = document.getElementById('analysisContent');
            analysisContent.textContent = data.analysis;
            analysisContainer.style.display = 'block';

        } catch (error) {
            console.error('Error analyzing team:', error);
            alert('Failed to analyze team. Please try again.');
        } finally {
            // Hide loading state
            const analyzeButton = document.getElementById('analyzeButton');
            const loadingSpinner = document.getElementById('loadingSpinner');
            analyzeButton.disabled = false;
            loadingSpinner.style.display = 'none';
        }
    }

    // Enable/disable analyze button based on team selection
    function updateAnalyzeButton() {
        const startingEleven = window.selectedPlayers.filter(p => !p.is_sub);
        const hasFullTeam = startingEleven.length === 11;
        analyzeTeamBtn.disabled = !hasFullTeam;
        analyzeTeamBtn.title = hasFullTeam ? 
            'Get AI analysis of your team' : 
            'Select exactly 11 starting players to analyze your team';
    }

    // Add event listener for analyze button
    document.getElementById('analyzeButton').addEventListener('click', analyzeTeam);

    // Update analyze button when team changes
    function onPlayersChanged() {
        updateTeamStats();
        updateCurrentTeamTable();
        
        // Enable analyze button only when we have exactly 11 players
        const analyzeButton = document.getElementById('analyzeButton');
        analyzeButton.disabled = window.selectedPlayers.length !== 11;
    }

    function addPlayer(player) {
        console.log('Adding player:', player);
        
        if (!player) {
            console.warn('No player provided');
            return false;
        }

        if (window.selectedPlayers.some(p => p.id === player.id)) {
            console.warn('Player already in team:', player.web_name);
            return false;
        }

        // Add player to selected players array
        window.selectedPlayers.push(player);
        console.log('Added player to selectedPlayers:', player.web_name);
        console.log('Current selectedPlayers:', window.selectedPlayers);

        // Update UI
        onPlayersChanged();
        return true;
    }

    function removePlayer(playerId) {
        console.log('Removing player:', playerId);
        
        const index = window.selectedPlayers.findIndex(p => p.id === playerId);
        if (index !== -1) {
            window.selectedPlayers.splice(index, 1);
            console.log('Removed player at index:', index);
            console.log('Current selectedPlayers:', window.selectedPlayers);
            onPlayersChanged();
            return true;
        }
        
        console.warn('Player not found:', playerId);
        return false;
    }

    initializeDragAndDrop();
    initializePlayerPositions();
    initializeSearch();
});
