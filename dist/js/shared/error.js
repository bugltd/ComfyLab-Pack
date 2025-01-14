import { $el } from '../../../../scripts/ui.js';
import { log } from '../shared/common.js';
import { showErrorDialog } from '../shared/utils.js';
export async function displaySingleError(nodeTitle, errorDisplay, token1, token2 = '', displayTitle = true, displayCategory = true) {
    let message = '';
    switch (errorDisplay) {
        case 'browser':
            message = token2 ? `${token1}: ${token2}` : token1;
            if (displayTitle)
                log.warn(`${nodeTitle}: ${message}`);
            else if (displayCategory)
                log.warn(message);
            else
                console.warn(message);
            break;
        case 'dialog':
            message = token2 ? `${token1}: ${token2}` : token1;
            if (displayTitle)
                await showErrorDialog({
                    title: nodeTitle,
                    subtitle: '⚠️ ' + message,
                    centerSubtitle: true,
                });
            else
                await showErrorDialog({
                    subtitle: '⚠️ ' + message,
                    centerSubtitle: true,
                });
            break;
        default:
    }
}
export async function displayErrorDict(nodeTitle, errorDisplay, errorDict, message = '') {
    switch (errorDisplay) {
        case 'browser':
            if (message) {
                await displaySingleError(nodeTitle, errorDisplay, message + ':');
            }
            for (const [key, err] of Object.entries(errorDict)) {
                const errors = Array.isArray(err) ? err : [err];
                for (const error of errors) {
                    if (message)
                        await displaySingleError(nodeTitle, errorDisplay, `  - '${key}'`, String(error), false, false);
                    else
                        await displaySingleError(nodeTitle, errorDisplay, `Error in '${key}'`, String(error));
                }
            }
            break;
        case 'dialog': {
            const allErrors = [];
            for (const [key, errors] of Object.entries(errorDict)) {
                if (Array.isArray(errors)) {
                    const keyErrors = [];
                    for (const error of errors) {
                        keyErrors.push($el('li', String(error)));
                    }
                    allErrors.push($el('li', [
                        key + ':',
                        $el('ul', { style: { paddingLeft: '20px' } }, keyErrors),
                    ]));
                }
                else {
                    allErrors.push($el('li', [`'${key}': ${String(errors)}`]));
                }
            }
            await showErrorDialog({
                title: nodeTitle,
                subtitle: '⚠️ ' + message,
                centerSubtitle: true,
                content: $el('ul', { style: { margin: '0px', paddingLeft: '0px' } }, allErrors),
                centerContent: true,
            });
            break;
        }
        default:
    }
}
