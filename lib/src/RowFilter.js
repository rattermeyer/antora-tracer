const tokenPattern = /\s*(==|!=|\(|\)|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|[A-Za-z_][A-Za-z0-9_]*)/y;
function tokenize(expression) {
    const tokens = [];
    let offset = 0;
    while (offset < expression.length && expression.slice(offset).trim()) {
        tokenPattern.lastIndex = offset;
        const match = tokenPattern.exec(expression);
        if (!match) {
            throw new Error(`unsupported syntax at position ${offset}`);
        }
        const valueOffset = match[0].indexOf(match[1]);
        tokens.push({ value: match[1], position: offset + valueOffset });
        offset = tokenPattern.lastIndex;
    }
    return tokens;
}
export function compileRowFilter(expression) {
    const tokens = tokenize(expression);
    let cursor = 0;
    const peek = () => tokens[cursor]?.value;
    const consume = (value) => {
        if (peek() !== value)
            return false;
        cursor++;
        return true;
    };
    const expect = (value) => {
        if (consume(value))
            return;
        const token = tokens[cursor];
        throw new Error(token
            ? `expected '${value}' at position ${token.position}`
            : `expected '${value}' at end of expression`);
    };
    const expectString = () => {
        const token = tokens[cursor];
        if (!token || !/^(['"]).*\1$/s.test(token.value)) {
            throw new Error(token
                ? `expected a quoted string at position ${token.position}`
                : "expected a quoted string at end of expression");
        }
        cursor++;
        return token.value.slice(1, -1).replace(/\\([\\'"\\])/g, "$1");
    };
    const parsePrimary = () => {
        if (consume("(")) {
            const predicate = parseOr();
            expect(")");
            return predicate;
        }
        if (peek()?.startsWith("'") || peek()?.startsWith('"')) {
            const tag = expectString();
            const negated = consume("not");
            expect("in");
            expect("tags");
            return (item) => (item.tags ?? []).includes(tag) !== negated;
        }
        expect("status");
        const operator = peek();
        if (operator !== "==" && operator !== "!=") {
            throw new Error(tokens[cursor]
                ? `expected '==' or '!=' at position ${tokens[cursor].position}`
                : "expected '==' or '!=' at end of expression");
        }
        cursor++;
        const status = expectString();
        return (item) => (item.status === status) === (operator === "==");
    };
    const parseAnd = () => {
        let predicate = parsePrimary();
        while (consume("and")) {
            const left = predicate;
            const right = parsePrimary();
            predicate = (item) => left(item) && right(item);
        }
        return predicate;
    };
    const parseOr = () => {
        let predicate = parseAnd();
        while (consume("or")) {
            const left = predicate;
            const right = parseAnd();
            predicate = (item) => left(item) || right(item);
        }
        return predicate;
    };
    if (tokens.length === 0)
        throw new Error("expression must not be empty");
    const predicate = parseOr();
    if (cursor !== tokens.length) {
        throw new Error(`unsupported syntax at position ${tokens[cursor].position}`);
    }
    return predicate;
}
