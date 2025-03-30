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
        },
        tg: null
    },

    init() {
        this.dice = document.querySelector('.welcome-screen .dice');
        this.resultDice = document.querySelector('.result-screen .dice');
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

        // Инициализация Telegram Web App
        this.initTelegramApp();
    },

    initTelegramApp() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.state.tg = window.Telegram.WebApp;
            
            // Инициализируем Telegram Web App
            this.state.tg.ready();
            
            // Устанавливаем основной цвет кнопки
            this.state.tg.setHeaderColor('#000000');
            this.state.tg.setBackgroundColor('#000000');
            
            // Добавляем обработчики для кнопок поддержки
            const telegramButtons = document.querySelectorAll('.telegram-button');
            telegramButtons.forEach(button => {
                button.addEventListener('click', () => this.handleTelegramPayment());
            });
        }
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
        this.dice.querySelectorAll('.dice-face').forEach(face => {
            face.innerHTML = '';
            for (let i = 0; i < randomValue; i++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                face.appendChild(dot);
            }
        });
        
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
        
        // Обновляем кость на экране результата
        this.resultDice.setAttribute('data-value', this.state.currentValue);
        this.resultDice.querySelectorAll('.dice-face').forEach(face => {
            face.innerHTML = '';
            for (let i = 0; i < this.state.currentValue; i++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                face.appendChild(dot);
            }
        });
        
        // Добавляем класс для анимации результата
        this.resultDice.classList.add('result');
        
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
        
        // Сбрасываем отображение костей
        [this.dice, this.resultDice].forEach(dice => {
            dice.setAttribute('data-value', '');
            dice.querySelectorAll('.dice-face').forEach(face => {
                face.innerHTML = '';
            });
        });
        
        // Убираем классы анимации
        this.resultDice.classList.remove('result');
        
        // Сбрасываем ответ
        this.answerElement.textContent = '';
        
        // Возвращаемся к начальному экрану
        this.resultScreen.classList.remove('active');
        this.welcomeScreen.style.display = 'block';
    },

    handleTelegramPayment() {
        if (!this.state.tg) {
            alert('Пожалуйста, откройте приложение через Telegram');
            return;
        }

        // Открываем окно оплаты звездами
        this.state.tg.showPopup({
            title: 'Поддержать приложение',
            message: 'Выберите количество звезд для поддержки:',
            buttons: [
                {id: '1', type: 'default', text: '⭐ 1 звезда'},
                {id: '5', type: 'default', text: '⭐⭐⭐⭐⭐ 5 звезд'},
                {id: '10', type: 'default', text: '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ 10 звезд'},
                {id: 'cancel', type: 'cancel', text: 'Отмена'}
            ]
        }, (buttonId) => {
            if (buttonId && buttonId !== 'cancel') {
                const stars = parseInt(buttonId);
                this.processPayment(stars);
            }
        });
    },

    processPayment(stars) {
        // Здесь можно добавить логику отправки данных на сервер
        // Например, через Telegram Bot API
        const paymentData = {
            stars: stars,
            timestamp: Date.now(),
            userId: this.state.tg.initDataUnsafe.user?.id
        };

        // Показываем сообщение об успешной оплате
        this.state.tg.showAlert(`Спасибо за ${stars} звезд! Ваша поддержка очень важна для нас!`);
        
        // Здесь можно добавить отправку данных на сервер
        console.log('Payment processed:', paymentData);
    }
};

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
