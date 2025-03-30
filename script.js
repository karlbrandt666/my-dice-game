const Game = (() => {
    const state = {
        players: {
            human: { money: 100, score: 0, dice: [], selected: [], streak: 0 },
            ai: { money: 100, score: 0, dice: [], selected: [], streak: 0 }
        },
        currentBet: 0,
        pot: 0,
        isPlayerTurn: true,
        isAIThinking: false,
        round: 1,
        lastWinner: null,
        sounds: {
            dice: new Audio('sounds/dice-roll.mp3'),
            win: new Audio('sounds/win.mp3'),
            lose: new Audio('sounds/lose.mp3'),
            select: new Audio('sounds/select.mp3'),
            bet: new Audio('sounds/bet.mp3'),
            tavern: new Audio('sounds/tavern.mp3')
        }
    };

    const combinations = [
        { name: 'Стрит', check: d => {
            const sorted = [...d].sort((a, b) => a - b);
            return (sorted[0] === 1 && sorted[1] === 2 && sorted[2] === 3) ||
                   (sorted[0] === 4 && sorted[1] === 5 && sorted[2] === 6);
        }, value: 1000 },
        { name: 'Три одинаковых', check: d => d[0] === d[1] && d[1] === d[2], value: d => d[0] * 100 },
        { name: 'Фулл-хаус', check: d => {
            const counts = {};
            d.forEach(n => counts[n] = (counts[n] || 0) + 1);
            return Object.values(counts).includes(2) && Object.values(counts).includes(1);
        }, value: 500 },
        { name: 'Двойная пара', check: d => {
            const counts = {};
            d.forEach(n => counts[n] = (counts[n] || 0) + 1);
            return Object.values(counts).filter(v => v === 2).length === 2;
        }, value: 300 }
    ];

    function init() {
        // Обработчики для главного меню
        document.getElementById('start-game-btn').addEventListener('click', start);
        document.getElementById('rules-btn').addEventListener('click', () => toggleRules());
        document.getElementById('secret-game-btn').addEventListener('click', startTetris);
        document.getElementById('close-rules-btn').addEventListener('click', () => toggleRules());
        document.getElementById('play-again-btn').addEventListener('click', reset);

        // Обработчики для игры в кости
        document.getElementById('bet-10-btn').addEventListener('click', () => placeBet(10));
        document.getElementById('bet-20-btn').addEventListener('click', () => placeBet(20));
        document.getElementById('bet-50-btn').addEventListener('click', () => placeBet(50));
        document.getElementById('roll-dice-btn').addEventListener('click', rollDice);
        document.getElementById('end-turn-btn').addEventListener('click', endTurn);
        document.getElementById('raise-bet-btn').addEventListener('click', raiseBet);

        // Обработчики для Тетриса
        document.getElementById('tetris-start-btn').addEventListener('click', () => Tetris.start());
        document.getElementById('tetris-pause-btn').addEventListener('click', () => Tetris.pause());
        document.getElementById('tetris-close-btn').addEventListener('click', closeTetris);

        // Обработчик для костей игрока
        document.getElementById('player-dice').addEventListener('click', e => {
            const dice = e.target.closest('.dice');
            if (dice) {
                const index = parseInt(dice.getAttribute('data-index'));
                if (!isNaN(index)) {
                    toggleDie(index);
                }
            }
        });

        // Добавляем эффект свечей
        createCandleEffect();
        
        // Запускаем фоновую музыку таверны
        state.sounds.tavern.loop = true;
        state.sounds.tavern.volume = 0.3;
        state.sounds.tavern.play().catch(() => {});
    }

    function createCandleEffect() {
        const container = document.querySelector('.game-table');
        for (let i = 0; i < 5; i++) {
            const candle = document.createElement('div');
            candle.className = 'candle';
            candle.style.left = `${Math.random() * 100}%`;
            candle.style.top = `${Math.random() * 100}%`;
            container.appendChild(candle);
        }
    }

    function start() {
        document.getElementById('welcome-modal').classList.add('hidden');
        document.getElementById('game').classList.remove('hidden');
        resetRound();
        showStatus('Добро пожаловать в таверну!', '#ffd700');
    }

    function resetRound() {
        state.currentBet = 0;
        state.pot = 0;
        state.players.human.selected = [];
        state.players.ai.selected = [];
        generateDice('human');
        generateDice('ai');
        updateUI();
    }

    function generateDice(player) {
        state.players[player].dice = Array.from({length: 3}, 
            () => Math.floor(Math.random() * 6) + 1);
    }

    function placeBet(amount) {
        if (state.players.human.money < amount || state.isAIThinking) return;
        
        state.currentBet = amount;
        state.pot += amount;
        state.players.human.money -= amount;
        utils.playSound('bet');
        updateUI();
        aiTurn();
    }

    function raiseBet() {
        if (state.players.human.money < state.currentBet || state.isAIThinking) return;
        
        state.pot += state.currentBet;
        state.players.human.money -= state.currentBet;
        state.currentBet *= 2;
        utils.playSound('bet');
        updateUI();
        aiTurn();
    }

    function rollDice() {
        if (state.isAIThinking) return;

        utils.playSound('dice');
        state.players.human.dice = state.players.human.dice.map((val, i) => {
            if (!state.players.human.selected.includes(i)) {
                const diceElement = document.querySelector(`[data-index="${i}"]`);
                utils.animateDiceRoll(diceElement);
                return Math.floor(Math.random() * 6) + 1;
            }
            return val;
        });
        
        updateUI();
        document.getElementById('end-turn-btn').disabled = false;
    }

    function toggleDie(index) {
        if (state.isAIThinking) return;
        const idx = state.players.human.selected.indexOf(index);
        utils.playSound('select');
        if (idx === -1) {
            state.players.human.selected.push(index);
        } else {
            state.players.human.selected.splice(idx, 1);
        }
        updateUI();
    }

    function endTurn() {
        if (state.players.human.selected.length === 0) {
            showStatus('Выберите хотя бы одну кость!', '#ff4444');
            return;
        }

        const selectedDice = state.players.human.dice.filter((_, i) => 
            state.players.human.selected.includes(i)
        );
        const humanScore = calculateScore(selectedDice);
        state.players.human.score = humanScore;
        
        showStatus(`Ваши очки: ${humanScore}`, '#4CAF50');
        aiTurn();
    }

    function aiTurn() {
        state.isAIThinking = true;
        
        // ИИ выбирает кости
        const aiDice = state.players.ai.dice;
        const bestScore = calculateScore(aiDice);
        const bestCombination = findBestCombination(aiDice);
        
        if (bestCombination) {
            state.players.ai.selected = bestCombination;
        }
        
        // ИИ делает ставку
        setTimeout(() => {
            if (Math.random() < 0.7 && state.players.ai.money >= state.currentBet) {
                state.pot += state.currentBet;
                state.players.ai.money -= state.currentBet;
                state.currentBet *= 2;
                utils.playSound('bet');
                updateUI();
                showStatus('ИИ повышает ставку!', '#ff4444');
            } else {
                endGame();
            }
        }, 1000);
    }

    function findBestCombination(dice) {
        let bestScore = 0;
        let bestCombination = null;
        
        // Проверяем все возможные комбинации
        for (let i = 0; i < dice.length; i++) {
            for (let j = i + 1; j < dice.length; j++) {
                for (let k = j + 1; k < dice.length; k++) {
                    const combination = [i, j, k];
                    const score = calculateScore(dice.filter((_, idx) => combination.includes(idx)));
                    if (score > bestScore) {
                        bestScore = score;
                        bestCombination = combination;
                    }
                }
            }
        }
        
        return bestCombination;
    }

    function calculateScore(dice) {
        for (const combo of combinations) {
            if (combo.check(dice)) {
                return typeof combo.value === 'function' 
                    ? combo.value(dice) 
                    : combo.value;
            }
        }
        return dice.reduce((sum, val) => sum + val, 0);
    }

    function endGame() {
        state.isAIThinking = false;
        const humanScore = calculateScore(state.players.human.dice.filter((_, i) => 
            state.players.human.selected.includes(i)
        ));
        const aiScore = calculateScore(state.players.ai.dice.filter((_, i) => 
            state.players.ai.selected.includes(i)
        ));

        if (humanScore > aiScore) {
            state.players.human.money += state.pot;
            state.players.human.streak++;
            state.players.ai.streak = 0;
            state.lastWinner = 'human';
            utils.animateWin();
            utils.playSound('win');
            showResult('Победа!', '#4CAF50');
        } else if (humanScore < aiScore) {
            state.players.ai.money += state.pot;
            state.players.ai.streak++;
            state.players.human.streak = 0;
            state.lastWinner = 'ai';
            utils.animateLose();
            utils.playSound('lose');
            showResult('Поражение!', '#ff4444');
        } else {
            state.players.human.money += state.pot / 2;
            state.players.ai.money += state.pot / 2;
            state.lastWinner = null;
            showResult('Ничья!', '#ffc107');
        }

        updateUI();
        state.round++;
    }

    function showResult(text, color) {
        const resultModal = document.getElementById('result-modal');
        const resultText = document.getElementById('result-text');
        resultText.textContent = text;
        resultText.style.color = color;
        resultModal.classList.remove('hidden');
        
        // Добавляем анимацию для результата
        resultModal.classList.remove('modal-fade-in');
        void resultModal.offsetWidth; // Форсируем перерисовку
        resultModal.classList.add('modal-fade-in');
    }

    function reset() {
        state.players.human.money = 100;
        state.players.ai.money = 100;
        state.players.human.streak = 0;
        state.players.ai.streak = 0;
        state.round = 1;
        state.lastWinner = null;
        document.getElementById('result-modal').classList.add('hidden');
        start();
    }

    function updateUI() {
        document.getElementById('player-money').textContent = state.players.human.money;
        document.getElementById('ai-money').textContent = state.players.ai.money;
        document.getElementById('player-score').textContent = state.players.human.score;
        document.getElementById('ai-score').textContent = state.players.ai.score;
        document.getElementById('current-pot').textContent = state.pot;
        document.getElementById('current-bet').textContent = state.currentBet;
        document.getElementById('round').textContent = state.round;
        
        // Обновляем отображение серии побед
        document.getElementById('player-streak').textContent = state.players.human.streak;
        document.getElementById('ai-streak').textContent = state.players.ai.streak;
        
        const playerContainer = document.getElementById('player-dice');
        playerContainer.innerHTML = state.players.human.dice
            .map((val, i) => `
                <div class="dice ${state.players.human.selected.includes(i) ? 'selected' : ''}" 
                     data-index="${i}"
                     data-value="${val}">
                </div>
            `).join('');

        const aiContainer = document.getElementById('ai-dice');
        aiContainer.innerHTML = state.players.ai.dice
            .map((val, i) => `
                <div class="dice ${state.players.ai.selected.includes(i) ? 'selected' : ''}"
                     data-value="${val}">
                </div>
            `).join('');

        // Добавляем анимацию для банка при изменении
        const potElement = document.getElementById('current-pot');
        potElement.classList.remove('pot-pulse');
        void potElement.offsetWidth; // Форсируем перерисовку
        potElement.classList.add('pot-pulse');
    }

    function showStatus(text, color = '#fff') {
        const status = document.getElementById('status');
        status.textContent = text;
        status.style.color = color;
        status.classList.remove('status-slide-in');
        void status.offsetWidth; // Форсируем перерисовку
        status.classList.add('status-slide-in');
        setTimeout(() => {
            status.textContent = '';
            status.classList.remove('status-slide-in');
        }, 2000);
    }

    function toggleRules() {
        const rulesModal = document.getElementById('rules-modal');
        const welcomeModal = document.getElementById('welcome-modal');
        
        if (!welcomeModal.classList.contains('hidden')) {
            welcomeModal.classList.add('hidden');
            rulesModal.classList.remove('hidden');
        } else {
            rulesModal.classList.toggle('hidden');
        }
    }

    function startTetris() {
        document.getElementById('welcome-modal').classList.add('hidden');
        document.getElementById('tetris-modal').classList.remove('hidden');
        Tetris.init();
    }

    function closeTetris() {
        document.getElementById('tetris-modal').classList.add('hidden');
        document.getElementById('welcome-modal').classList.remove('hidden');
    }

    const utils = {
        playSound: (soundName) => {
            if (state.sounds[soundName]) {
                state.sounds[soundName].currentTime = 0;
                state.sounds[soundName].play().catch(() => {});
            }
        },

        animateDiceRoll: (diceElement) => {
            diceElement.classList.add('rolling');
            setTimeout(() => diceElement.classList.remove('rolling'), 500);
        },

        animateWin: () => {
            const dice = document.querySelectorAll('.dice');
            dice.forEach(die => {
                die.classList.add('bounce');
            });
            setTimeout(() => {
                dice.forEach(die => {
                    die.classList.remove('bounce');
                });
            }, 1000);
        },

        animateLose: () => {
            const dice = document.querySelectorAll('.dice');
            dice.forEach(die => {
                die.classList.add('shake');
            });
            setTimeout(() => {
                dice.forEach(die => {
                    die.classList.remove('shake');
                });
            }, 1000);
        }
    };

    return {
        start,
        reset,
        rollDice,
        endTurn,
        placeBet,
        raiseBet,
        toggleRules,
        startTetris,
        closeTetris,
        init
    };
})();

// Инициализация игры
Game.init();
