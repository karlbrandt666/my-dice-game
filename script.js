function rollDice() {
    const container = document.getElementById('dice-container');
    if (!container) {
        console.error('Контейнер для костей не найден!');
        return;
    }

    container.innerHTML = ''; // Очистка предыдущих костей

    for (let i = 0; i < 6; i++) {
        const die = document.createElement('div');
        die.className = 'dice';
        const value = Math.floor(Math.random() * 6) + 1; // Случайное значение кости
        die.style.backgroundImage = `url('dice-${value}.png')`; // Установка изображения
        container.appendChild(die);
    }
}
