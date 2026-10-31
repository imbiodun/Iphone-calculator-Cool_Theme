const display = document.getElementById("display");
const buttons = document.querySelector(".buttons");
const themeToggle = document.getElementById("theme-toggle");

let expression = "";
let justCalculated = false;

function updateDisplay(value = expression || "0") {
    display.textContent = value;
}

function clearDisplay() {
    expression = "";
    justCalculated = false;
    updateDisplay();
}

function appendValue(value) {
    if (justCalculated && /[0-9.]/.test(value)) {
        expression = "";
        justCalculated = false;
    }

    if (/[+\-*/]/.test(value)) {
        if (!expression && value !== "-") return;
        if (/[+\-*/]$/.test(expression)) {
            expression = expression.slice(0, -1) + value;
        } else {
            expression += value;
        }
    } else if (value === ".") {
        const currentNumber = expression.split(/[+\-*/]/).pop();
        if (currentNumber.includes(".") || currentNumber.endsWith("%")) return;
        expression += currentNumber ? "." : "0.";
    } else if (value === "%") {
        if (/\d$/.test(expression) && !expression.endsWith("%")) expression += value;
    } else if (/\d/.test(value)) {
        const currentNumber = expression.split(/[+\-*/]/).pop();
        if (currentNumber === "0") expression = expression.slice(0, -1);
        expression += value;
    }

    updateDisplay();
}

function backspace() {
    expression = expression.slice(0, -1);
    justCalculated = false;
    updateDisplay();
}

function toggleSign() {
    if (!expression) {
        expression = "-";
    } else if (expression.startsWith("-")) {
        expression = expression.slice(1);
    } else {
        expression = `-${expression}`;
    }
    justCalculated = false;
    updateDisplay();
}

function parse(expressionToParse) {
    let position = 0;

    function skipWhitespace() {
        while (expressionToParse[position] === " ") position += 1;
    }

    function parseExpression() {
        let value = parseTerm();
        while (true) {
            skipWhitespace();
            const operator = expressionToParse[position];
            if (operator !== "+" && operator !== "-") return value;
            position += 1;
            const right = parseTerm();
            value = operator === "+" ? value + right : value - right;
        }
    }

    function parseTerm() {
        let value = parseFactor();
        while (true) {
            skipWhitespace();
            const operator = expressionToParse[position];
            if (operator !== "*" && operator !== "/") return value;
            position += 1;
            const right = parseFactor();
            if (operator === "/" && right === 0) throw new Error("Cannot divide by zero");
            value = operator === "*" ? value * right : value / right;
        }
    }

    function parseFactor() {
        skipWhitespace();
        if (expressionToParse[position] === "+" || expressionToParse[position] === "-") {
            const sign = expressionToParse[position++] === "-" ? -1 : 1;
            return sign * parseFactor();
        }

        let value;
        if (expressionToParse[position] === "(") {
            position += 1;
            value = parseExpression();
            skipWhitespace();
            if (expressionToParse[position++] !== ")") throw new Error("Invalid expression");
        } else {
            const match = expressionToParse.slice(position).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
            if (!match) throw new Error("Invalid expression");
            value = Number(match[0]);
            position += match[0].length;
        }

        while (expressionToParse[position] === "%") {
            value /= 100;
            position += 1;
        }
        return value;
    }

    const result = parseExpression();
    skipWhitespace();
    if (position !== expressionToParse.length || !Number.isFinite(result)) {
        throw new Error("Invalid expression");
    }
    return result;
}

function formatResult(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
}

function calculate() {
    if (!expression) return;
    try {
        expression = formatResult(parse(expression));
        justCalculated = true;
        updateDisplay();
    } catch (error) {
        expression = "";
        justCalculated = true;
        updateDisplay(error.message === "Cannot divide by zero" ? "Cannot divide by 0" : "Error");
    }
}

buttons.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.action === "clear") clearDisplay();
    else if (button.dataset.action === "calculate") calculate();
    else if (button.dataset.action === "toggle-sign") toggleSign();
    else appendValue(button.dataset.value);
});

document.addEventListener("keydown", (event) => {
    const keyMap = { Enter: "calculate", Escape: "clear", Backspace: "backspace" };
    if (keyMap[event.key]) {
        event.preventDefault();
        if (keyMap[event.key] === "calculate") calculate();
        else if (keyMap[event.key] === "clear") clearDisplay();
        else backspace();
    } else if (/^[0-9.+\-*/%]$/.test(event.key)) {
        event.preventDefault();
        appendValue(event.key);
    }
});

themeToggle.addEventListener("click", () => {
    const root = document.documentElement;
    const isLight = root.dataset.theme === "light";
    root.dataset.theme = isLight ? "dark" : "light";
    themeToggle.textContent = isLight ? "☀" : "☾";
    themeToggle.setAttribute("aria-label", isLight ? "Switch to light theme" : "Switch to dark theme");
});
