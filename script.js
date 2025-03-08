 const Game = (() => {
            // Состояние игры
            const state = {
                round: 1,
                players: {
                    human: { score: 0, dice: [], selected: [] },
                    ai: { score: 0, dice: [], selected: [] }
                },
                rollsLeft: 3,
                isAIThinking: false
            };

            // Утилиты
            const utils = {
                getFrequencies: dice => dice.reduce((acc, val) => {
                    acc[val] = (acc[val] || 0) + 1;
                    return acc;
                }, {}),
                
                sortNumbers: (a, b) => a - b
            };

            // Комбинации
            const combinations = [
                {
                    name: 'Штраф',
                    check: dice => dice.length === 0,
                    value: -500
                },
                {
                    name: 'Шесть одинаковых',
                    check: dice => Object.values(utils.getFrequencies(dice)).includes(6),
                    value: 5000
                },
                {
                    name: 'Пять одинаковых',
                    check: dice => Object.values(utils.getFrequencies(dice)).includes(5),
                    value: 2000
                },
                {
                    name: 'Четыре одинаковых',
                    check: dice => Object.values(utils.getFrequencies(dice)).includes(4),
                    value: 1000
                },
                {
                    name: 'Фулл-хаус',
                    check: dice => {
                        const counts = Object.values(utils.getFrequencies(dice));
                        return counts.includes(3) && counts.includes(2);
                    },
                    value: 800
                },
                {
                    name: 'Стрит',
                    check: dice => [...new Set(dice)].sort(utils.sortNumbers).join('') === '123456',
                    value: 1500
                },
                {
                    name: 'Три одинаковых',
                    check: dice => Object.values(utils.getFrequencies(dice)).includes(3),
                    value: dice => Math.max(...dice) * 100
                },
                {
                    name: 'Одиночные',
                    check: dice => true,
                    value: dice => dice.reduce((sum, val) => sum + (val === 1 ? 100 : val === 5 ? 50 : 0), 0)
                }
            ];

            // Инициализация игры
            function init() {
                document.querySelectorAll('.dice').forEach(die => {
                    die.addEventListener('click', e => toggleDie(e.target.dataset.index));
                });
            }

            // Основные методы
            return {
                start() {
                    document.getElementById('welcome-modal').classList.add('hidden');
                    document.getElementById('game').classList.remove('hidden');
                    this.resetRound();
                },

                resetRound() {
                    state.rollsLeft = 3;
                    state.players.human.selected = [];
                    this.generateDice('human');
                    this.updateUI();
                },

                generateDice(player) {
                    state.players[player].dice = Array.from({length: 6}, 
                        () => Math.floor(Math.random() * 6) + 1);
                },

                rollDice() {
                    if (state.rollsLeft <= 0 || state.isAIThinking) return;

                    state.players.human.dice = state.players.human.dice.map((val, i) =>
                        state.players.human.selected.includes(i) ? val : Math.floor(Math.random() * 6) + 1
                    );
                    
                    state.rollsLeft--;
                    this.updateUI();
                    
                    if (state.rollsLeft === 0) {
                        document.getElementById('end-btn').disabled = false;
                    }
                },

                endTurn() {
                    if (!state.players.human.selected.length) {
                        this.showStatus('Выберите хотя бы одну кость!', 'red');
                        return;
                    }

                    const humanScore = this.calculateScore('human');
                    state.players.human.score += humanScore;
                    
                    this.showStatus(`Ваши очки: +${humanScore}`, '#4CAF50');
                    this.aiTurn();
                },

                aiTurn() {
                    state.isAIThinking = true;
                    let rolls = 3;
                    
                    const aiRoll = setInterval(() => {
                        this.generateDice('ai');
                        this.updateUI('ai');
                        if (--rolls <= 0) {
                            clearInterval(aiRoll);
                            const aiScore = this.calculateScore('ai');
                            state.players.ai.score += aiScore;
                            this.nextRound();
                        }
                    }, 300);
                },

                calculateScore(player) {
                    const dice = state.players[player].dice;
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

                updateUI(player = 'human') {
                    // Обновление DOM
                    document.getElementById('round').textContent = state.round;
                    document.getElementById('rolls-left').textContent = state.rollsLeft;
                    document.getElementById('player-score').textContent = state.players.human.score;
                    document.getElementById('ai-score').textContent = state.players.ai.score;
                    
                    // Отрисовка костей
                    const container = document.getElementById('player-dice');
                    container.innerHTML = state.players.human.dice
                        .map((val, i) => `
                            <div class="dice ${state.players.human.selected.includes(i) ? 'selected' : ''}" 
                                 data-index="${i}"
                                 style="background-image: url('dice-${val}.png')">
                            </div>
                        `).join('');
                },

                toggleDie(index) {
                    if (state.rollsLeft === 3 || state.isAIThinking) return;
                    const idx = state.players.human.selected.indexOf(+index);
                    idx === -1 
                        ? state.players.human.selected.push(+index) 
                        : state.players.human.selected.splice(idx, 1);
                    this.updateUI();
                },

                endGame() {
                    const resultText = document.getElementById('result-text');
                    const humanScore = state.players.human.score;
                    const aiScore = state.players.ai.score;

                    if (humanScore > aiScore) {
                        resultText.textContent = `🏆 Победа! ${humanScore} : ${aiScore}`;
                    } else if (humanScore < aiScore) {
                        resultText.textContent = `💻 Победа ИИ! ${aiScore} : ${humanScore}`;
                    } else {
                        resultText.textContent = `🤝 Ничья! ${humanScore} : ${aiScore}`;
                    }

                    document.getElementById('result-modal').classList.remove('hidden');
                },

                reset() {
                    state.round = 1;
                    state.players.human.score = 0;
                    state.players.ai.score = 0;
                    document.getElementById('result-modal').classList.add('hidden');
                    this.start();
                },

                showStatus(text, color = '#fff') {
                    const status = document.getElementById('status');
                    status.textContent = text;
                    status.style.color = color;
                    setTimeout(() => status.textContent = '', 2000);
                }
            };
        })();

        // Инициализация игры при загрузке
        document.addEventListener('DOMContentLoaded', Game.init);
    </script>
</body>
</html>
