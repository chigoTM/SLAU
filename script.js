// ---------- Утилиты для работы с дробями ----------
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        [a, b] = [b, a % b];
    }
    return a || 1;
}

function makeFraction(numerator, denominator = 1) {
    if (denominator === 0) throw new Error('Деление на ноль');
    if (denominator < 0) {
        numerator = -numerator;
        denominator = -denominator;
    }
    const g = gcd(numerator, denominator);
    return { num: numerator / g, den: denominator / g };
}

function fracAdd(a, b) {
    return makeFraction(a.num * b.den + b.num * a.den, a.den * b.den);
}

function fracSub(a, b) {
    return makeFraction(a.num * b.den - b.num * a.den, a.den * b.den);
}

function fracMul(a, b) {
    return makeFraction(a.num * b.num, a.den * b.den);
}

function fracDiv(a, b) {
    if (b.num === 0) throw new Error('Деление на ноль');
    return makeFraction(a.num * b.den, a.den * b.num);
}

function fracIsZero(a) {
    return a.num === 0;
}

function fracToString(a) {
    if (a.den === 1) return String(a.num);
    return `${a.num}/${a.den}`;
}

// Только неправильные дроби: 7/3, -5/2, 0, 4
function fracToHTML(a) {
    if (a.den === 1) return String(a.num);
    const sign = a.num < 0 ? '−' : '';
    const n = Math.abs(a.num);
    return `${sign}<span class="frac"><span class="num">${n}</span><span class="den">${a.den}</span></span>`;
}

// ---------- Работа с матрицей ----------
function cloneMatrix(M) {
    return M.map(row => row.map(cell => ({ num: cell.num, den: cell.den })));
}

function renderMatrixHTML(M, pivotRow = -1, pivotCol = -1) {
    const n = M.length;
    const m = M[0].length;
    let html = '<table class="sol-matrix">';
    for (let i = 0; i < n; i++) {
        html += '<tr>';
        html += '<td class="bracket">[</td>';
        for (let j = 0; j < m; j++) {
            const isRight = j === m - 1;
            const isPivot = (i === pivotRow && j === pivotCol);
            const cls = ['cell'];
            if (isRight) cls.push('right-part');
            if (isPivot) cls.push('pivot');
            html += `<td class="${cls.join(' ')}">${fracToHTML(M[i][j])}</td>`;
        }
        html += '<td class="bracket">]</td>';
        html += '</tr>';
    }
    html += '</table>';
    return html;
}

// ---------- Метод Гаусса-Жордана ----------
function solveGaussJordan(A) {
    const n = A.length;
    const m = A[0].length; // n + 1
    const M = cloneMatrix(A);
    const steps = [];

    steps.push({
        title: 'Исходная расширенная матрица',
        text: `Система ${n} уравнений с ${n} неизвестными. Приводим расширенную матрицу к единичной форме.`,
        matrix: cloneMatrix(M)
    });

    for (let col = 0; col < n; col++) {
        let pivotRow = -1;
        for (let r = col; r < n; r++) {
            if (!fracIsZero(M[r][col])) {
                pivotRow = r;
                break;
            }
        }

        if (pivotRow === -1) {
            steps.push({
                title: `Столбец ${col + 1}`,
                text: `В столбце ${col + 1} (начиная со строки ${col + 1}) нет ненулевых элементов. Система либо несовместна, либо имеет бесконечно много решений.`,
                matrix: cloneMatrix(M),
                noSolution: true
            });
            return { steps, solution: null, status: 'no-solution' };
        }

        if (pivotRow !== col) {
            [M[col], M[pivotRow]] = [M[pivotRow], M[col]];
            steps.push({
                title: `Шаг ${steps.length}: перестановка строк`,
                text: `Меняем местами строки ${col + 1} и ${pivotRow + 1}, чтобы на диагонали оказался ненулевой элемент.`,
                matrix: cloneMatrix(M),
                pivotRow: col,
                pivotCol: col
            });
        }

        const pivot = M[col][col];
        if (!(pivot.num === 1 && pivot.den === 1)) {
            const inv = fracDiv(makeFraction(1, 1), pivot);
            for (let j = 0; j < m; j++) {
                M[col][j] = fracMul(M[col][j], inv);
            }
            steps.push({
                title: `Шаг ${steps.length}: нормировка строки ${col + 1}`,
                text: `Делим строку ${col + 1} на ведущий элемент <b>${fracToHTML(pivot)}</b>, чтобы получить единицу на диагонали.`,
                matrix: cloneMatrix(M),
                pivotRow: col,
                pivotCol: col
            });
        }

        let eliminated = false;
        for (let r = 0; r < n; r++) {
            if (r === col) continue;
            if (fracIsZero(M[r][col])) continue;
            const factor = M[r][col];
            for (let j = 0; j < m; j++) {
                M[r][j] = fracSub(M[r][j], fracMul(factor, M[col][j]));
            }
            eliminated = true;
        }

        if (eliminated) {
            steps.push({
                title: `Шаг ${steps.length}: обнуление столбца ${col + 1}`,
                text: `Вычитаем из остальных строк строку ${col + 1}, умноженную на соответствующие коэффициенты, чтобы получить нули в столбце ${col + 1}.`,
                matrix: cloneMatrix(M),
                pivotRow: col,
                pivotCol: col
            });
        }
    }

    for (let i = 0; i < n; i++) {
        let allZero = true;
        for (let j = 0; j < n; j++) {
            if (!fracIsZero(M[i][j])) { allZero = false; break; }
        }
        if (allZero && !fracIsZero(M[i][n])) {
            steps.push({
                title: 'Проверка совместности',
                text: `В строке ${i + 1} все коэффициенты при неизвестных равны нулю, а свободный член — нет. Система <b>несовместна</b> (решений нет).`,
                matrix: cloneMatrix(M),
                noSolution: true
            });
            return { steps, solution: null, status: 'no-solution' };
        }
    }

    for (let i = 0; i < n; i++) {
        let allZero = true;
        for (let j = 0; j < n; j++) {
            if (!fracIsZero(M[i][j])) { allZero = false; break; }
        }
        if (allZero) {
            steps.push({
                title: 'Проверка совместности',
                text: `Строка ${i + 1} полностью нулевая. Система имеет <b>бесконечно много решений</b>.`,
                matrix: cloneMatrix(M),
                noSolution: true
            });
            return { steps, solution: null, status: 'infinite' };
        }
    }

    const solution = [];
    for (let i = 0; i < n; i++) {
        solution.push(M[i][n]);
    }

    steps.push({
        title: 'Результат',
        text: 'Матрица приведена к единичной форме. Столбец свободных членов содержит значения неизвестных.',
        matrix: cloneMatrix(M)
    });

    return { steps, solution, status: 'ok' };
}

// ---------- UI ----------
const sizeSelect = document.getElementById('size');
const buildBtn = document.getElementById('buildMatrix');
const solveBtn = document.getElementById('solveBtn');
const exampleBtn = document.getElementById('exampleBtn');
const clearBtn = document.getElementById('clearBtn');
const container = document.getElementById('matrixInputContainer');
const errorDiv = document.getElementById('error');
const solutionDiv = document.getElementById('solution');

function buildMatrixInputs() {
    const n = parseInt(sizeSelect.value, 10);
    let html = '<table class="matrix-input"><tbody>';
    for (let i = 0; i < n; i++) {
        html += '<tr>';
        for (let j = 0; j < n; j++) {
            html += `<td><input type="text" step="any" id="m_${i}_${j}" placeholder="a${i + 1}${j + 1}" value="0"></td>`;
        }
        html += '<td class="divider">|</td>';
        html += `<td><input type="number" step="any" id="m_${i}_${n}" placeholder="b${i + 1}" value="0"></td>`;
        html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
    solutionDiv.innerHTML = '';
    errorDiv.textContent = '';
}

function readMatrix() {
    const n = parseInt(sizeSelect.value, 10);
    const M = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j <= n; j++) {
            const inp = document.getElementById(`m_${i}_${j}`);
            const val = parseFloat(inp.value.replace(',', '.'));
            if (isNaN(val)) {
                throw new Error(`Некорректное число в ячейке (${i + 1}, ${j + 1})`);
            }
            row.push(decimalToFraction(val));
        }
        M.push(row);
    }
    return M;
}

function decimalToFraction(x) {
    if (Number.isInteger(x)) return makeFraction(x, 1);
    const str = String(x);
    if (str.includes('.')) {
        const [intPart, fracPart] = str.split('.');
        const den = Math.pow(10, fracPart.length);
        const num = parseInt(intPart + fracPart, 10);
        return makeFraction(num, den);
    }
    return makeFraction(x, 1);
}

function displaySolution(result) {
    solutionDiv.innerHTML = '';

    result.steps.forEach((step, idx) => {
        const div = document.createElement('div');
        div.className = 'step';
        let html = `<h3>${idx + 1}. ${step.title}</h3>`;
        html += `<p>${step.text}</p>`;
        html += renderMatrixHTML(step.matrix, step.pivotRow, step.pivotCol);
        div.innerHTML = html;
        solutionDiv.appendChild(div);
    });

    if (result.status === 'ok') {
        const n = result.solution.length;
        let html = '<div class="result"><h3>Ответ</h3><ul>';
        for (let i = 0; i < n; i++) {
            html += `<li>x<sub>${i + 1}</sub> = ${fracToHTML(result.solution[i])}</li>`;
        }
        html += '</ul></div>';
        solutionDiv.insertAdjacentHTML('beforeend', html);
    } else if (result.status === 'no-solution') {
        solutionDiv.insertAdjacentHTML('beforeend',
            '<div class="no-solution">Система не имеет решений (несовместна).</div>');
    } else if (result.status === 'infinite') {
        solutionDiv.insertAdjacentHTML('beforeend',
            '<div class="no-solution">Система имеет бесконечно много решений.</div>');
    }
}

buildBtn.addEventListener('click', buildMatrixInputs);
sizeSelect.addEventListener('change', buildMatrixInputs);

solveBtn.addEventListener('click', () => {
    errorDiv.textContent = '';
    try {
        const M = readMatrix();
        const result = solveGaussJordan(M);
        displaySolution(result);
    } catch (e) {
        errorDiv.textContent = 'Ошибка: ' + e.message;
        solutionDiv.innerHTML = '';
    }
});

exampleBtn.addEventListener('click', () => {
    sizeSelect.value = '3';
    buildMatrixInputs();
    const vals = [
        [2, 1, -1, 8],
        [-3, -1, 2, -11],
        [-2, 1, 2, -3]
    ];
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 4; j++)
            document.getElementById(`m_${i}_${j}`).value = vals[i][j];
});

clearBtn.addEventListener('click', () => {
    const inputs = container.querySelectorAll('input');
    inputs.forEach(inp => inp.value = 0);
    solutionDiv.innerHTML = '';
    errorDiv.textContent = '';
});

// Инициализация
buildMatrixInputs();
