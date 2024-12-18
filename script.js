document.addEventListener('DOMContentLoaded', function() {
    const playersTable = document.getElementById('playersTable');
    const playersTableBody = document.getElementById('playersTableBody');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const startRangeSpan = document.getElementById('startRange');
    const endRangeSpan = document.getElementById('endRange');
    const totalPlayersSpan = document.getElementById('totalPlayers');
    
    let allPlayers = []; // Store all players
    let filteredPlayers = []; // Store filtered players
    let currentSortColumn = ''; // Track current sort column
    let isAscending = true; // Track sort direction
    let selectedPlayers = new Map(); // Track selected players by position
    let currentPage = 1;
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

    // Team mapping - We'll update this dynamically from the API
    let teamMap = {};

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
                    bValue = parseInt(b.total_points);
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

    function displayPlayers(players, page = 1) {
        const start = (page - 1) * playersPerPage;
        const end = start + playersPerPage;
        const playersToDisplay = players.slice(start, end);
        const tableBody = document.querySelector('#playersTable tbody');
        
        tableBody.innerHTML = '';
        playersToDisplay.forEach((player, index) => {
            const row = document.createElement('tr');
            const captainStatus = player.is_captain ? '(C) ' : player.is_vice_captain ? '(VC) ' : '';
            row.innerHTML = `
                <td><button class="btn btn-success btn-sm add-player" data-player-id="${player.id}">Add</button></td>
                <td>${captainStatus}${player.first_name} ${player.second_name}</td>
                <td>${positionMap[player.element_type]}</td>
                <td>${player.team_name || teamMap[player.team] || 'Unknown'}</td>
                <td>£${(player.now_cost / 10).toFixed(1)}m</td>
                <td>${player.total_points} (${player.gameweek_points || 0})</td>
            `;
            tableBody.appendChild(row);
        });

        // Update pagination
        updatePagination(players.length);
        
        // Reattach event listeners
        document.querySelectorAll('.add-player').forEach(button => {
            button.addEventListener('click', function() {
                const playerId = parseInt(this.dataset.playerId);
                const player = players.find(p => p.id === playerId);
                if (player) {
                    addPlayerToTeam(player);
                }
            });
        });
    }

    function updatePagination(totalPlayers) {
        const totalPages = Math.ceil(totalPlayers / playersPerPage);
        document.getElementById('currentPage').textContent = `Page ${currentPage} of ${totalPages}`;
        
        // Update button states
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage >= totalPages;
    }

    function findNextAvailablePosition(positionType) {
        // For substitutes (position "ANY"), accept any position type
        const positions = document.querySelectorAll(
            positionType === "ANY" 
                ? '.player-position[data-position="ANY"]:not(.occupied)'
                : `.player-position[data-position="${positionType}"]:not(.substitute):not(.occupied)`
        );
        
        for (let position of positions) {
            if (!selectedPlayers.has(position.id)) {
                return position;
            }
        }

        // If no regular position is available, check substitute positions
        if (positionType === "GK") {
            const subGK = document.querySelector('.player-position.substitute[data-position="GK"]:not(.occupied)');
            if (subGK && !selectedPlayers.has(subGK.id)) {
                return subGK;
            }
        } else {
            const subPositions = document.querySelectorAll('.player-position.substitute[data-position="ANY"]:not(.occupied)');
            for (let position of subPositions) {
                if (!selectedPlayers.has(position.id)) {
                    return position;
                }
            }
        }
        
        return null;
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

        selectedPlayers.forEach((player) => {
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
            circle.textContent = playerData.web_name[0];
            
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
        selectedPlayers.set(playerData.id, playerData);
        
        updateTeamStats();
        return true;
    }

    function removePlayerFromTeam(playerData) {
        let positionId = null;
        for (let [id, player] of selectedPlayers.entries()) {
            if (player.id === playerData.id) {
                positionId = id;
                break;
            }
        }

        if (positionId) {
            const position = document.getElementById(positionId);
            position.classList.remove('occupied');
            const circle = position.querySelector('.player-circle');
            circle.textContent = positionId.replace('position', '');
            
            // Remove captain/vice-captain indicator if present
            const captainIndicator = circle.querySelector('.captain-indicator');
            const viceCaptainIndicator = circle.querySelector('.vice-captain-indicator');
            if (captainIndicator) captainIndicator.remove();
            if (viceCaptainIndicator) viceCaptainIndicator.remove();
            
            position.querySelector('.player-name').textContent = '';

            selectedPlayers.delete(positionId);
            updateTeamStats();
            updateActionButtons();
            updateCurrentTeamTable();
            return true;
        }
        return false;
    }

    function updateActionButtons() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            const playerId = parseInt(btn.dataset.playerId);
            const isInTeam = Array.from(selectedPlayers.values()).some(p => p.id === playerId);
            
            btn.innerHTML = isInTeam ? 
                '<span class="remove-btn">−</span>' : 
                '<span class="add-btn">+</span>';
            btn.classList.toggle('btn-danger', isInTeam);
            btn.classList.toggle('btn-success', !isInTeam);
        });
    }

    function updateTeamStats() {
        const teamStatsDiv = document.querySelector('.team-stats');
        if (!teamStatsDiv) return;

        const totalValue = Array.from(selectedPlayers.values())
            .reduce((sum, player) => sum + (player.now_cost || player.value) / 10, 0);
        
        const formation = calculateFormation();
        
        teamStatsDiv.innerHTML = `
            <p>Team Value: £${totalValue.toFixed(1)}m</p>
            <p>Formation: ${formation}</p>
        `;
    }

    function updateCurrentTeamTable() {
        const currentTeamTableBody = document.getElementById('currentTeamTableBody');
        currentTeamTableBody.innerHTML = '';

        // Sort players by position (GK -> DEF -> MID -> FWD)
        const sortedPlayers = Array.from(selectedPlayers.values()).sort((a, b) => {
            return positionOrder[a.element_type] - positionOrder[b.element_type];
        });

        sortedPlayers.forEach((player, index) => {
            // Create main row
            const row = document.createElement('tr');
            const position = positionMap[player.element_type] || 'Unknown';
            
            // Create captain badge if applicable
            let captainBadge = '';
            if (player.is_captain) {
                captainBadge = '<span class="captain-badge captain">C</span>';
            } else if (player.is_vice_captain) {
                captainBadge = '<span class="captain-badge vice-captain">V</span>';
            }
            
            row.innerHTML = `
                <td>
                    <div class="expand-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </div>
                </td>
                <td>${position}</td>
                <td class="captain-cell">${player.web_name || player.name}${captainBadge}</td>
                <td>${player.team_name || teamMap[player.team] || 'Unknown'}</td>
                <td>£${((player.now_cost || player.value) / 10).toFixed(1)}m</td>
                <td>${player.total_points || player.points || 0}</td>
                <td>${player.form || '0.0'}</td>
            `;
            currentTeamTableBody.appendChild(row);

            // Create details row
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'details-row';
            detailsRow.innerHTML = `
                <td colspan="7">
                    <div class="details-content">
                        <div class="details-grid">
                            <div class="detail-item">
                                <div class="detail-label">Selected By</div>
                                <div class="detail-value">${player.selected_by_percent || '0'}%</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Minutes Played</div>
                                <div class="detail-value">${player.minutes || 0}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Goals Scored</div>
                                <div class="detail-value">${player.goals_scored || 0}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Assists</div>
                                <div class="detail-value">${player.assists || 0}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Clean Sheets</div>
                                <div class="detail-value">${player.clean_sheets || 0}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Bonus Points</div>
                                <div class="detail-value">${player.bonus || 0}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">ICT Index</div>
                                <div class="detail-value">${player.ict_index || '0.0'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Price Change</div>
                                <div class="detail-value" style="color: ${(player.cost_change_start || 0) >= 0 ? '#4CAF50' : '#f44336'}">
                                    ${(player.cost_change_start || 0) / 10}m
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Next Fixture</div>
                                <div class="detail-value">${player.next_fixture || 'Unknown'}</div>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            currentTeamTableBody.appendChild(detailsRow);

            // Add click handler to expand button
            const expandButton = row.querySelector('.expand-button');
            expandButton.addEventListener('click', () => {
                expandButton.classList.toggle('expanded');
                detailsRow.classList.toggle('visible');
            });
        });
    }

    function handleActionClick(e, playerData) {
        e.preventDefault();
        e.stopPropagation();
        const isInTeam = Array.from(selectedPlayers.values()).some(p => p.id === playerData.id);
        
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

        if (selectedPlayers.has(dropTarget.id)) {
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

        selectedPlayers.set(dropTarget.id, playerData);
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
                const player = selectedPlayers.get(position.id);
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

    async function fetchPlayers() {
        try {
            playersTable.classList.add('loading');
            
            // Fetch both players and fixtures data
            const [playersResponse, fixturesResponse] = await Promise.all([
                fetch('/api/players', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                }),
                fetch('/api/fixtures', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                })
            ]);
            
            if (!playersResponse.ok) {
                throw new Error(`HTTP error! status: ${playersResponse.status}`);
            }
            if (!fixturesResponse.ok) {
                throw new Error(`HTTP error! status: ${fixturesResponse.status}`);
            }
            
            const [playersData, fixturesData] = await Promise.all([
                playersResponse.json(),
                fixturesResponse.json()
            ]);
            
            // Update team mapping from API data
            if (playersData.teams) {
                teamMap = {};
                playersData.teams.forEach(team => {
                    teamMap[team.id] = team.name;
                });
            }
            
            allPlayers = playersData.elements;
            
            // Add team names and next fixture to player data
            allPlayers = allPlayers.map(player => {
                const nextFixture = fixturesData.team_next_fixtures[player.team];
                return {
                    ...player,
                    team_name: teamMap[player.team] || 'Unknown',
                    next_fixture: nextFixture ? nextFixture.formatted_fixture : 'No upcoming fixture'
                };
            });
            
            if (!Array.isArray(allPlayers) || allPlayers.length === 0) {
                console.warn('No players data received');
                return;
            }
            
            // Initialize filtered players with all players
            filteredPlayers = [...allPlayers];
            
            // Display first page
            displayPlayers(filteredPlayers, currentPage);
            console.log('Players fetched successfully:', allPlayers.length);
        } catch (error) {
            console.error('Error fetching players:', error);
        } finally {
            playersTable.classList.remove('loading');
        }
    }

    // Manager and gameweek controls
    const managerIdInput = document.getElementById('managerId');
    const gameweekInput = document.getElementById('gameweek');
    const loadDataBtn = document.getElementById('loadData');
    const loadingSpinner = loadDataBtn.querySelector('.spinner-border');

    async function loadAllData() {
        const managerId = managerIdInput.value.trim();
        const gameweek = parseInt(gameweekInput.value);

        // Validate inputs
        if (!managerId) {
            alert('Please enter a manager ID');
            return;
        }
        if (gameweek < 1 || gameweek > 38) {
            alert('Please enter a valid gameweek number (1-38)');
            return;
        }

        // Show loading state
        loadDataBtn.disabled = true;
        loadingSpinner.classList.remove('d-none');
        const loadingText = loadDataBtn.textContent;
        loadDataBtn.textContent = 'Loading...';

        try {
            // Make sure we have player data first
            if (!allPlayers || allPlayers.length === 0) {
                await fetchPlayers();
            }

            console.log(`Fetching gameweek data for week ${gameweek}...`);
            // Load gameweek data
            const gameweekUrl = `/api/gameweek/${gameweek}?manager_id=${managerId}`;
            console.log('Gameweek URL:', gameweekUrl);
            const gameweekResponse = await fetch(gameweekUrl);
            if (!gameweekResponse.ok) {
                throw new Error(`HTTP error! status: ${gameweekResponse.status} for ${gameweekUrl}`);
            }
            const gameweekData = await gameweekResponse.json();
            console.log('Gameweek data received:', gameweekData);
            
            // Update player stats with gameweek data
            allPlayers = allPlayers.map(player => {
                const playerGameweekData = gameweekData.picks?.find(p => p.element === player.id);
                if (playerGameweekData) {
                    return {
                        ...player,
                        gameweek_points: playerGameweekData.points || 0,
                        is_captain: playerGameweekData.is_captain || false,
                        is_vice_captain: playerGameweekData.is_vice_captain || false,
                        multiplier: playerGameweekData.multiplier || 1,
                        position_number: playerGameweekData.position
                    };
                }
                return {
                    ...player,
                    gameweek_points: 0,
                    is_captain: false,
                    is_vice_captain: false,
                    multiplier: 1,
                    position_number: null
                };
            });

            // Clear existing team
            selectedPlayers.clear();
            document.querySelectorAll('.player-position').forEach(position => {
                const circle = position.querySelector('.player-circle');
                const nameDisplay = position.querySelector('.player-name');
                circle.textContent = '+';
                position.classList.remove('occupied');
                nameDisplay.textContent = '';
            });

            // Load manager's team from gameweek data
            if (gameweekData.picks && Array.isArray(gameweekData.picks)) {
                console.log('Adding players to team from picks:', gameweekData.picks);
                for (const pick of gameweekData.picks) {
                    const player = allPlayers.find(p => p.id === pick.element);
                    if (player) {
                        // Add captain and vice-captain status
                        player.is_captain = pick.is_captain;
                        player.is_vice_captain = pick.is_vice_captain;
                        player.position_number = pick.position;
                        const added = addPlayerToTeam(player);
                        if (!added) {
                            console.warn(`Failed to add player ${player.web_name} to team`);
                        }
                    } else {
                        console.warn(`Player with ID ${pick.element} not found in allPlayers`);
                    }
                }
            } else {
                console.warn('No picks data found in gameweek data:', gameweekData);
            }

            // Refresh displays
            filteredPlayers = [...allPlayers];
            displayPlayers(filteredPlayers, currentPage);
            updateTeamStats();
            updateCurrentTeamTable();

            console.log('All data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data. Please check your inputs and try again.');
        } finally {
            // Reset loading state
            loadDataBtn.disabled = false;
            loadingSpinner.classList.add('d-none');
            loadDataBtn.textContent = loadingText;
        }
    }

    // Event listeners for controls
    loadDataBtn.addEventListener('click', loadAllData);

    // Input validation
    gameweekInput.addEventListener('input', function() {
        let value = parseInt(this.value);
        if (value < 1) this.value = 1;
        if (value > 38) this.value = 38;
    });

    // Initialize drag and drop
    initializeDragAndDrop();
    
    // Initialize player positions
    initializePlayerPositions();
    
    // Initialize search functionality
    initializeSearch();
    
    // Automatically fetch players on page load
    fetchPlayers();

    async function processTeamData(picks, playerData) {
        const startingEleven = [];
        const substitutes = [];
        
        // Sort picks by position number to ensure proper order
        picks.sort((a, b) => a.position - b.position);
        
        // Process each pick to create player objects
        picks.forEach(pick => {
            const playerInfo = playerData[pick.element];
            const player = {
                name: playerInfo.web_name,
                position: positionMap[playerInfo.element_type],
                position_number: pick.position  // Use the position from FPL API
            };
            
            // First 11 players go to starting eleven, rest to substitutes
            if (pick.position <= 11) {
                startingEleven.push(player);
            } else {
                substitutes.push(player);
            }
        });
        
        console.log('Processed starting eleven:', startingEleven);
        console.log('Processed substitutes:', substitutes);
        
        return { startingEleven, substitutes };
    }

    async function fetchAndDisplayTeam(teamId, gameweek) {
        try {
            const picks = await fetchTeamPicks(teamId, gameweek);
            const playerData = await fetchPlayerDetails(picks);
            
            // Process the data into starting eleven and substitutes
            const { startingEleven, substitutes } = await processTeamData(picks, playerData);
            
            // Display the team with the new formation
            displayTeam(startingEleven, substitutes);
            
        } catch (error) {
            console.error('Error fetching team:', error);
        }
    }

    function displayTeam(teamData) {
        const tableBody = document.getElementById('currentTeamTableBody');
        tableBody.innerHTML = '';

        if (!teamData || !teamData.picks) {
            console.error('No team data available');
            return;
        }

        // Sort players by position number
        const picks = teamData.picks.sort((a, b) => a.position - b.position);

        // Track if we've added the substitute divider
        let substitutesDividerAdded = false;

        picks.forEach(pick => {
            const player = allPlayers.find(p => p.id === pick.element);
            if (!player) {
                console.error(`Player not found for element ${pick.element}`);
                return;
            }

            // Add substitute divider before the first substitute
            if (!substitutesDividerAdded && pick.position > 11) {
                const dividerRow = document.createElement('tr');
                dividerRow.className = 'substitute-divider';
                dividerRow.innerHTML = `
                    <td colspan="7" class="substitute-label">
                        <span>Substitutes</span>
                    </td>
                `;
                tableBody.appendChild(dividerRow);
                substitutesDividerAdded = true;
            }

            const row = document.createElement('tr');
            row.className = pick.position > 11 ? 'substitute-player' : 'starting-player';
            
            row.innerHTML = `
                <td>${pick.position}</td>
                <td>${positionMap[player.element_type]}</td>
                <td>${player.web_name}${pick.is_captain ? ' (C)' : ''}${pick.is_vice_captain ? ' (V)' : ''}</td>
                <td>${teamMap[player.team]}</td>
                <td>£${(player.now_cost / 10).toFixed(1)}m</td>
                <td>${player.event_points}</td>
                <td>${player.form}</td>
            `;
            
            tableBody.appendChild(row);
            
            // Also update the player on the pitch
            addPlayerToTeam({
                ...player,
                position_number: pick.position,
                is_captain: pick.is_captain,
                is_vice_captain: pick.is_vice_captain
            });
        });

        updateTeamStats();
    }

    function calculateFormation() {
        const formation = {
            GK: 0,
            DEF: 0,
            MID: 0,
            FWD: 0
        };

        // Get first 11 players based on position_number
        const startingEleven = Array.from(selectedPlayers.values())
            .filter(p => p.position_number >= 1 && p.position_number <= 11)
            .sort((a, b) => a.position_number - b.position_number);

        console.log('Formation calculation - Starting eleven:', startingEleven.map(p => ({
            id: p.id,
            name: p.web_name,
            position: positionMap[p.element_type],
            position_number: p.position_number,
            element_type: p.element_type,
            is_captain: p.is_captain
        })));

        // Count players by position
        startingEleven.forEach(player => {
            const pos = positionMap[player.element_type];
            if (pos) {
                formation[pos]++;
            }
        });

        console.log('Formation counts:', formation);

        // Return formation string (e.g., "3-4-3")
        if (formation.DEF >= 3 && formation.MID >= 3 && formation.FWD >= 1) {
            return `${formation.DEF}-${formation.MID}-${formation.FWD}`;
        }
        return 'Invalid Formation';
    }
});
