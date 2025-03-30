const Game = (() => {
    const state = {
        players: {
            human: { money: 100, score: 0, dice: [], selected: [] },
            ai: { money: 100, score: 0, dice: [], selected: [] }
        },
        currentBet: 0,
        pot: 0,
        isPlayerTurn: true,
        isAIThinking: false,
        sounds: {
            dice: new Audio('sounds/dice-roll.mp3'),
            win: new Audio('sounds/win.mp3'),
            lose: new Audio('sounds/lose.mp3'),
            select: new Audio('sounds/select.mp3'),
            bet: new Audio('sounds/bet.mp3')
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
        }, value: 500 }
    ];

    function init() {
        document.getElementById('player-dice').addEventListener('click', e => {
            if (e.target.classList.contains('dice')) {
                toggleDie(e.target.dataset.index);
            }
        });
    }

    function start() {
        document.getElementById('welcome-modal').classList.add('hidden');
        document.getElementById('game').classList.remove('hidden');
        resetRound();
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
        const idx = state.players.human.selected.indexOf(+index);
        utils.playSound('select');
        idx === -1 
            ? state.players.human.selected.push(+index) 
            : state.players.human.selected.splice(idx, 1);
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
            showResult('Победа!', '#4CAF50');
        } else if (humanScore < aiScore) {
            state.players.ai.money += state.pot;
            showResult('Поражение!', '#ff4444');
        } else {
            state.players.human.money += state.pot / 2;
            state.players.ai.money += state.pot / 2;
            showResult('Ничья!', '#ffc107');
        }

        updateUI();
    }

    function showResult(text, color) {
        const resultModal = document.getElementById('result-modal');
        const resultText = document.getElementById('result-text');
        resultText.textContent = text;
        resultText.style.color = color;
        resultModal.classList.remove('hidden');
    }

    function reset() {
        state.players.human.money = 100;
        state.players.ai.money = 100;
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
        
        const playerContainer = document.getElementById('player-dice');
        playerContainer.innerHTML = state.players.human.dice
            .map((val, i) => `
                <div class="dice ${state.players.human.selected.includes(i) ? 'selected' : ''}" 
                     data-index="${i}">
                    <div class="dice-value">${val}</div>
                </div>
            `).join('');

        const aiContainer = document.getElementById('ai-dice');
        aiContainer.innerHTML = state.players.ai.dice
            .map((val, i) => `
                <div class="dice ${state.players.ai.selected.includes(i) ? 'selected' : ''}">
                    <div class="dice-value">${val}</div>
                </div>
            `).join('');
    }

    function showStatus(text, color = '#fff') {
        const status = document.getElementById('status');
        status.textContent = text;
        status.style.color = color;
        setTimeout(() => status.textContent = '', 2000);
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
        init
    };
})();

// Инициализация игры
Game.init();
