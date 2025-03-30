const Game = (() => {
    const state = {
        currentValue: 1,
        isRolling: false,
        answers: {
            1: "Нет",
            2: "Возможно",
            3: "Скорее всего",
            4: "Да",
            5: "Определенно да",
            6: "Да, и это очевидно"
        }
    };

    function init() {
        document.getElementById('roll-button').addEventListener('click', rollDice);
        document.getElementById('roll-again').addEventListener('click', resetGame);
    }

    function rollDice() {
        if (state.isRolling) return;
        
        state.isRolling = true;
        const dice = document.querySelector('.dice');
        const button = document.getElementById('roll-button');
        
        // Отключаем кнопку во время броска
        button.disabled = true;
        
        // Добавляем анимацию броска
        dice.classList.add('rolling');
        
        // Генерируем случайное значение
        const newValue = Math.floor(Math.random() * 6) + 1;
        
        // Обновляем значение после анимации
        setTimeout(() => {
            dice.setAttribute('data-value', newValue);
            state.currentValue = newValue;
            
            // Показываем результат
            showResult();
            
            // Убираем анимацию
            dice.classList.remove('rolling');
            button.disabled = false;
            state.isRolling = false;
        }, 1000);
    }

    function showResult() {
        const welcomeScreen = document.querySelector('.welcome-screen');
        const resultScreen = document.querySelector('.result-screen');
        const answerText = document.getElementById('answer-text');
        
        // Показываем ответ
        answerText.textContent = state.answers[state.currentValue];
        
        // Анимируем переход
        welcomeScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
    }

    function resetGame() {
        const welcomeScreen = document.querySelector('.welcome-screen');
        const resultScreen = document.querySelector('.result-screen');
        const dice = document.querySelector('.dice');
        
        // Сбрасываем значение кости
        dice.setAttribute('data-value', '1');
        state.currentValue = 1;
        
        // Возвращаемся к начальному экрану
        resultScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
    }

    return {
        init
    };
})();

// Инициализация игры
Game.init();
