let currentPlayer = 'player';
let round = 1;
let playerScore = 0;
let aiScore = 0;
let selected = [];
let dice = [];
let rollsLeft = 3;

// Комбинации из Kingdom Come <button class="citation-flag" data-index="2">
const combinations = [
    { name: 'Стрит', check: d => d.sort().join('') === '123456', value: 1500 },
    { name: 'Фулл-хаус', check: d => {
        const counts = {};
        d.forEach(v => counts[v] = (counts[v] || 0) + 1);
        return Object.values(counts).includes(3) && Object.values(counts).includes(2);
    }, value: 800 },
    { name: 'Три одинаковых', check: d => {
        const counts = {};
        d.forEach(v => counts[v] = (counts[v] || 0) + 1);
        return Object.values(counts).some(v => v >= 3);
    }, value: (d) => {
        const counts = {};
        d.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const triple = Object.keys(counts).find(k => counts[k] >= 3);
        return triple * 100;
    }},
    { name: 'Одиночные', check: d => d.some(v => [1,5].includes(v)), value: (d) => {
        return d.reduce((sum, v) => sum + (v === 1 ? 100 : v === 5 ? 50 : 0), 0);
    }}
];

// Закрыть приветственное окно <button class="citation-flag" data-index="4">
function closeModal() {
    document.getElementById('welcome-modal').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
}

// Переключить правила
function toggleRules() {
    const rules = document.getElementById('rules');
    rules.classList.toggle('hidden');
}

// Бросок костей
function rollDice() {
    if (rollsLeft <= 0) return;
    
    const container = document.getElementById('dice-container');
    container.innerHTML = '';
    selected = [];
    
    for (let i = 0; i < 6; i++) {
        if (!selected[i]) {
            dice[i] = Math.floor(Math.random() * 6) + 1;
        }
    }
    
    renderDice();
    rollsLeft--;
    updateStatus();
}

// Отображение костей
function renderDice() {
    const container = document.getElementById('dice-container');
    dice.forEach((value, index) => {
        const die = document.createElement('div');
        die.className = `dice ${selected[index] ? 'selected' : ''}`;
        die.style.backgroundImage = `url('dice-${value}.png')`;
        die.onclick = () => selectDie(index);
        container.appendChild(die);
    });
}

// Выбор кости
function selectDie(index) {
    if (selected[index]) return;
    selected[index] = true;
    updateStatus();
}

// Подсчёт очков
function calculateScore(dice) {
    for (const combo of combinations) {
        if (combo.check(dice)) {
            return typeof combo.value === 'function' 
                ? combo.value(dice) 
                : combo.value;
        }
    }
    return 0; // Если нет комбинаций
}

// Завершение хода
function endTurn() {
    if (currentPlayer === 'player') {
        const score = calculateScore(dice);
        playerScore += score;
        updateScores();
        alert(`Вы завершили ход с ${score} очками!`);
        switchToAI();
    }
}

// Ход ИИ <button class="citation-flag" data-index="3">
function switchToAI() {
    currentPlayer = 'ai';
    setTimeout(() => {
        // Логика ИИ: выбирает случайные комбинации
        const aiDice = Array.from({length: 6}, () => Math.floor(Math.random() * 6) + 1);
        const aiScore = calculateScore(aiDice);
        alert(`ИИ набрал ${aiScore} очков!`);
        aiScore += aiScore;
        updateScores();
        nextRound();
    }, 1000);
}

// Следующий раунд
function nextRound() {
    round++;
    if (round > 3) {
        endGame();
    } else {
        resetRound();
        alert(`Начинается раунд ${round}!`);
    }
}

// Обновление очков
function updateScores() {
    document.getElementById('player-score').textContent = playerScore;
    document.getElementById('ai-score').textContent = aiScore;
}

// Окончание игры
function endGame() {
    if (playerScore > aiScore) {
        alert('Вы победили!');
    } else if (playerScore < aiScore) {
        alert('ИИ победил!');
    } else {
        alert('Ничья!');
    }
    resetGame();
}
