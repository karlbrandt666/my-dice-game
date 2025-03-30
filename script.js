const Game = (() => {
    const state = {
        round: 1,
        players: {
            human: { score: 0, dice: [], selected: [], money: 1000 },
            ai: { score: 0, dice: [], selected: [], money: 1000 }
        },
        rollsLeft: 3,
        isAIThinking: false,
        currentBet: 0,
        sounds: {
            dice: new Audio('sounds/dice-roll.mp3'),
            win: new Audio('sounds/win.mp3'),
            lose: new Audio('sounds/lose.mp3'),
            select: new Audio('sounds/select.mp3'),
            bet: new Audio('sounds/bet.mp3')
        },
        stats: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            bestScore: 0,
            totalMoneyWon: 0,
            totalMoneyLost: 0
        }
    };

    const utils = {
        getFrequencies: dice => dice.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {}),
        
        sortNumbers: (a, b) => a - b,
        
        createConfetti: (color, count) => {
            const container = document.getElementById('result-animation');
            container.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.animationDelay = `${Math.random() * 1}s`;
                confetti.style.color = color;
                container.appendChild(confetti);
            }
        },
        
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

        getCombinations: (arr, size) => {
            const result = [];
            const combine = (start, current) => {
                if (current.length === size) {
                    result.push([...current]);
                    return;
                }
                for (let i = start; i < arr.length; i++) {
                    current.push(arr[i]);
                    combine(i + 1, current);
                    current.pop();
                }
            };
            combine(0, []);
            return result;
        },

        updateStats: (result, score) => {
            state.stats.gamesPlayed++;
            switch(result) {
                case 'win':
                    state.stats.wins++;
                    break;
                case 'lose':
                    state.stats.losses++;
                    break;
                case 'draw':
                    state.stats.draws++;
                    break;
            }
            if (score > state.stats.bestScore) {
                state.stats.bestScore = score;
            }
            localStorage.setItem('diceGameStats', JSON.stringify(state.stats));
        },

        loadStats: () => {
            const savedStats = localStorage.getItem('diceGameStats');
            if (savedStats) {
                state.stats = JSON.parse(savedStats);
            }
        }
    };

    const combinations = [
        { name: 'Штраф', check: d => d.length === 0, value: -500 },
        { name: '6 одинаковых', check: d => Object.values(utils.getFrequencies(d)).includes(6), value: 5000 },
        { name: '5 одинаковых', check: d => Object.values(utils.getFrequencies(d)).includes(5), value: 2000 },
        { name: '4 одинаковых', check: d => Object.values(utils.getFrequencies(d)).includes(4), value: 1000 },
        { name: 'Фулл-хаус', check: d => {
            const counts = Object.values(utils.getFrequencies(d));
            return counts.includes(3) && counts.includes(2);
        }, value: 800 },
        { name: 'Стрит', check: d => [...new Set(d)].sort(utils.sortNumbers).join('') === '123456', value: 1500 },
        { name: '3 одинаковых', check: d => Object.values(utils.getFrequencies(d)).includes(3), value: d => Math.max(...d) * 100 },
        { name: 'Одиночные', check: d => true, value: d => d.reduce((sum, val) => sum + (val === 1 ? 100 : val === 5 ? 50 : 0), 0) }
    ];

    const aiLogic = {
        evaluateDice: (dice) => {
            let bestScore = -Infinity;
            let bestSelection = [];
            
            // Проверяем все возможные комбинации выбранных костей
            for (let i = 1; i <= dice.length; i++) {
                const combinations = utils.getCombinations(dice, i);
                for (const combo of combinations) {
                    const score = Game.calculateScore(combo);
                    if (score > bestScore) {
                        bestScore = score;
                        bestSelection = combo;
                    }
                }
            }
            
            return { score: bestScore, selection: bestSelection };
        },

        selectDice: (dice) => {
            const { score, selection } = aiLogic.evaluateDice(dice);
            return dice.map((val, i) => selection.includes(val));
        }
    };

    function init() {
        utils.loadStats();
        document.getElementById('player-dice').addEventListener('click', e => {
            if (e.target.classList.contains('dice')) {
                Game.toggleDie(e.target.dataset.index);
            }
        });
    }

    return {
        start() {
            document.getElementById('welcome-modal').classList.add('hidden');
            document.getElementById('game').classList.remove('hidden');
            this.resetRound();
        },

        resetRound() {
            state.rollsLeft = 3;
            state.players.human.selected = [];
            state.players.ai.selected = [];
            this.generateDice('human');
            this.generateDice('ai');
            this.updateUI();
            this.updateAI();
            document.getElementById('end-btn').disabled = true;
        },

        generateDice(player) {
            state.players[player].dice = Array.from({length: 6}, 
                () => Math.floor(Math.random() * 6) + 1);
        },

        rollDice() {
            if (state.rollsLeft <= 0 || state.isAIThinking) return;

            utils.playSound('dice');
            state.players.human.dice = state.players.human.dice.map((val, i) => {
                if (!state.players.human.selected.includes(i)) {
                    const diceElement = document.querySelector(`[data-index="${i}"]`);
                    utils.animateDiceRoll(diceElement);
                    return Math.floor(Math.random() * 6) + 1;
                }
                return val;
            });
            
            state.rollsLeft--;
            this.updateUI();
            
            if (state.rollsLeft === 0) {
                document.getElementById('end-btn').disabled = false;
            }
        },

        endTurn() {
            if (state.players.human.selected.length === 0) {
                this.showStatus('Выберите хотя бы одну кость!', '#ff4444');
                return;
            }

            const selectedDice = state.players.human.dice.filter((_, i) => 
                state.players.human.selected.includes(i)
            );
            const humanScore = this.calculateScore(selectedDice);
            state.players.human.score += humanScore;
            
            this.showStatus(`Ваши очки: +${humanScore}`, '#4CAF50');
            this.aiTurn();
        },

        aiTurn() {
            state.isAIThinking = true;
            let rolls = 3;
            
            const aiRoll = setInterval(() => {
                state.players.ai.dice = state.players.ai.dice.map((val, i) => 
                    state.players.ai.selected.includes(i) ? val : Math.floor(Math.random() * 6) + 1
                );
                
                if (rolls === 3) {
                    // Первый бросок - выбираем лучшую комбинацию
                    state.players.ai.selected = aiLogic.selectDice(state.players.ai.dice);
                }
                
                this.updateAI();
                if (--rolls <= 0) {
                    clearInterval(aiRoll);
                    const aiSelected = state.players.ai.dice.filter((_, i) =>
                        state.players.ai.selected.includes(i)
                    );
                    const aiScore = this.calculateScore(aiSelected);
                    state.players.ai.score += aiScore;
                    this.nextRound();
                }
            }, 500);
        },

        calculateScore(dice) {
            for (const combo of combinations) {
                if (combo.check(dice)) {
                    return typeof combo.value === 'function' 
                        ? combo.value(dice) 
                        : combo.value;
                }
            }
            return 0;
        },

        nextRound() {
            state.isAIThinking = false;
            if (state.round < 3) {
                state.round++;
                this.resetRound();
            } else {
                this.endGame();
            }
            this.updateUI();
        },

        updateUI() {
            document.getElementById('round').textContent = state.round;
            document.getElementById('rolls-left').textContent = state.rollsLeft;
            document.getElementById('player-score').textContent = state.players.human.score;
            document.getElementById('ai-score').textContent = state.players.ai.score;
            document.getElementById('player-money').textContent = state.players.human.money;
            document.getElementById('ai-money').textContent = state.players.ai.money;
            document.getElementById('current-bet').textContent = state.currentBet;
            
            const playerContainer = document.getElementById('player-dice');
            playerContainer.innerHTML = state.players.human.dice
                .map((val, i) => `
                    <div class="dice ${state.players.human.selected.includes(i) ? 'selected' : ''}" 
                         data-index="${i}"
                         style="background-image: url('dice-${val}.png')">
                    </div>
                `).join('');
        },

        updateAI() {
            const aiContainer = document.getElementById('ai-dice');
            aiContainer.innerHTML = state.players.ai.dice
                .map((val, i) => `
                    <div class="dice ${state.players.ai.selected.includes(i) ? 'selected' : ''}" 
                         style="background-image: url('dice-${val}.png')">
                    </div>
                `).join('');
        },

        toggleDie(index) {
            if (state.rollsLeft === 3 || state.isAIThinking) return;
            const idx = state.players.human.selected.indexOf(+index);
            utils.playSound('select');
            idx === -1 
                ? state.players.human.selected.push(+index) 
                : state.players.human.selected.splice(idx, 1);
            this.updateUI();
        },

        endGame() {
            const resultContent = document.querySelector('.result-content');
            const resultText = document.getElementById('result-text');
            const humanScore = state.players.human.score;
            const aiScore = state.players.ai.score;

            resultContent.classList.remove('win', 'lose', 'draw');
            document.getElementById('result-animation').innerHTML = '';

            if (humanScore > aiScore) {
                const winnings = state.currentBet * 2;
                state.players.human.money += winnings;
                state.stats.totalMoneyWon += winnings;
                state.players.ai.money -= state.currentBet;
                state.stats.totalMoneyLost += state.currentBet;
                
                resultText.textContent = `🏆 Победа! +${winnings} грошей\n${humanScore} : ${aiScore}`;
                resultContent.classList.add('win');
                utils.createConfetti('#4CAF50', 50);
                utils.playSound('win');
                utils.updateStats('win', humanScore);
            } else if (humanScore < aiScore) {
                state.players.ai.money += state.currentBet * 2;
                state.stats.totalMoneyWon += state.currentBet * 2;
                state.players.human.money -= state.currentBet;
                state.stats.totalMoneyLost += state.currentBet;
                
                resultText.textContent = `💻 Победа ИИ! -${state.currentBet} грошей\n${aiScore} : ${humanScore}`;
                resultContent.classList.add('lose');
                utils.createConfetti('#ff4444', 50);
                utils.playSound('lose');
                utils.updateStats('lose', humanScore);
            } else {
                state.players.human.money += state.currentBet;
                state.players.ai.money += state.currentBet;
                
                resultText.textContent = `🤝 Ничья! Возврат ставки\n${humanScore} : ${aiScore}`;
                resultContent.classList.add('draw');
                utils.createConfetti('#ffc107', 50);
                utils.updateStats('draw', humanScore);
            }

            // Добавляем статистику в модальное окно
            const statsHtml = `
                <div class="stats">
                    <h3>Статистика</h3>
                    <p>Игр сыграно: ${state.stats.gamesPlayed}</p>
                    <p>Побед: ${state.stats.wins}</p>
                    <p>Поражений: ${state.stats.losses}</p>
                    <p>Ничьих: ${state.stats.draws}</p>
                    <p>Лучший результат: ${state.stats.bestScore}</p>
                    <p>Выиграно грошей: ${state.stats.totalMoneyWon}</p>
                    <p>Проиграно грошей: ${state.stats.totalMoneyLost}</p>
                </div>
            `;
            resultContent.insertAdjacentHTML('beforeend', statsHtml);

            document.getElementById('result-modal').classList.remove('hidden');
        },

        reset() {
            state.round = 1;
            state.players.human.score = 0;
            state.players.ai.score = 0;
            state.currentBet = 0;
            document.getElementById('result-modal').classList.add('hidden');
            document.getElementById('bet-controls').classList.remove('hidden');
            document.getElementById('game-controls').classList.add('hidden');
            this.start();
        },

        showStatus(text, color = '#fff') {
            const status = document.getElementById('status');
            status.textContent = text;
            status.style.color = color;
            setTimeout(() => status.textContent = '', 2000);
        },

        toggleRules() {
            const rulesModal = document.getElementById('rules-modal');
            const welcomeModal = document.getElementById('welcome-modal');
            
            if (!welcomeModal.classList.contains('hidden')) {
                welcomeModal.classList.add('hidden');
                rulesModal.classList.remove('hidden');
            } else {
                rulesModal.classList.toggle('hidden');
            }
        },

        init() {
            utils.loadStats();
            document.getElementById('player-dice').addEventListener('click', e => {
                if (e.target.classList.contains('dice')) {
                    this.toggleDie(e.target.dataset.index);
                }
            });
            
            // Инициализация звуков (добавьте файлы)
            this.sounds = {
                dice: new Audio('sounds/dice-roll.mp3'),
                win: new Audio('sounds/win.mp3'),
                lose: new Audio('sounds/lose.mp3'),
                select: new Audio('sounds/select.mp3'),
                bet: new Audio('sounds/bet.mp3')
            };
        },

        placeBet(amount) {
            if (state.players.human.money < amount || state.currentBet > 0) return;
            
            state.currentBet = amount;
            state.players.human.money -= amount;
            state.players.ai.money -= amount;
            utils.playSound('bet');
            this.updateUI();
            document.getElementById('bet-controls').classList.add('hidden');
            document.getElementById('game-controls').classList.remove('hidden');
        }
    };
})();

// Инициализация игры при полной загрузке страницы
window.addEventListener('load', () => {
    Game.init();
    document.querySelector('#welcome-modal button').focus();
});
