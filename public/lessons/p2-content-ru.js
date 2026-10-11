// Russian translations for the Paper 2/Paper 4 pseudocode challenges shared
// by as-level.html and a-level.html (both use P2_CHALLENGES, keyed by
// "mod" alone — no separate name field). Starter code and check() stay
// English, per project convention (code stays English). a-level.html has
// 16 extra challenges beyond the 6 as-level.html also uses; both are
// covered here from one shared table.
window.P2_RU_TEXT = {
  REC1: {
    text: '<strong>Рекурсия — Факториал</strong><br>Напиши рекурсивную FUNCTION <code>Factorial(n : INTEGER) RETURNS INTEGER</code>. Базовый случай: если n ≤ 1, вернуть 1. Выведи (OUTPUT) Factorial(6). Ожидается: <strong>720</strong>.',
    hints: ['FUNCTION Factorial(n : INTEGER) RETURNS INTEGER', 'IF n <= 1 THEN RETURN 1 ELSE RETURN n * Factorial(n - 1) ENDIF', 'ENDFUNCTION / OUTPUT Factorial(6)'],
  },
  REC2: {
    text: '<strong>Рекурсия — Фибоначчи</strong><br>Напиши рекурсивную FUNCTION <code>Fib(n : INTEGER) RETURNS INTEGER</code>. Базовые случаи: Fib(0) = 0, Fib(1) = 1. Рекурсивный случай: Fib(n-1) + Fib(n-2).<br>Выведи (OUTPUT) Fib(8). Ожидается: <strong>21</strong>.',
    hints: ['IF n = 0 THEN RETURN 0', 'ELSEIF n = 1 THEN RETURN 1', 'ELSE RETURN Fib(n - 1) + Fib(n - 2)'],
  },
  REC3: {
    text: '<strong>Рекурсия — Сумма массива</strong><br>Напиши FUNCTION <code>SumArr(arr : ARRAY[1:5] OF INTEGER, n : INTEGER) RETURNS INTEGER</code>, рекурсивно суммирующую первые n элементов.<br>Заполни arr значениями [3,7,2,9,4] и вызови SumArr(arr, 5). Ожидается: <strong>25</strong>.',
    hints: ['Базовый случай: IF n = 0 THEN RETURN 0', 'Рекурсивный: RETURN arr[n] + SumArr(arr, n - 1)', 'SumArr(arr, 5) = arr[5] + SumArr(arr, 4) = 4 + 9 + 2 + 7 + 3 = 25'],
  },
  OOP1: {
    text: '<strong>ООП — Класс с методом</strong><br>Смоделируй класс <code>Counter</code>. Используй глобальные переменные <code>counterValue</code> и процедуры <code>Counter_Init</code>, <code>Counter_Increment</code>, <code>Counter_Get</code> (которая выводит значение).<br>Инициализируй в 0, увеличь 5 раз, затем вызови Get. Ожидается: <strong>5</strong>.',
    hints: ['DECLARE counterValue : INTEGER', 'PROCEDURE Counter_Init — counterValue ← 0', 'PROCEDURE Counter_Increment — counterValue ← counterValue + 1', 'PROCEDURE Counter_Get — OUTPUT counterValue'],
  },
  OOP2: {
    text: '<strong>ООП — Наследование</strong><br>Построй базовый класс <code>Shape</code> с атрибутом <code>colour</code> и <code>Circle</code>, расширяющий его атрибутом <code>radius</code>.<br>Создай Circle (colour "Red", radius 7). Вызови процедуру <code>Circle_Area</code>, выводящую площадь, округлённую до 2 знаков. Ожидаемая площадь ≈ <strong>153.94</strong>.',
    hints: ['DECLARE shapeColour : STRING, circleRadius : REAL', 'PROCEDURE Circle_New(BYVAL c : STRING, BYVAL r : REAL) — установи shapeColour ← c, circleRadius ← r', 'PROCEDURE Circle_Area() — OUTPUT ROUND(3.14159 * circleRadius ^ 2, 2)'],
  },
  STK1: {
    text: '<strong>Стек с указателем стека</strong><br>Реализуй стек, используя ARRAY[0:7] OF INTEGER и указатель стека SP (−1 = пусто).<br>Напиши процедуры/функции Push и Pop. Добавь 4 значения: 10, 30, 20, 50. Извлеки два раза и выведи оба значения. Ожидается: <strong>50</strong>, затем <strong>20</strong>.',
    hints: ['DECLARE stack : ARRAY[0:7] OF INTEGER; DECLARE sp : INTEGER; sp ← -1', 'PROCEDURE Push(BYVAL val : INTEGER): sp ← sp+1; stack[sp] ← val', 'FUNCTION Pop() RETURNS INTEGER: v ← stack[sp]; sp ← sp-1; RETURN v'],
  },
  REC4: {
    text: '<strong>Рекурсия — Алгоритм Евклида</strong> <em>(в стиле 9618 P4)</em><br>Напиши рекурсивную FUNCTION <code>GCD(a, b : INTEGER) RETURNS INTEGER</code>, используя алгоритм Евклида: GCD(a, 0) = a, иначе GCD(b, a MOD b).<br>Выведи (OUTPUT) GCD(1071, 462). Ожидается: <strong>21</strong>.',
    hints: ['Базовый случай: IF b = 0 THEN RETURN a', 'Рекурсивный случай: RETURN GCD(b, a MOD b)', 'Трассировка: GCD(1071,462) → GCD(462,147) → GCD(147,21) → GCD(21,0) = 21'],
  },
  REC5: {
    text: '<strong>Рекурсия — Бинарный поиск</strong> <em>(в стиле 9618 P4)</em><br>Отсортированный массив содержит [2,5,8,12,16,23,38,56]. Напиши рекурсивную FUNCTION <code>Search(target, low, high : INTEGER) RETURNS INTEGER</code>, возвращающую <em>индекс</em> цели или −1, если её нет.<br>Выведи Search(23,1,8), затем Search(40,1,8). Ожидается: <strong>6</strong>, затем <strong>-1</strong>.',
    hints: ['IF low > high THEN RETURN -1 (не найдено)', 'mid ← (low + high) DIV 2 — сравни arr[mid] с target', 'Если arr[mid] < target, ищи в ПРАВОЙ половине: Search(target, mid+1, high); иначе в ЛЕВОЙ'],
  },
  REC6: {
    text: '<strong>Рекурсия — Ханойская башня</strong><br>Минимальное число ходов для n дисков удовлетворяет: Moves(1) = 1, Moves(n) = 2 × Moves(n−1) + 1.<br>Напиши рекурсивную функцию и выведи Moves(6). Ожидается: <strong>63</strong>.',
    hints: ['Базовый случай: IF n = 1 THEN RETURN 1', 'Рекурсивный случай: RETURN 2 * Moves(n - 1) + 1', 'Это 2ⁿ − 1 — экспоненциальный рост O(2ⁿ), классический вопрос про сложность на экзамене'],
  },
  REC7: {
    text: '<strong>Рекурсия — Мемоизация</strong> <em>(приём высшего уровня)</em><br>Наивный Fib(20) делает ~13000 вызовов и превышает лимит шагов. Используй массив memo (инициализированный −1), чтобы каждое значение вычислялось только раз.<br>Выведи (OUTPUT) Fib(20). Ожидается: <strong>6765</strong>.',
    hints: ['DECLARE memo : ARRAY[0:20] OF INTEGER — сначала заполни -1 в цикле FOR', 'Внутри Fib: IF memo[n] <> -1 THEN RETURN memo[n] (уже вычислено)', 'Сохрани перед возвратом: memo[n] ← Fib(n-1) + Fib(n-2), затем RETURN memo[n]'],
  },
  SRT1: {
    text: '<strong>Сортировка — Сортировка вставками</strong> <em>(любимое задание Paper 4)</em><br>Отсортируй [8,3,5,1,9,2] по возрастанию сортировкой вставками, затем выведи значения в одну строку через пробел.<br>Ожидается: <strong>1 2 3 5 8 9</strong>.<br><em>⚠ Этот интерпретатор не использует укороченное вычисление AND — используй булев флаг во внутреннем цикле (стандартный для экзамена приём).</em>',
    hints: ['FOR i ← 2 TO 6: key ← a[i], j ← i-1, затем сдвигай большие значения вправо', 'Внутренний цикл: WHILE j >= 1 AND done = FALSE — проверяй a[j] > key ВНУТРИ цикла с помощью IF', 'После сдвига: a[j+1] ← key. Собери строку вывода через & " " &'],
  },
  SRT2: {
    text: '<strong>Сортировка — Сортировка пузырьком с флагом</strong> <em>(балл за эффективность)</em><br>Отсортируй [2,1,3,4,5] сортировкой пузырьком, которая останавливается раньше с помощью флага <code>swapped</code>, считая проходы.<br>Выведи отсортированную строку, затем "Passes: n". Ожидается: <strong>1 2 3 4 5</strong> и <strong>Passes: 2</strong> — флаг экономит 2 лишних прохода.',
    hints: ['REPEAT … UNTIL swapped = FALSE, сбрасывая swapped ← FALSE на каждом проходе', 'Внутри: FOR i ← 1 TO 4 — меняй местами соседние пары не в порядке, установи swapped ← TRUE', 'Почти отсортированный массив завершается за 2 прохода вместо 4 — это и есть экзаменационный момент'],
  },
  SRT3: {
    text: '<strong>Сортировка — Этап слияния</strong> <em>(суть сортировки слиянием)</em><br>Слей отсортированные массивы A=[2,5,9] и B=[1,6,7] в один отсортированный массив из 6 элементов, используя технику двух указателей — пересортировка не допускается.<br>Выведи объединённую строку. Ожидается: <strong>1 2 5 6 7 9</strong>.',
    hints: ['Два указателя i, j, начинающиеся с 1; каждый раз бери меньшее из a[i], b[j]', 'WHILE i <= 3 AND j <= 3 DO — копируй меньшее в m[k], продвигай этот указатель', 'После этого скопируй остатки сначала из a, затем из b (ещё два цикла WHILE)'],
  },
  ADT1: {
    text: '<strong>АТД — Связный список (реализация на массиве)</strong> <em>(классика 9618 P4)</em><br>Отсортированный связный список 10→20→30 хранится в массивах <code>data[]</code> и <code>nxt[]</code> (0 = нулевой указатель). Вставь <strong>15</strong> в узел 4, чтобы список оставался отсортированным, затем пройди его от <code>startPtr</code>.<br>Ожидается: <strong>10 15 20 30</strong>.<br><em>⚠ Назови массив указателей <code>nxt</code> — NEXT является зарезервированным словом.</em>',
    hints: ['Пройди p от startPtr, пока существует следующий узел и его data < 15 (используй флаг поиска — без укороченного AND)', 'Вставка: nxt[newNode] ← nxt[p], затем nxt[p] ← newNode — ПОРЯДОК ВАЖЕН', 'Обход: p ← startPtr; WHILE p <> 0 → добавь data[p], p ← nxt[p]'],
  },
  ADT2: {
    text: '<strong>АТД — Удаление из связного списка</strong><br>Список 10→20→30→40 в <code>data[]</code>/<code>nxt[]</code>. Удали узел со значением <strong>20</strong>, перенаправив указатель предыдущего узла мимо него, затем пройди список.<br>Ожидается: <strong>10 30 40</strong>.',
    hints: ['Найди узел ПЕРЕД тем, который нужно удалить (data[nxt[p]] = 20), используя флаг-цикл', 'Обход: nxt[p] ← nxt[nxt[p]] — удалённый узел просто отключается от списка', 'Узел всё ещё находится в массиве — в реальном распределителе памяти он ушёл бы в список свободных'],
  },
  ADT3: {
    text: '<strong>АТД — Обход двоичного дерева поиска</strong> <em>(в стиле 9618 P4)</em><br>BST хранится в массивах <code>val[]</code>, <code>left[]</code>, <code>right[]</code> (0 = null). Корень — узел 1 (значение 15).<br>Напиши рекурсивную PROCEDURE <code>InOrder(node)</code> — левое поддерево, посещение, правое поддерево — собирая одну строку вывода.<br>Ожидается: <strong>3 8 12 15 20 27</strong> (симметричный обход всегда даёт отсортированный вывод — объясни почему на экзамене!).',
    hints: ['IF node <> 0 THEN: рекурсия left[node], посещение val[node], рекурсия right[node]', 'При посещении добавляй к общей строке (с пробелом-разделителем)', 'Симметричный обход BST посещает значения в порядке возрастания — пояснение на 1 балл'],
  },
  ADT4: {
    text: '<strong>АТД — Циклическая очередь</strong> <em>(в стиле 9618 P4)</em><br>Реализуй циклическую очередь вместимостью 5 с <code>front</code>, <code>rear</code>, <code>count</code>. Добавление использует <code>(rear + 1) MOD 5</code>, чтобы очередь закольцовывалась.<br>Добавь A,B,C → удали два раза (выведи каждое) → добавь D,E,F → выведи q[rear].<br>Ожидается: <strong>A</strong>, <strong>B</strong>, <strong>F</strong> — F занял освободившееся место.',
    hints: ['Добавление: rear ← (rear + 1) MOD 5; q[rear] ← item; count ← count + 1', 'Удаление: item ← q[front]; front ← (front + 1) MOD 5; count ← count - 1', 'Проверяй count = 5 (полна) / count = 0 (пуста) — НЕ позиции указателей'],
  },
  ADT5: {
    text: '<strong>АТД — Вычисление постфиксной записи (ОПЗ)</strong> <em>(вопрос высшего уровня про стек)</em><br>Вычисли постфиксное выражение <code>5 1 2 + 4 * + 3 -</code>, используя стек: операнды помещаются в стек; оператор извлекает два значения, применяет операцию, помещает результат обратно.<br>Выведи финальную верхушку стека. Ожидается: <strong>14</strong> — эквивалент 5 + ((1+2) × 4) − 3.',
    hints: ['Если токен — оператор: y ← pop, x ← pop (ПОРЯДОК важен для - и /), push x op y', 'Иначе push STR_TO_NUM(token)', 'Трассировка: 5 | 5 1 | 5 1 2 | 5 3 | 5 3 4 | 5 12 | 17 | 17 3 | 14'],
  },
  HSH1: {
    text: '<strong>Хеширование — Разрешение коллизий</strong> <em>(в стиле 9618 P4)</em><br>Вставь ключи 7, 14, 21, 3 в таблицу размера 7, используя <code>hash(k) = k MOD 7</code> и <strong>линейное пробирование</strong> — 7, 14 и 21 ВСЕ хешируются в слот 0.<br>Выведи итоговую таблицу как пары <code>index:value</code> (- для пустых).<br>Ожидается: <strong>0:7 1:14 2:21 3:3 4:- 5:- 6:-</strong>.',
    hints: ['Сначала инициализируй каждый слот значением -1 (маркер пустоты)', 'idx ← k MOD 7, затем WHILE table[idx] <> -1 → idx ← (idx + 1) MOD 7', '7→слот 0; 14→0 занят→1; 21→0,1 заняты→2; 3→слот 3 свободен'],
  },
  STR1: {
    text: '<strong>Строки — Рекурсивная палиндром-проверка</strong><br>Напиши рекурсивную FUNCTION <code>IsPal(s : STRING) RETURNS BOOLEAN</code>: длина ≤ 1 → TRUE; первый ≠ последний символ → FALSE; иначе рекурсия на середину.<br>Проверь "RACECAR", затем "LEVELS". Ожидается: <strong>YES</strong>, затем <strong>NO</strong>.<br><em>Подсказка: середина s — это <code>LEFT(RIGHT(s, LENGTH(s)-1), LENGTH(s)-2)</code>.</em>',
    hints: ['Базовый случай: IF LENGTH(s) <= 1 THEN RETURN TRUE', 'Сравни концы: IF LEFT(s,1) <> RIGHT(s,1) THEN RETURN FALSE', 'Отрежь оба конца и рекурсия: RETURN IsPal(LEFT(RIGHT(s, LENGTH(s)-1), LENGTH(s)-2))'],
  },
  STR2: {
    text: '<strong>Строки — Шифр Цезаря</strong> <em>(без ASC/CHR — думай как экзаменатор)</em><br>Зашифруй "HELLO" со сдвигом 3, используя строку-алфавит для поиска. Найди позицию каждой буквы в "ABC…Z" (символ i строки s — это <code>RIGHT(LEFT(s,i),1)</code>), сдвинь её по MOD 26, возьми новую букву.<br>Ожидается: <strong>KHOOR</strong>.',
    hints: ['ch ← RIGHT(LEFT(plain, i), 1) извлекает символ i', 'Найди позицию внутренним циклом FOR j ← 1 TO 26, сравнивая с алфавитом', 'Сдвиг: pos ← ((pos - 1 + 3) MOD 26) + 1 — -1/+1 обрабатывают переход Z→C при индексации с 1'],
  },
  OOP3: {
    text: '<strong>Процедуры — Параметры BYREF</strong> <em>(в стиле 9618 P4)</em><br>Напиши <code>Deposit(BYREF bal, BYVAL amt)</code> и <code>Withdraw(BYREF bal, BYVAL amt)</code>. Withdraw должна отказывать (OUTPUT "Insufficient funds"), если amt &gt; bal.<br>Начни с 100, внеси 250, выведи баланс, сними 500, выведи баланс.<br>Ожидается: <strong>350</strong>, <strong>Insufficient funds</strong>, <strong>350</strong> — именно BYREF позволяет вызывающему коду увидеть изменение.',
    hints: ['BYREF bal означает, что процедура изменяет переменную ВЫЗЫВАЮЩЕГО кода', 'Deposit: bal ← bal + amt — одна строка, но работает только через BYREF', 'Withdraw: IF amt > bal THEN OUTPUT "Insufficient funds" ELSE bal ← bal - amt'],
  },

  // ── Optional bonus project (AS Level only) ───────────────────────────────
  BONUS1: {
    text: '<strong>🌟 Бонус — Симулятор банковского счёта</strong><br>Объедини процедуры в стиле ООП (Задание 4) со стеком (Задание 6) в один настоящий инструмент: банковский счёт, который может ОТМЕНИТЬ свою последнюю операцию.<br>Напиши <code>Deposit(BYVAL amt)</code> и <code>Withdraw(BYVAL amt)</code>, которые обновляют <code>balance</code> И помещают ЗНАКОВУЮ сумму в стек <code>history</code> (депозит помещает +amt, снятие помещает -amt). Напиши <code>UndoLast() RETURNS INTEGER</code>, которая извлекает последнюю запись и отменяет её эффект на balance.<br>Внеси 100, сними 30, внеси 50 (balance должен быть 120), затем UndoLast (balance должен вернуться к 70).',
    hints: [
      'Deposit: balance ← balance + amt, ПОТОМ помести +amt: histTop ← histTop + 1, history[histTop] ← amt.',
      'Withdraw: balance ← balance - amt, ПОТОМ помести -amt (ОТРИЦАТЕЛЬНОЕ значение, чтобы отмена правильно добавляла обратно): history[histTop] ← -amt.',
      'UndoLast: last ← history[histTop], histTop ← histTop - 1, balance ← balance - last, RETURN last — вычитание помещённого значения отменяет его (отмена депозита +50 вычитает 50; отмена снятия -30 вычитает -30, что ДОБАВЛЯЕТ 30 обратно).',
    ],
  },
}
