export function guessOutputType(value) {
    if (Array.isArray(value))
        return 'LIST';
    else if (typeof value === 'number') {
        return Number.isInteger(value) ? ['INT', 'FLOAT'] : 'FLOAT';
    }
    else if (typeof value === 'bigint')
        return 'INT';
    else if (typeof value === 'string')
        return 'STRING';
    else if (typeof value === 'boolean')
        return 'BOOLEAN';
    else
        return '*';
}
export function compatibleTypes(type1, type2) {
    if (!Array.isArray(type1) && !Array.isArray(type2))
        return type1 === type2;
    const t1 = Array.isArray(type1) ? type1 : [type1];
    const t2 = Array.isArray(type2) ? type2 : [type2];
    if (t1.length !== t2.length)
        return false;
    for (const val of t1) {
        if (!t2.includes(val))
            return false;
    }
    return true;
}
