const Game = (() => {
    const state = {
        currentValue: 1,
        isRolling: false,
        answers: {
            1: "НЕТ",
            2: "ВОЗМОЖНО",
            3: "СКОРЕЕ ВСЕГО",
            4: "ДА",
            5: "ОПРЕДЕЛЕННО ДА",
            6: "ДА, И ЭТО ОЧЕВИДНО"
        }
    };

    function init() {
        document.getElementById('roll-button').addEventListener('click', rollDice);
        document.getElementById('roll-again').addEventListener('click', resetGame);
        
        // Добавляем эффект глитча для текста
        const glitchTexts = document.querySelectorAll('.glitch');
        glitchTexts.forEach(text => {
            text.setAttribute('data-text', text.textContent);
        });
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
            
            // Показываем результат с эффектом глитча
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
        
        // Показываем ответ с эффектом глитча
        answerText.textContent = state.answers[state.currentValue];
        answerText.classList.add('cyber-text');
        
        // Анимируем переход
        welcomeScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        
        // Добавляем эффект глитча для ответа
        setTimeout(() => {
            answerText.classList.remove('cyber-text');
        }, 2000);
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
