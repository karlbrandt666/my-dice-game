document.addEventListener('DOMContentLoaded', () => {
    // Переменные игры
    let currentPlayer = 'player';
    let round = 1;
    let playerScore = 0;
    let aiScore = 0;
    let rollsLeft = 3;
    let selected = [];
    let playerDice = Array(6).fill(0);
    let aiDice = Array(6).fill(0);

    // Комбинации
    const combinations = [
        { name: 'Пять одинаковых', check: d => hasCount(d,5), value: 2000 },
        { name: 'Четыре одинаковых', check: d => hasCount(d,4), value: 1000 },
        { name: 'Фулл-хаус', check: d => hasCount(d,3) && hasCount(d,2), value: 800 },
        { name: 'Стрит', check: d => d.sort().join('') === '123456', value: 1500 },
        { name: 'Три одинаковых', check: d => hasCount(d,3), value: d => getMostFrequent(d)*100 },
        { name: 'Одиночные', check: d => d.some(v => [1,5].includes(v)), value: d => d.reduce((sum, v) => sum + (v === 1 ? 100 : v === 5 ? 50 : 0), 0) }
    ];

    // Функция для переключения правил
    window.toggleRules = function() {
        const rules = document.getElementById('rules');
        rules.classList.toggle('hidden');
    };

    // Начало игры
    window.startGame = function() {
        document.getElementById('welcome-modal').classList.add('hidden');
        document.getElementById('game').classList.remove('hidden');
        resetRound();
    };

    // Сброс раунда
    function resetRound() {
        rollsLeft = 3;
        selected = Array(6).fill(false);
        playerDice.fill(0);
        aiDice.fill(0);
        updateStatus();
        renderDice('player');
        document.getElementById('ai-dice').classList.add('hidden'); // Скрываем кости ИИ
    }

    // Бросок костей
    window.rollDice = function() {
        if (rollsLeft <= 0) return;

        playerDice = playerDice.map((v, i) => 
            selected[i] ? v : Math.floor(Math.random()*6)+1
        );
        
        renderDice('player');
        rollsLeft--;
        updateStatus();
        
        if (rollsLeft === 0) {
            document.getElementById('end-btn').disabled = false;
        }
    };

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
                die.onclick = () => toggleDie(index);
            }
            
            container.appendChild(die);
        });
        
        // Показываем контейнер ИИ после его хода
        if (target === 'ai') {
            container.classList.remove('hidden');
        }
    }

    // Выбор кости
    function toggleDie(index) {
        if (rollsLeft === 3) return;
        selected[index] = !selected[index];
        renderDice('player');
    }

    // Завершение хода
    window.endTurn = function() {
        // Подсчёт очков игрока
        const playerCombo = getBestCombination(playerDice);
        playerScore += playerCombo.value;
        updateScores();
        
        // Ход ИИ
        setTimeout(() => {
            aiDice = Array.from({length:6}, () => Math.floor(Math.random()*6)+1);
            const aiCombo = getBestCombination(aiDice);
            aiScore += aiCombo.value;
            renderDice('ai'); // Показываем кости ИИ
            updateScores();
            
            if (round < 3) {
                round++;
                resetRound();
            } else {
                endGame();
            }
        }, 2000);
    };

    // Получение лучшей комбинации
    function getBestCombination(dice) {
        for (const combo of combinations) {
            if (combo.check(dice)) {
                return {
                    name: combo.name,
                    value: typeof combo.value === 'function' 
                        ? combo.value(dice) 
                        : combo.value
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
        const result = playerScore > aiScore ? 'Победа!' 
            : playerScore < aiScore ? 'ИИ победил!' 
            : 'Ничья!';
        
        alert(`Игра окончена! ${result}`);
        resetGame();
    }

    // Полный сброс
    function resetGame() {
        round = 1;
        playerScore = 0;
        aiScore = 0;
        document.getElementById('game').classList.add('hidden');
        document.getElementById('welcome-modal').classList.remove('hidden');
        document.getElementById('ai-dice').classList.add('hidden');
    }
});
