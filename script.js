const Game = {
    state: {
        currentValue: null,
        isRolling: false,
        answers: {
            1: "Нет",
            2: "Скорее нет",
            3: "Возможно",
            4: "Скорее да",
            5: "Да",
            6: "Да, и это очевидно"
        }
    },

    init() {
        this.dice = document.querySelector('.dice');
        this.rollButton = document.querySelector('.roll-button');
        this.resetButton = document.querySelector('.reset-button');
        this.welcomeScreen = document.querySelector('.welcome-screen');
        this.resultScreen = document.querySelector('.result-screen');
        this.answerElement = document.querySelector('.answer');

        this.rollButton.addEventListener('click', () => this.rollDice());
        this.resetButton.addEventListener('click', () => this.resetGame());
        
        // Добавляем эффект глитча для текста
        const glitchTexts = document.querySelectorAll('.glitch');
        glitchTexts.forEach(text => {
            text.setAttribute('data-text', text.textContent);
        });
    },

    rollDice() {
        if (this.state.isRolling) return;
        
        this.state.isRolling = true;
        this.rollButton.disabled = true;
        
        // Добавляем класс для анимации
        this.dice.classList.add('rolling');
        
        // Генерируем случайное значение
        const randomValue = Math.floor(Math.random() * 6) + 1;
        this.state.currentValue = randomValue;
        
        // Обновляем отображение кости
        this.dice.setAttribute('data-value', randomValue);
        
        // Создаем точки для кости
        this.dice.innerHTML = '';
        for (let i = 0; i < randomValue; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            this.dice.appendChild(dot);
        }
        
        // Останавливаем анимацию и показываем результат
        setTimeout(() => {
            this.dice.classList.remove('rolling');
            this.showResult();
        }, 1500);
    },

    showResult() {
        // Добавляем эффект глитча для ответа
        const answer = this.state.answers[this.state.currentValue];
        this.answerElement.textContent = answer;
        
        // Показываем экран результата
        this.welcomeScreen.style.display = 'none';
        this.resultScreen.classList.add('active');
        
        // Добавляем эффект появления для ответа
        this.answerElement.style.opacity = '0';
        setTimeout(() => {
            this.answerElement.style.opacity = '1';
        }, 100);
        
        this.state.isRolling = false;
        this.rollButton.disabled = false;
    },

    resetGame() {
        this.state.currentValue = null;
        this.state.isRolling = false;
        
        // Сбрасываем отображение
        this.dice.setAttribute('data-value', '');
        this.dice.innerHTML = '';
        this.answerElement.textContent = '';
        
        // Возвращаемся к начальному экрану
        this.resultScreen.classList.remove('active');
        this.welcomeScreen.style.display = 'block';
    }
};

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
