const wordCategories = {
    computerScience: [
        'ALGORITHM', 'COMPUTER', 'DATABASE', 'DEBUGGING', 'DEVELOPER',
        'INTERFACE', 'JAVASCRIPT', 'NETWORK', 'PROGRAMMING', 'SECURITY',
        'SOFTWARE', 'TESTING', 'VARIABLE', 'FUNCTION', 'BROWSER'
    ],
    fruits: [
        'APPLE', 'BANANA', 'ORANGE', 'MANGO', 'GRAPE',
        'PAPAYA', 'CHERRY', 'LEMON', 'PEACH', 'PLUM',
        'KIWI', 'MELON', 'PEAR', 'BERRY', 'LIME'
    ],
    mixed: [
        'HELLO', 'WORLD', 'SMILE', 'HAPPY', 'SUNNY',
        'BEACH', 'MUSIC', 'DANCE', 'PAINT', 'BOOK',
        'LEARN', 'DREAM', 'PEACE', 'LOVE', 'HOPE'
    ]
};

let wordDatabase = [...wordCategories.mixed];
let currentCategory = 'mixed';

const WORDS_PER_GAME = 5;
let words = [];
const gridSize = 12;
const directions = [
    [-1, -1], [-1, 0], [-1, 1],  // diagonal up, up, diagonal up
    [0, -1],           [0, 1],    // left, right
    [1, -1],  [1, 0],  [1, 1]     // diagonal down, down, diagonal down
];

let grid = [];
let selectedCells = [];
let foundWords = new Set();
let timer;
let seconds = 0;
let hintUsed = false;

function saveCustomWords(words) {
    localStorage.setItem('customWords', JSON.stringify(words));
}

function loadCustomWords() {
    const saved = localStorage.getItem('customWords');
    return saved ? JSON.parse(saved) : [];
}

function changeCategory(category) {
    currentCategory = category;
    if (category === 'custom') {
        wordDatabase = loadCustomWords();
    } else {
        wordDatabase = [...wordCategories[category]];
    }
}

// Initialize words for this game
function initializeGameWords() {
    if (wordDatabase.length <= WORDS_PER_GAME) {
        words = [...wordDatabase];
    } else {
        // Randomly select WORDS_PER_GAME words from the database
        const shuffled = [...wordDatabase].sort(() => 0.5 - Math.random());
        words = shuffled.slice(0, WORDS_PER_GAME);
    }
}

// Initialize the grid with random letters
function initializeGrid() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));

    // Place words in the grid
    words.forEach(word => {
        let placed = false;
        while (!placed) {
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const startX = Math.floor(Math.random() * gridSize);
            const startY = Math.floor(Math.random() * gridSize);

            if (canPlaceWord(word, startX, startY, direction)) {
                placeWord(word, startX, startY, direction);
                placed = true;
            }
        }
    });

    // Fill remaining empty cells with random letters
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j] === '') {
                grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
}

function canPlaceWord(word, startX, startY, direction) {
    const endX = startX + direction[0] * (word.length - 1);
    const endY = startY + direction[1] * (word.length - 1);

    if (endX < 0 || endX >= gridSize || endY < 0 || endY >= gridSize) {
        return false;
    }

    for (let i = 0; i < word.length; i++) {
        const currentX = startX + direction[0] * i;
        const currentY = startY + direction[1] * i;
        if (grid[currentX][currentY] !== '' && grid[currentX][currentY] !== word[i]) {
            return false;
        }
    }

    return true;
}

function placeWord(word, startX, startY, direction) {
    for (let i = 0; i < word.length; i++) {
        const currentX = startX + direction[0] * i;
        const currentY = startY + direction[1] * i;
        grid[currentX][currentY] = word[i];
    }
}

function createGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 40px)`;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = grid[i][j];
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            // Add both mouse and touch events
            cell.addEventListener('mousedown', startSelection);
            cell.addEventListener('mouseover', updateSelection);
            cell.addEventListener('touchstart', handleTouchStart);
            cell.addEventListener('touchmove', handleTouchMove);
            gridElement.appendChild(cell);
        }
    }

    document.addEventListener('mouseup', endSelection);
    document.addEventListener('touchend', endSelection);
}

function createWordBank() {
    const wordBank = document.getElementById('word-bank');
    words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word';
        wordElement.textContent = word;
        wordBank.appendChild(wordElement);
    });
}

function startSelection(e) {
    if (e.target.classList.contains('cell')) {
        selectedCells = [e.target];
        e.target.classList.add('selected');
    }
}

function updateSelection(e) {
    if (selectedCells.length === 0 || !e.target.classList.contains('cell')) return;

    const firstCell = selectedCells[0];
    const currentCell = e.target;
    
    // Calculate direction
    const deltaRow = currentCell.dataset.row - firstCell.dataset.row;
    const deltaCol = currentCell.dataset.col - firstCell.dataset.col;
    
    // Only allow straight lines (horizontal, vertical, or diagonal)
    if (Math.abs(deltaRow) === Math.abs(deltaCol) || deltaRow === 0 || deltaCol === 0) {
        // Clear previous selection except first cell
        document.querySelectorAll('.cell.selected').forEach(cell => {
            if (cell !== firstCell) {
                cell.classList.remove('selected');
            }
        });
        
        // Reset selection to only include first cell
        selectedCells = [firstCell];
        
        // Calculate steps for each direction
        const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
        const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);
        
        // Calculate number of steps needed
        const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
        
        // Add cells to selection
        for (let i = 1; i <= steps; i++) {
            const row = parseInt(firstCell.dataset.row) + (stepRow * i);
            const col = parseInt(firstCell.dataset.col) + (stepCol * i);
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('selected');
                selectedCells.push(cell);
            }
        }
    }
}

function endSelection() {
    if (selectedCells.length === 0) return;

    const word = selectedCells.map(cell => cell.textContent).join('');
    const reverseWord = word.split('').reverse().join('');

    if (words.includes(word) && !foundWords.has(word)) {
        foundWords.add(word);
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('highlighted');
        });
        document.querySelector(`.word:not(.found)`).classList.remove('found');
        // Find and highlight the correct word in the word bank
        const wordBankItem = Array.from(document.querySelectorAll('.word'))
            .find(el => el.textContent === word);
        if (wordBankItem) wordBankItem.classList.add('found');
    } else if (words.includes(reverseWord) && !foundWords.has(reverseWord)) {
        foundWords.add(reverseWord);
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('highlighted');
        });
        document.querySelector(`.word:not(.found)`).classList.remove('found');
        // Find and highlight the correct word in the word bank
        const wordBankItem = Array.from(document.querySelectorAll('.word'))
            .find(el => el.textContent === reverseWord);
        if (wordBankItem) wordBankItem.classList.add('found');
    }

    selectedCells.forEach(cell => cell.classList.remove('selected'));
    selectedCells = [];

    if (foundWords.size === words.length) {
        stopTimer();
        showCongratulations();
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('cell')) {
        startSelection({ target });
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('cell')) {
        updateSelection({ target });
    }
}

function startTimer() {
    timer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        document.getElementById('timer').textContent = 
            `Time: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}

function showHint() {
    if (hintUsed) return;
    
    // Find a random word that hasn't been found yet
    const remainingWords = words.filter(word => !foundWords.has(word));
    if (remainingWords.length === 0) return;
    
    const wordToHint = remainingWords[Math.floor(Math.random() * remainingWords.length)];
    
    // Find this word in the grid
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            for (let direction of directions) {
                if (checkWordAtPosition(wordToHint, i, j, direction)) {
                    // Temporarily highlight the word
                    const cells = [];
                    for (let k = 0; k < wordToHint.length; k++) {
                        const cell = document.querySelector(
                            `.cell[data-row="${i + direction[0] * k}"][data-col="${j + direction[1] * k}"]`
                        );
                        cells.push(cell);
                        cell.style.backgroundColor = '#ffeb3b';
                    }
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        cells.forEach(cell => {
                            if (!cell.classList.contains('highlighted')) {
                                cell.style.backgroundColor = '';
                            }
                        });
                    }, 2000);
                    
                    hintUsed = true;
                    document.getElementById('hint-btn').disabled = true;
                    return;
                }
            }
        }
    }
}

function checkWordAtPosition(word, row, col, direction) {
    const endX = row + direction[0] * (word.length - 1);
    const endY = col + direction[1] * (word.length - 1);
    
    if (endX < 0 || endX >= gridSize || endY < 0 || endY >= gridSize) {
        return false;
    }
    
    for (let i = 0; i < word.length; i++) {
        const currentX = row + direction[0] * i;
        const currentY = col + direction[1] * i;
        if (grid[currentX][currentY] !== word[i]) {
            return false;
        }
    }
    
    return true;
}

function giveUp() {
    if (!confirm('Are you sure you want to give up?')) return;
    
    stopTimer();
    
    // Find and highlight all remaining words
    words.forEach(word => {
        if (!foundWords.has(word)) {
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    for (let direction of directions) {
                        if (checkWordAtPosition(word, i, j, direction)) {
                            for (let k = 0; k < word.length; k++) {
                                const cell = document.querySelector(
                                    `.cell[data-row="${i + direction[0] * k}"][data-col="${j + direction[1] * k}"]`
                                );
                                cell.classList.add('highlighted');
                            }
                            // Find and highlight the correct word in the word bank
                            const wordBankItem = Array.from(document.querySelectorAll('.word'))
                                .find(el => el.textContent === word);
                            if (wordBankItem) wordBankItem.classList.add('found');
                            foundWords.add(word);
                            break;
                        }
                    }
                }
            }
        }
    });
}

function initializeNewGame() {
    // Clear previous game state
    foundWords.clear();
    seconds = 0;
    hintUsed = false;
    document.getElementById('hint-btn').disabled = false;
    
    // Clear previous grid and word bank
    document.getElementById('grid').innerHTML = '';
    document.getElementById('word-bank').innerHTML = '';
    
    // Initialize new game
    initializeGameWords();
    initializeGrid();
    createGrid();
    createWordBank();
    
    // Reset and start timer
    stopTimer();
    startTimer();
}

function setupSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Game Settings</h2>
            <div class="setting-group">
                <label for="category-select">Select Word Category:</label>
                <select id="category-select">
                    <option value="mixed">Mixed Words</option>
                    <option value="computerScience">Computer Science</option>
                    <option value="fruits">Fruits</option>
                    <option value="custom">Custom Words</option>
                </select>
            </div>
            <div class="setting-group">
                <label for="custom-words-input">Custom Words (Enter at least 5 words, one per line):</label>
                <textarea id="custom-words-input" placeholder="Enter custom words here..."></textarea>
                <div class="error-message" id="custom-words-error">Please enter at least 5 words</div>
            </div>
            <button id="save-settings">Save & Start New Game</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Load saved custom words if any
    const customWords = loadCustomWords();
    if (customWords.length > 0) {
        document.getElementById('custom-words-input').value = customWords.join('\n');
    }

    // Event listeners for modal
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => modal.style.display = 'none';

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    const saveBtn = document.getElementById('save-settings');
    saveBtn.onclick = () => {
        const category = document.getElementById('category-select').value;
        const customWordsInput = document.getElementById('custom-words-input').value;
        
        if (category === 'custom') {
            const customWords = customWordsInput.toUpperCase().split('\n')
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            if (customWords.length < 5) {
                document.getElementById('custom-words-error').style.display = 'block';
                return;
            }
            
            saveCustomWords(customWords);
            wordDatabase = customWords;
        }
        
        changeCategory(category);
        initializeNewGame();
        modal.style.display = 'none';
    };

    return modal;
}

const gameContainer = document.getElementById('game-container');
const startPage = document.getElementById('start-page');
const startGameBtn = document.getElementById('start-game-btn');
const settingsBtn = document.getElementById('settings-btn');
const inGameSettingsBtn = document.getElementById('in-game-settings-btn');

// Move settings button event listener
const settingsModal = setupSettingsModal();
settingsBtn.onclick = () => settingsModal.style.display = 'block';
inGameSettingsBtn.onclick = () => settingsModal.style.display = 'block';

startGameBtn.addEventListener('click', () => {
    startPage.style.display = 'none';
    gameContainer.style.display = 'block';
    initializeNewGame();
});

// Don't auto-initialize the game anymore
// Instead, just set up the initial word database
wordDatabase = [...wordCategories.mixed];

document.getElementById('hint-btn').addEventListener('click', showHint);
document.getElementById('give-up-btn').addEventListener('click', giveUp);
document.getElementById('start-new-btn').addEventListener('click', () => {
    if (confirm('Start a new game with the current category?')) {
        initializeNewGame();
    }
});

function showCongratulations() {
    const now = new Date();
    const timeFormatted = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    const dateFormatted = now.toLocaleDateString();
    const timeOfDay = now.toLocaleTimeString();

    const modal = document.createElement('div');
    modal.className = 'congrats-modal';
    modal.innerHTML = `
        <div class="congrats-content">
            <h2>🎉 Congratulations! 🎉</h2>
            <p>You've found all the words!</p>
            <div class="stats">
                <p>Time taken: ${timeFormatted}</p>
                <p>Completed on: ${dateFormatted}</p>
                <p>Time of day: ${timeOfDay}</p>
            </div>
            <button class="continue-btn" onclick="startNewGame()">Play Again</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function startNewGame() {
    const modal = document.querySelector('.congrats-modal');
    if (modal) {
        modal.remove();
    }
    initializeNewGame();
}