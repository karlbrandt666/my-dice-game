let score = 0; // Текущие очки
let selectedDice = []; // Выбранные кости
let diceValues = []; // Значения текущих костей

// Функция броска костей
function rollDice() {
    const container = document.getElementById('dice-container');
    if (!container) {
        console.error('Контейнер для костей не найден!');
        return;
    }

    container.innerHTML = ''; // Очистка предыдущих костей
    selectedDice = []; // Сброс выбранных костей
    diceValues = []; // Сброс значений костей

    for (let i = 0; i < 6; i++) {
        const die = document.createElement('div');
        die.className = 'dice';
        const value = Math.floor(Math.random() * 6) + 1; // Случайное значение кости
        die.style.backgroundImage = `url('dice-${value}.png')`; // Установка изображения
        die.dataset.value = value; // Сохраняем значение в data-атрибуте
        die.addEventListener('click', () => toggleDieSelection(die)); // Добавляем обработчик клика
        container.appendChild(die);
        diceValues.push(value);
    }

    // Активируем кнопку "Завершить ход"
    document.getElementById('end-turn-btn').disabled = false;
}

// Функция выбора/отмены выбора кости
function toggleDieSelection(die) {
    const value = parseInt(die.dataset.value);
    const index = selectedDice.indexOf(value);

    if (index === -1) {
        // Проверяем, что можно выбрать только 1 или 5
        if (value === 1 || value === 5) {
            selectedDice.push(value);
            die.classList.add('selected');
        } else {
            alert('Можно выбирать только кости со значением 1 или 5!');
        }
    } else {
        selectedDice.splice(index, 1);
        die.classList.remove('selected');
    }

    // Если выбраны все допустимые кости, блокируем кнопку "Бросить"
    if (selectedDice.length === diceValues.filter(v => v === 1 || v === 5).length) {
        document.querySelector('button[onclick="rollDice()"]').disabled = true;
    } else {
        document.querySelector('button[onclick="rollDice()"]').disabled = false;
    }
}

// Функция завершения хода
function endTurn() {
    let turnScore = 0;

    // Подсчёт очков за выбранные кости
    selectedDice.forEach(value => {
        if (value === 1) turnScore += 100;
        if (value === 5) turnScore += 50;
    });

    // Обновляем общий счёт
    score += turnScore;
    document.getElementById('score').textContent = `Очки: ${score}`;

    // Сбрасываем состояние
    selectedDice = [];
    document.getElementById('dice-container').innerHTML = '';
    document.getElementById('end-turn-btn').disabled = true;
    document.querySelector('button[onclick="rollDice()"]').disabled = false;

    alert(`Ход завершён! Вы набрали ${turnScore} очков.`);
}
