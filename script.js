document.addEventListener('DOMContentLoaded', function() {
    const playersTable = document.getElementById('playersTable');
    const playersTableBody = document.getElementById('playersTableBody');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const startRangeSpan = document.getElementById('startRange');
    const endRangeSpan = document.getElementById('endRange');
    const totalPlayersSpan = document.getElementById('totalPlayers');
    
    let players = []; // Store players data globally
    let currentSortColumn = ''; // Track current sort column
    let isAscending = true; // Track sort direction
    let selectedPlayers = new Map(); // Track selected players by position
    
    // Team constraints
    const BUDGET_LIMIT = 100.0;
    const MAX_PLAYERS_PER_TEAM = 3;
    const POSITION_LIMITS = {
        'GK': 2,
        'DEF': 5,
        'MID': 5,
        'FWD': 3
    };
    
    // Pagination state
    let currentPage = 1;
    const playersPerPage = 10;
    
    // Position mapping
    const positionMap = {
        1: 'GK',
        2: 'DEF',
        3: 'MID',
        4: 'FWD'
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
            updateTable(players);
        });
    });

    function sortTable(columnName) {
        players.sort((a, b) => {
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
                    bValue = parseFloat(b.form);
                    break;
                case 'selected by':
                    aValue = parseFloat(a.selected_by_percent);
                    bValue = parseFloat(b.selected_by_percent);
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

    function updateTable(playersData) {
        playersTableBody.innerHTML = '';
        
        // Calculate pagination values
        const start = (currentPage - 1) * playersPerPage;
        const end = start + playersPerPage;
        const pageData = playersData.slice(start, end);
        
        // Update pagination info
        startRangeSpan.textContent = start + 1;
        endRangeSpan.textContent = Math.min(end, playersData.length);
        totalPlayersSpan.textContent = playersData.length;
        
        // Update pagination buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = end >= playersData.length;
        
        // Render table rows for current page
        pageData.forEach(player => {
            const row = document.createElement('tr');
            row.draggable = true;
            row.dataset.playerId = player.id;
            row.dataset.playerData = JSON.stringify(player);
            
            const pointsPerMillion = (player.total_points / player.price).toFixed(1);
            
            row.innerHTML = `
                <td>${createActionButton(player.id)}</td>
                <td>${player.first_name} ${player.second_name}</td>
                <td>${player.team}</td>
                <td>${positionMap[player.element_type]}</td>
                <td>£${player.price}m</td>
                <td>${player.total_points}</td>
                <td>${player.form}</td>
                <td>${player.selected_by_percent}%</td>
                <td>${player.minutes}</td>
                <td>${player.goals_scored}</td>
                <td>${player.assists}</td>
                <td>${player.clean_sheets}</td>
                <td>${player.goals_conceded}</td>
                <td>${player.yellow_cards}</td>
                <td>${player.red_cards}</td>
                <td>${pointsPerMillion}</td>
            `;
            
            // Add click handler for the action button
            const actionBtn = row.querySelector('.action-btn');
            actionBtn.addEventListener('click', () => {
                const playerData = JSON.parse(row.dataset.playerData);
                addPlayerToTeam(playerData);
            });
            
            playersTableBody.appendChild(row);
        });
        
        // Update action buttons state
        updateActionButtons();
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
        // First validate the selection
        if (!validateTeamSelection(playerData)) {
            return false;
        }

        const positionType = positionMap[playerData.element_type];
        const nextPosition = findNextAvailablePosition(positionType);
        
        if (!nextPosition) {
            alert(`No available ${positionType} positions in the team!`);
            return false;
        }

        // Get position number from the circle's ID
        const positionNumber = nextPosition.id;
        
        // Update the circle
        const circle = nextPosition.querySelector('.player-circle');
        const nameDisplay = nextPosition.querySelector('.player-name');
        
        circle.textContent = playerData.first_name[0] + playerData.second_name[0];
        nextPosition.classList.add('occupied');
        nameDisplay.textContent = `${playerData.first_name} ${playerData.second_name}`;
        
        // Store the player data
        selectedPlayers.set(positionNumber, playerData);
        
        // Update action buttons and stats
        updateActionButtons();
        updateTeamStats();
        
        return true;
    }

    function removePlayerFromTeam(playerData) {
        // Find and remove the player
        let removed = false;
        selectedPlayers.forEach((player, positionId) => {
            if (player.id === playerData.id) {
                // Clear the position
                const position = document.getElementById(positionId);
                const circle = position.querySelector('.player-circle');
                const nameDisplay = position.querySelector('.player-name');
                
                circle.textContent = '+';
                position.classList.remove('occupied');
                nameDisplay.textContent = '';
                
                // Remove from selected players
                selectedPlayers.delete(positionId);
                removed = true;
            }
        });
        
        if (removed) {
            updateActionButtons();
            updateTeamStats();
        }
        
        return removed;
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
        const stats = calculateTeamStats();
        
        // Update team value
        document.getElementById('teamValue').textContent = `£${stats.totalValue.toFixed(1)}m`;
        
        // Update position counts
        document.getElementById('gkCount').textContent = `${stats.positionCounts.GK}/2 GK`;
        document.getElementById('defCount').textContent = `${stats.positionCounts.DEF}/5 DEF`;
        document.getElementById('midCount').textContent = `${stats.positionCounts.MID}/5 MID`;
        document.getElementById('fwdCount').textContent = `${stats.positionCounts.FWD}/3 FWD`;
        
        // Update stat colors based on limits
        const valueElement = document.getElementById('teamValue');
        valueElement.style.backgroundColor = stats.totalValue > BUDGET_LIMIT ? 'rgba(220, 53, 69, 0.2)' : 'rgba(76, 175, 80, 0.2)';
        
        Object.entries(stats.positionCounts).forEach(([position, count]) => {
            const element = document.getElementById(`${position.toLowerCase()}Count`);
            if (element) {
                element.style.backgroundColor = count > POSITION_LIMITS[position] ? 'rgba(220, 53, 69, 0.2)' : 'rgba(76, 175, 80, 0.2)';
            }
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
        const playerData = players[e.target.dataset.index];
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
            playerNameElement.textContent = playerData.second_name;
            playerNameElement.classList.add('visible');
        }

        selectedPlayers.set(dropTarget.id, playerData);
        updateActionButtons();
        updateTeamStats();

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

    // Pagination event listeners
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable(players);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(players.length / playersPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            updateTable(players);
        }
    });

    async function fetchPlayers() {
        try {
            playersTable.classList.add('loading');
            const response = await fetch('http://localhost:8000/api/players', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            players = await response.json();
            
            if (!Array.isArray(players) || players.length === 0) {
                throw new Error('No players data received');
            }
            
            updateTable(players);
            console.log('Players fetched successfully:', players.length);
        } catch (error) {
            console.error('Error fetching players:', error);
            alert('Error fetching players. Please try again.');
        } finally {
            playersTable.classList.remove('loading');
        }
    }

    // Initialize drag and drop
    initializeDragAndDrop();
    
    // Initialize player positions
    initializePlayerPositions();
    
    // Automatically fetch players on page load
    fetchPlayers();
});
