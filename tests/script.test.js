/**
 * @jest-environment jsdom
 */

const {
    getPositionType,
    getPositionName,
    calculateFormation,
    updateTeamStats,
    updatePitchDisplay,
} = require('../script.js');

describe('Fantasy Football Analyzer Tests', () => {
    let originalDocument;

    beforeEach(() => {
        // Save original document
        originalDocument = document.documentElement.innerHTML;
        
        // Load the HTML template
        document.documentElement.innerHTML = `
            <div id="formationDisplay"></div>
            <div id="gkCount"></div>
            <div id="defCount"></div>
            <div id="midCount"></div>
            <div id="fwdCount"></div>
            <div id="teamValue"></div>
            <div class="formation-grid">
                <!-- Starting positions -->
                <div class="player-position" id="position1" data-position="GK">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position2" data-position="DEF">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position3" data-position="DEF">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position4" data-position="DEF">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position5" data-position="DEF">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position6" data-position="MID">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position7" data-position="MID">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position8" data-position="MID">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position9" data-position="MID">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position10" data-position="FWD">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position" id="position11" data-position="FWD">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>

                <!-- Substitute positions -->
                <div class="player-position substitute" id="position12" data-position="GK">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position substitute" id="position13" data-position="DEF">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position substitute" id="position14" data-position="MID">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
                <div class="player-position substitute" id="position15" data-position="FWD">
                    <div class="player-circle">+</div>
                    <div class="player-name"></div>
                    <div class="player-points"></div>
                    <div class="player-form"></div>
                </div>
            </div>
            <button id="analyzeButton" disabled>Analyze Team</button>
        `;
    });

    afterEach(() => {
        // Restore original document
        document.documentElement.innerHTML = originalDocument;
        // Reset selected players
        window.selectedPlayers = [];
    });

    describe('Position Management', () => {
        test('should correctly identify player position type', () => {
            expect(getPositionType(1)).toBe('GK');
            expect(getPositionType(2)).toBe('DEF');
            expect(getPositionType(3)).toBe('MID');
            expect(getPositionType(4)).toBe('FWD');
        });

        test('should correctly identify position name', () => {
            expect(getPositionName(1)).toBe('Goalkeeper');
            expect(getPositionName(2)).toBe('Defender');
            expect(getPositionName(3)).toBe('Midfielder');
            expect(getPositionName(4)).toBe('Forward');
        });
    });

    describe('Team Formation', () => {
        test('should calculate valid formation with 11 players', () => {
            // Mock selected players
            window.selectedPlayers = [
                { element_type: 1, is_sub: false }, // GK
                { element_type: 2, is_sub: false }, // DEF
                { element_type: 2, is_sub: false }, // DEF
                { element_type: 2, is_sub: false }, // DEF
                { element_type: 2, is_sub: false }, // DEF
                { element_type: 3, is_sub: false }, // MID
                { element_type: 3, is_sub: false }, // MID
                { element_type: 3, is_sub: false }, // MID
                { element_type: 3, is_sub: false }, // MID
                { element_type: 4, is_sub: false }, // FWD
                { element_type: 4, is_sub: false }, // FWD
            ];

            expect(calculateFormation()).toBe('4-4-2');
        });
    });

    describe('Analyze Button State', () => {
        test('should enable analyze button with valid team', () => {
            // Mock selected players with valid 11-player team
            window.selectedPlayers = [
                { element_type: 1, is_sub: false, position_number: 1 }, // GK
                { element_type: 2, is_sub: false, position_number: 2 }, // DEF
                { element_type: 2, is_sub: false, position_number: 3 }, // DEF
                { element_type: 2, is_sub: false, position_number: 4 }, // DEF
                { element_type: 2, is_sub: false, position_number: 5 }, // DEF
                { element_type: 3, is_sub: false, position_number: 6 }, // MID
                { element_type: 3, is_sub: false, position_number: 7 }, // MID
                { element_type: 3, is_sub: false, position_number: 8 }, // MID
                { element_type: 3, is_sub: false, position_number: 9 }, // MID
                { element_type: 4, is_sub: false, position_number: 10 }, // FWD
                { element_type: 4, is_sub: false, position_number: 11 }, // FWD
            ];

            updateTeamStats();
            const analyzeButton = document.getElementById('analyzeButton');
            expect(analyzeButton.disabled).toBe(false);
        });

        test('should disable analyze button with invalid team', () => {
            // Mock selected players with invalid team (10 players)
            window.selectedPlayers = [
                { element_type: 1, is_sub: false, position_number: 1 }, // GK
                { element_type: 2, is_sub: false, position_number: 2 }, // DEF
                { element_type: 2, is_sub: false, position_number: 3 }, // DEF
                { element_type: 2, is_sub: false, position_number: 4 }, // DEF
                { element_type: 3, is_sub: false, position_number: 6 }, // MID
                { element_type: 3, is_sub: false, position_number: 7 }, // MID
                { element_type: 3, is_sub: false, position_number: 8 }, // MID
                { element_type: 3, is_sub: false, position_number: 9 }, // MID
                { element_type: 4, is_sub: false, position_number: 10 }, // FWD
                { element_type: 4, is_sub: false, position_number: 11 }, // FWD
            ];

            updateTeamStats();
            const analyzeButton = document.getElementById('analyzeButton');
            expect(analyzeButton.disabled).toBe(true);
        });
    });

    describe('Player Display', () => {
        test('should correctly display player in position', () => {
            const player = {
                id: 1,
                web_name: 'Test',
                element_type: 1,
                is_sub: false,
                position_number: 1,
                total_points: 50,
                gameweek_points: 5,
                form: '6.5'
            };

            window.selectedPlayers = [player];
            updatePitchDisplay();

            const position = document.querySelector('#position1');
            expect(position.classList.contains('occupied')).toBe(true);
            expect(position.querySelector('.player-name').textContent).toBe('Test');
            expect(position.querySelector('.player-points').textContent).toBe('50 (5)');
            expect(position.querySelector('.player-form').textContent).toBe('6.5');
        });

        test('should handle substitutes correctly', () => {
            const sub = {
                id: 1,
                web_name: 'SubTest',
                element_type: 2,
                is_sub: true,
                position_number: 12,
                total_points: 30,
                gameweek_points: 2,
                form: '4.5'
            };

            window.selectedPlayers = [sub];
            updatePitchDisplay();

            const position = document.querySelector('#position12');
            expect(position.classList.contains('occupied')).toBe(true);
            expect(position.querySelector('.player-name').textContent).toBe('SubTest');
        });
    });
});
