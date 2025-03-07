function rollDice() {
    // Проверка существования контейнера для костей
    const container = document.getElementById('dice-container');
    if (!container) { // Если элемент не найден <button class="citation-flag" data-index="5">
        console.error('Контейнер для костей не найден!');
        return; // Прерываем выполнение функции
    }

    // Очистка предыдущих костей
    container.innerHTML = '';

    // Создание 6 костей
    for (let i = 0; i < 6; i++) {
        const die = document.createElement('div');
        die.className = 'dice';
        die.style.backgroundImage = `url('dice-${Math.floor(Math.random() * 6) + 1}.png')`;
        container.appendChild(die);
    }
}