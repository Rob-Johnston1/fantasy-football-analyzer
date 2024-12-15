document.addEventListener('DOMContentLoaded', function() {
    const fetchButton = document.getElementById('fetchPlayers');
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
            const columnIndex = headerCell.cellIndex;
            const columnName = headerCell.textContent.toLowerCase();
            
            // Toggle sort direction if clicking the same column
            if (currentSortColumn === columnName) {
                isAscending = !isAscending;
            } else {
                currentSortColumn = columnName;
                isAscending = true;
            }

            // Remove sort indicators from all headers
            document.querySelectorAll('#playersTable th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });

            // Add sort indicator to current header
            headerCell.classList.add(isAscending ? 'sort-asc' : 'sort-desc');

            sortTable(columnIndex, columnName);
        });
    });

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

    function addPlayerToTeam(playerData) {
        const positionType = positionMap[playerData.element_type];
        const nextPosition = findNextAvailablePosition(positionType);
        
        if (!nextPosition) {
            alert(`No available ${positionType} positions in the team!`);
            return false;
        }

        // Get position number from the circle's ID
        const positionNumber = nextPosition.id.replace('position', '');

        // Update the player circle with player info
        const playerCircle = nextPosition.querySelector('.player-circle');
        playerCircle.innerHTML = positionNumber;
        playerCircle.classList.add('occupied');

        // Add player name below the circle
        const playerNameElement = nextPosition.querySelector('.player-name');
        if (playerNameElement) {
            playerNameElement.textContent = playerData.second_name;
            playerNameElement.classList.add('visible');
        }

        // Store the selected player
        selectedPlayers.set(nextPosition.id, playerData);
        
        // Update the add/remove button state
        updateActionButtons();
        return true;
    }

    function removePlayerFromTeam(playerData) {
        // Find the position containing this player
        for (let [positionId, player] of selectedPlayers) {
            if (player.id === playerData.id) {
                const position = document.getElementById(positionId);
                const playerCircle = position.querySelector('.player-circle');
                const playerNameElement = position.querySelector('.player-name');
                
                // Reset the circle to its original state
                playerCircle.innerHTML = '+';
                playerCircle.classList.remove('occupied');
                
                // Clear and hide the player name
                if (playerNameElement) {
                    playerNameElement.textContent = '';
                    playerNameElement.classList.remove('visible');
                }
                
                // Remove from selected players
                selectedPlayers.delete(positionId);
                
                // Update the add/remove button state
                updateActionButtons();
                return true;
            }
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

        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    }

    function sortTable(columnIndex, columnName) {
        const sortedPlayers = [...players].sort((a, b) => {
            let aValue, bValue;

            // Define how to get values based on column name
            switch(columnName) {
                case 'id':
                    return compareValues(a.id, b.id);
                case 'name':
                    aValue = `${a.first_name} ${a.second_name}`;
                    bValue = `${b.first_name} ${b.second_name}`;
                    return compareValues(aValue, bValue);
                case 'team':
                    return compareValues(a.team, b.team);
                case 'position':
                    return compareValues(a.element_type, b.element_type);
                case 'price':
                    return compareValues(a.price, b.price);
                case 'total points':
                    return compareValues(a.total_points, b.total_points);
                case 'points per £1m':
                    aValue = (a.total_points / a.price).toFixed(2);
                    bValue = (b.total_points / b.price).toFixed(2);
                    return compareValues(parseFloat(aValue), parseFloat(bValue));
                case 'form':
                    return compareValues(parseFloat(a.form), parseFloat(b.form));
                case 'selected by':
                    return compareValues(parseFloat(a.selected_by_percent), parseFloat(b.selected_by_percent));
                case 'minutes':
                    return compareValues(a.minutes, b.minutes);
                case 'goals':
                    return compareValues(a.goals_scored, b.goals_scored);
                case 'assists':
                    return compareValues(a.assists, b.assists);
                case 'clean sheets':
                    return compareValues(a.clean_sheets, b.clean_sheets);
                case 'goals conceded':
                    return compareValues(a.goals_conceded, b.goals_conceded);
                case 'yellow cards':
                    return compareValues(a.yellow_cards, b.yellow_cards);
                case 'red cards':
                    return compareValues(a.red_cards, b.red_cards);
                default:
                    return 0;
            }
        });

        // Reverse if descending order
        if (!isAscending) {
            sortedPlayers.reverse();
        }

        // Update the table with sorted data
        updateTable(sortedPlayers);
    }

    function compareValues(a, b) {
        if (a === b) return 0;
        return a < b ? -1 : 1;
    }

    function updateTable(playersData) {
        playersTableBody.innerHTML = '';
        
        const startIndex = (currentPage - 1) * playersPerPage;
        const endIndex = Math.min(startIndex + playersPerPage, playersData.length);
        const displayedPlayers = playersData.slice(startIndex, endIndex);
        
        displayedPlayers.forEach((player, index) => {
            const row = document.createElement('tr');
            row.dataset.index = startIndex + index;
            
            const price = player.price;
            const pointsPerMillion = (player.total_points / price).toFixed(1);
            
            const actionButtonHtml = createActionButton(player.id);
            
            row.innerHTML = `
                <td>${actionButtonHtml}</td>
                <td>${player.id}</td>
                <td>${player.first_name} ${player.second_name}</td>
                <td>${player.team}</td>
                <td>${positionMap[player.element_type]}</td>
                <td>£${price.toFixed(1)}m</td>
                <td>${player.total_points}</td>
                <td>${pointsPerMillion}</td>
                <td>${player.form}</td>
                <td>${player.selected_by_percent}%</td>
                <td>${player.minutes}</td>
                <td>${player.goals_scored}</td>
                <td>${player.assists}</td>
                <td>${player.clean_sheets}</td>
                <td>${player.goals_conceded}</td>
                <td>${player.yellow_cards}</td>
                <td>${player.red_cards}</td>
            `;
            
            playersTableBody.appendChild(row);

            // Add click handler for the action button
            const actionBtn = row.querySelector('.action-btn');
            if (actionBtn) {
                actionBtn.addEventListener('click', (e) => handleActionClick(e, player));
            }
        });

        // Update pagination info
        startRangeSpan.textContent = startIndex + 1;
        endRangeSpan.textContent = endIndex;
        totalPlayersSpan.textContent = playersData.length;
        currentPageSpan.textContent = `Page ${currentPage}`;
        
        // Update pagination buttons
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = endIndex >= playersData.length;
        
        initializeDragAndDrop();
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
            
            const response = await fetch('http://localhost:8000/api/players');
            players = await response.json();
            
            updateTable(players);
        } catch (error) {
            console.error('Error fetching players:', error);
            alert('Error fetching players. Please try again.');
        } finally {
            playersTable.classList.remove('loading');
        }
    }

    // Fetch players automatically on page load
    fetchPlayers();

    // Keep the button for manual refresh
    fetchButton.addEventListener('click', fetchPlayers);
});
