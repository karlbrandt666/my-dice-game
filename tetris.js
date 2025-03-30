const Tetris = (() => {
    const canvas = document.getElementById('tetris-canvas');
    const nextCanvas = document.getElementById('next-piece-canvas');
    const ctx = canvas.getContext('2d');
    const nextCtx = nextCanvas.getContext('2d');

    // Настройки игры
    const BLOCK_SIZE = 30;
    const COLS = 10;
    const ROWS = 20;
    const COLORS = [
        '#FF0D72', '#0DC2FF', '#0DFF72',
        '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'
    ];

    // Фигуры
    const SHAPES = [
        [[1, 1, 1, 1]], // I
        [[1, 1], [1, 1]], // O
        [[1, 1, 1], [0, 1, 0]], // T
        [[1, 1, 1], [1, 0, 0]], // L
        [[1, 1, 1], [0, 0, 1]], // J
        [[1, 1, 0], [0, 1, 1]], // S
        [[0, 1, 1], [1, 1, 0]]  // Z
    ];

    let state = {
        board: Array(ROWS).fill().map(() => Array(COLS).fill(0)),
        currentPiece: null,
        nextPiece: null,
        currentX: 0,
        currentY: 0,
        score: 0,
        gameOver: false,
        isPaused: false,
        dropCounter: 0,
        dropInterval: 1000,
        lastTime: 0,
        isInitialized: false,
        animationFrame: null
    };

    // Инициализация канвасов
    function initCanvas() {
        canvas.width = COLS * BLOCK_SIZE;
        canvas.height = ROWS * BLOCK_SIZE;
        nextCanvas.width = 4 * BLOCK_SIZE;
        nextCanvas.height = 4 * BLOCK_SIZE;
    }

    // Создание новой фигуры
    function createPiece() {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        return { shape, color };
    }

    // Отрисовка фигуры
    function drawPiece(piece, x, y, context) {
        if (!piece) return;
        piece.shape.forEach((row, i) => {
            row.forEach((value, j) => {
                if (value) {
                    context.fillStyle = piece.color;
                    context.fillRect(
                        (x + j) * BLOCK_SIZE,
                        (y + i) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }

    // Отрисовка доски
    function drawBoard() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        state.board.forEach((row, i) => {
            row.forEach((value, j) => {
                if (value) {
                    ctx.fillStyle = value;
                    ctx.fillRect(
                        j * BLOCK_SIZE,
                        i * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }

    // Отрисовка следующей фигуры
    function drawNextPiece() {
        nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

        if (state.nextPiece) {
            const offsetX = (4 - state.nextPiece.shape[0].length) / 2;
            const offsetY = (4 - state.nextPiece.shape.length) / 2;
            drawPiece(state.nextPiece, offsetX, offsetY, nextCtx);
        }
    }

    // Проверка коллизий
    function collision(x, y, piece) {
        if (!piece) return true;
        return piece.shape.some((row, i) => {
            return row.some((value, j) => {
                if (!value) return false;
                const newX = x + j;
                const newY = y + i;
                return (
                    newX < 0 ||
                    newX >= COLS ||
                    newY >= ROWS ||
                    (newY >= 0 && state.board[newY][newX])
                );
            });
        });
    }

    // Слияние фигуры с доской
    function merge() {
        if (!state.currentPiece) return;
        
        state.currentPiece.shape.forEach((row, i) => {
            row.forEach((value, j) => {
                if (value) {
                    state.board[state.currentY + i][state.currentX + j] = state.currentPiece.color;
                }
            });
        });
        clearLines();
        state.currentPiece = state.nextPiece;
        state.nextPiece = createPiece();
        state.currentX = Math.floor(COLS / 2) - Math.floor(state.currentPiece.shape[0].length / 2);
        state.currentY = 0;

        if (collision(state.currentX, state.currentY, state.currentPiece)) {
            state.gameOver = true;
        }
    }

    // Очистка заполненных линий
    function clearLines() {
        let linesCleared = 0;
        state.board.forEach((row, i) => {
            if (row.every(value => value)) {
                state.board.splice(i, 1);
                state.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                i--;
            }
        });
        if (linesCleared > 0) {
            state.score += linesCleared * 100;
            document.getElementById('tetris-score').textContent = state.score;
        }
    }

    // Движение фигуры
    function move(dx, dy) {
        if (state.gameOver || state.isPaused || !state.currentPiece) return false;

        const newX = state.currentX + dx;
        const newY = state.currentY + dy;

        if (!collision(newX, newY, state.currentPiece)) {
            state.currentX = newX;
            state.currentY = newY;
            return true;
        }
        return false;
    }

    // Вращение фигуры
    function rotate() {
        if (state.gameOver || state.isPaused || !state.currentPiece) return;

        const rotated = state.currentPiece.shape[0].map((_, i) =>
            state.currentPiece.shape.map(row => row[i]).reverse()
        );

        const previousShape = state.currentPiece.shape;
        state.currentPiece.shape = rotated;

        if (collision(state.currentX, state.currentY, state.currentPiece)) {
            state.currentPiece.shape = previousShape;
        }
    }

    // Игровой цикл
    function update(time = 0) {
        if (state.gameOver || state.isPaused) return;

        const deltaTime = time - state.lastTime;
        state.lastTime = time;

        state.dropCounter += deltaTime;
        if (state.dropCounter > state.dropInterval) {
            if (!move(0, 1)) {
                merge();
            }
            state.dropCounter = 0;
        }

        drawBoard();
        drawPiece(state.currentPiece, state.currentX, state.currentY, ctx);
        drawNextPiece();

        if (!state.gameOver) {
            state.animationFrame = requestAnimationFrame(update);
        }
    }

    // Обработка клавиш
    function handleKeyPress(event) {
        if (state.gameOver) return;

        switch (event.keyCode) {
            case 37: // Влево
                move(-1, 0);
                break;
            case 39: // Вправо
                move(1, 0);
                break;
            case 40: // Вниз
                move(0, 1);
                break;
            case 38: // Вверх (вращение)
                rotate();
                break;
            case 32: // Пробел (быстрое падение)
                while (move(0, 1)) {}
                merge();
                break;
        }
    }

    // Управление игрой
    function start() {
        // Отменяем предыдущую анимацию, если она есть
        if (state.animationFrame) {
            cancelAnimationFrame(state.animationFrame);
        }

        // Инициализируем канвасы, если нужно
        if (!state.isInitialized) {
            initCanvas();
            document.addEventListener('keydown', handleKeyPress);
            state.isInitialized = true;
        }

        // Сбрасываем состояние игры
        state = {
            board: Array(ROWS).fill().map(() => Array(COLS).fill(0)),
            currentPiece: createPiece(),
            nextPiece: createPiece(),
            currentX: Math.floor(COLS / 2) - Math.floor(state.currentPiece.shape[0].length / 2),
            currentY: 0,
            score: 0,
            gameOver: false,
            isPaused: false,
            dropCounter: 0,
            dropInterval: 1000,
            lastTime: 0,
            isInitialized: true,
            animationFrame: null
        };

        document.getElementById('tetris-score').textContent = '0';
        update();
    }

    function pause() {
        state.isPaused = !state.isPaused;
        if (!state.isPaused) {
            update();
        }
    }

    // Инициализация
    function init() {
        if (!state.isInitialized) {
            initCanvas();
            document.addEventListener('keydown', handleKeyPress);
            state.isInitialized = true;
        }
        start();
    }

    return {
        init,
        start,
        pause
    };
})(); 