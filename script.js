// Инициализация переменных
let currentPlayer = 'player';
let round = 1;
let playerScore = 0;
let aiScore = 0;
let rollsLeft = 3;
let selected = [];
let playerDice = [];
let aiDice = [];

// Комбинации с расширенной логикой <button class="citation-flag" data-index="2">
const combinations = [
    { 
        name: 'Пять одинаковых', 
        check: d => hasCount(d, 5), 
        value: 2000 
    },
    { 
        name: 'Четыре одинаковых', 
        check: d => hasCount(d, 4), 
        value: 1000 
    },
    { 
        name: 'Фулл-хаус', 
        check: d => hasCount(d, 3) && hasCount(d, 2), 
        value: 800 
    },
    { 
        name: 'Стрит', 
        check: d => d.sort().join('') === '123456', 
        value: 1500 
    },
    { 
        name: 'Три одинаковых', 
        check: d => hasCount(d, 3), 
        value: (d) => getMostFrequent(d) * 100 
    },
    { 
        name: 'Одиночные', 
        check: d => d.some(v => [1,5].includes(v)), 
        value: (d) => d.reduce((sum, v) => sum + (v === 1 ? 100 : v === 5 ? 50 : 0), 0)
    }
];

// Функция для проверки количества одинаковых костей
function hasCount(dice, count) {
    const freq = {};
    dice.forEach(v => freq[v] = (freq[v] || 0) + 1);
    return Object.values(freq).some(v => v >= count);
}

// Функция для получения наиболее частого значения
function getMostFrequent(dice) {
    const freq = {};
    dice.forEach(v => freq[v] = (freq[v] || 0) + 1);
    return parseInt(Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b));
}

// Начало игры (связано с кнопкой "Начать игру")
function startGame() {
    document.getElementById('welcome-modal').classList.add('hidden'); // Скрываем приветствие
    document.getElementById('game').classList.remove('hidden'); // Показываем игру
    document.getElementById('game').classList.add('active'); // Включаем анимацию
    resetRound(); // Сбрасываем раунд
}

// Сброс раунда
function resetRound() {
    rollsLeft = 3;
    selected = Array(6).fill(false);
    playerDice = [];
    aiDice = [];
    updateStatus();
}

// Бросок костей
function rollDice() {
    if (rollsLeft <= 0) return;

    const container = document.getElementById('player-dice');
    container.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        if (!selected[i]) {
            playerDice[i] = Math.floor(Math.random() * 6) + 1;
        }
    }

    renderDice('player');
    rollsLeft--;
    updateStatus();

    if (rollsLeft === 0) {
        endTurn();
    }
}

// Отображение костей
function renderDice(target) {
    const container = document.getElementById(`${target}-dice`);
    container.innerHTML = '';
    
    const dice = target === 'player' ? playerDice : aiDice;
    
    dice.forEach((value, index) => {
        const die = document.createElement('div');
        die.className = 'dice';
        die.style.backgroundImage = `url('dice-${value}.png')`;
        
        if (target === 'player') {
            die.onclick = () => selectDie(index);
        }
        
        container.appendChild(die);
    });
}

// Выбор кости
function selectDie(index) {
    if (rollsLeft === 3) return; // Нельзя выбирать до первого броска
    
    selected[index] = !selected[index];
    renderDice('player');
}

// Завершение хода
function endTurn() {
    // Подсчёт очков игрока
    const playerCombo = getBestCombination(playerDice);
    playerScore += playerCombo.value;
    updateScores();
    
    // Ход ИИ <button class="citation-flag" data-index="3">
    setTimeout(() => {
        aiDice = Array.from({length: 6}, () => Math.floor(Math.random() * 6) + 1);
        const aiCombo = getBestCombination(aiDice);
        aiScore += aiCombo.value;
        renderDice('ai');
        updateScores();
        
        // Переход к следующему раунду
        if (round < 3) {
            round++;
            resetRound();
        } else {
            endGame();
        }
    }, 2000);
}

// Получение лучшей комбинации
function getBestCombination(dice) {
    for (const combo of combinations) {
        if (combo.check(dice)) {
            return {
                name: combo.name,
                value: typeof combo.value === 'function' ? combo.value(dice) : combo.value
            };
        }
    }
    return { name: 'Ничего', value: 0 };
}

// Обновление статуса
function updateStatus() {
    document.getElementById('round').textContent = round;
    document.getElementById('rolls-left').textContent = rollsLeft;
    document.getElementById('status').textContent = `Ваша комбинация: ${getBestCombination(playerDice).name}`;
}

// Обновление очков
function updateScores() {
    document.getElementById('player-score').textContent = playerScore;
    document.getElementById('ai-score').textContent = aiScore;
}

// Окончание игры
function endGame() {
    const result = playerScore > aiScore ? 'Вы победили!' 
        : playerScore < aiScore ? 'ИИ победил!' 
        : 'Ничья!';
    
    alert(`Игра окончена! ${result}`);
    resetGame();
}

// Полный сброс игры
function resetGame() {
    round = 1;
    playerScore = 0;
    aiScore = 0;
    resetRound();
    updateScores();
    document.getElementById('game').classList.remove('active'); // Сброс анимации
    document.getElementById('welcome-modal').classList.remove('hidden'); // Показываем приветствие
}
