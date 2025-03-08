const Game = (() => {
    const state = {
        round: 1,
        players: {
            human: { score: 0, dice: [], selected: [] },
            ai: { score: 0, dice: [], selected: [] }
        },
        rollsLeft: 3,
        isAIThinking: false
    };

    const utils = {
        getFrequencies: dice => dice.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {}),

        sortNumbers: (a, b) => a - b,

        createConfetti: (color, count) => {
            const container = document.getElementById('result-animation');
            for (let i = 0; i < count; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.animationDelay = `${Math.random() * 1}s`;
                confetti.style.color = color;
                container.appendChild(confetti);
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

    function init() {
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
            document.getElementById('end-btn').disabled = true;
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
                resultText.textContent = `🏆 Победа! ${humanScore} : ${aiScore}`;
                resultContent.classList.add('win');
                utils.createConfetti('#4CAF50', 50);
            } else if (humanScore < aiScore) {
                resultText.textContent = `💻 Победа ИИ! ${aiScore} : ${humanScore}`;
                resultContent.classList.add('lose');
                utils.createConfetti('#ff4444', 50);
            } else {
                resultText.textContent = `🤝 Ничья! ${humanScore} : ${aiScore}`;
                resultContent.classList.add('draw');
                utils.createConfetti('#ffc107', 50);
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
        },

        toggleRules() {
            const rulesModal = document.getElementById('rules-modal');
            const welcomeModal = document.getElementById('welcome-modal');
            
            if (welcomeModal.classList.contains('hidden')) {
                rulesModal.classList.toggle('hidden');
            } else {
                welcomeModal.classList.add('hidden');
                rulesModal.classList.remove('hidden');
            }
        }
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
