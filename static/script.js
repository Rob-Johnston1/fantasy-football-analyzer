document.addEventListener('DOMContentLoaded', function() {
    const fetchButton = document.getElementById('fetchPlayers');
    const playersTable = document.getElementById('playersTable');
    const playersTableBody = document.getElementById('playersTableBody');
    let players = []; // Store players data globally
    let currentSortColumn = ''; // Track current sort column
    let isAscending = true; // Track sort direction

    // Add click handlers to all table headers
    document.querySelectorAll('#playersTable th').forEach(headerCell => {
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
                    return compareValues(a.now_cost, b.now_cost);
                case 'total points':
                    return compareValues(a.total_points, b.total_points);
                case 'points per £1m':
                    aValue = (a.total_points / (a.now_cost / 10)).toFixed(2);
                    bValue = (b.total_points / (b.now_cost / 10)).toFixed(2);
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
        playersData.forEach(player => {
            const price = player.now_cost / 10;
            const pointsPerMillion = (player.total_points / price).toFixed(2);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.id}</td>
                <td>${player.first_name} ${player.second_name}</td>
                <td>${player.team}</td>
                <td>${player.element_type}</td>
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
        });
    }

    fetchButton.addEventListener('click', async function() {
        try {
            // Add loading state
            fetchButton.disabled = true;
            playersTable.classList.add('loading');
            
            // Fetch players data from the API
            const response = await fetch('/api/players');
            players = await response.json(); // Store in global variable
            
            // Update table with fetched data
            updateTable(players);
        } catch (error) {
            console.error('Error fetching players:', error);
            alert('Error fetching players. Please try again.');
        } finally {
            // Remove loading state
            fetchButton.disabled = false;
            playersTable.classList.remove('loading');
        }
    });
});
