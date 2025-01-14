export const CATEGORY = 'ComfyLab';
const logLevels = {
    success: { level: 0, console: 'info', emoji: '👍' },
    error: { level: 1, console: 'error', emoji: undefined },
    warn: { level: 2, console: 'warn', emoji: undefined },
    info: { level: 3, console: 'info', emoji: 'ℹ️' },
    debug: { level: 4, console: 'debug', emoji: undefined },
};
const logger = (levelType, ...args) => {
    const gt = globalThis;
    if (gt[CATEGORY]?.debug ||
        (gt[CATEGORY]?.log &&
            logLevels[gt[CATEGORY].log].level >= logLevels[levelType].level)) {
        const level = gt[CATEGORY]?.debug
            ? logLevels['debug']
            : logLevels[levelType];
        if (level.emoji)
            console[level.console](level.emoji, ...args);
        else
            console[level.console](...args);
    }
};
export const isObject = (variable) => {
    const check = Object(variable);
    return (check &&
        variable === check &&
        typeof variable !== 'function' &&
        !Array.isArray(check));
};
export const inspect = (variable) => {
    if (isObject(variable)) {
        for (const [name, val] of Object.entries(variable)) {
            console.log(`${name}: `, val);
        }
    }
    else {
        console.log(variable);
    }
};
export const log = {
    success: (...args) => logger('success', `${CATEGORY}:`, ...args),
    error: (...args) => logger('error', `${CATEGORY}:`, ...args),
    warn: (...args) => logger('warn', `${CATEGORY}:`, ...args),
    info: (...args) => logger('info', `${CATEGORY}:`, ...args),
    debug: (...args) => logger('debug', ...args),
    sep: () => {
        console.log('---------------------------------');
    },
    inspect,
};
export const success = log.success;
export const error = log.error;
export const warn = log.warn;
export const info = log.info;
export const debug = log.debug;
