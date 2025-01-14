import { app } from '../../../../../scripts/app.js';
import { fetchApi, findWidget } from '../../shared/utils.js';
import { checkNodeConfig } from '../../shared/experimental/config.node.js';
import { log } from '../../shared/common.js';
export const MULTICONFIG_NODE_BY = {
    id: 'ID (recommended)',
    title: 'title',
    name: 'name (for S&R)',
};
export const MULTICONFIG_CHECK_LEVELS = {
    any: 'any error: unknown node / widget, value not matching widget type, ...',
    config_only: 'invalid config only (ex. value as list)',
    none: 'none: apply as much as possible',
};
export async function fetchMultiConfig(thisNode, nodeBy, format) {
    const data = {};
    const duplicates = new Set();
    const getNodeKey = (() => {
        switch (nodeBy) {
            case 'id':
                return (otherNode) => String(otherNode.id);
            case 'title':
                return (otherNode) => otherNode.title;
            case 'name':
                return (otherNode) => otherNode.type;
        }
    })();
    for (const otherNode of thisNode.graph._nodes) {
        if (otherNode === thisNode)
            continue;
        const key = getNodeKey(otherNode);
        if (Object.keys(data).includes(key)) {
            duplicates.add(key);
            continue;
        }
        data[key] = otherNode.widgets.reduce((acc, w) => {
            acc[w.name] = w.value;
            return acc;
        }, {});
    }
    for (const dup of duplicates.values())
        delete data[dup];
    let body = undefined;
    try {
        body = await fetchApi('config_convert', 'POST', {
            data,
            format,
        });
    }
    catch (error) {
        return 'Internal error: ' + error.message;
    }
    return body.prettified;
}
function findNodes(key, prop) {
    const found = [];
    for (const node of app.graph._nodes) {
        if (node[prop] === key)
            found.push(node);
    }
    return found;
}
function lookupNodes(key) {
    const strKey = String(key);
    if (!isNaN(+strKey) && Number.isInteger(+strKey)) {
        const node = app.graph._nodes_by_id[+strKey];
        return node ? [node] : [];
    }
    return [...findNodes(strKey, 'title'), ...findNodes(strKey, 'type')];
}
export async function applyMultiConfig(config, checkLevel) {
    if (!config)
        return;
    let body = undefined;
    try {
        body = await fetchApi('config_validate', 'POST', {
            raw: config,
            schema: 'config.multi',
        });
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
    const apiData = body.data;
    const apiErrors = body.errors || [];
    const rawErrors = {};
    for (const [errorScope, errorType] of apiErrors) {
        if (!Object.keys(rawErrors).includes(errorScope[0]))
            rawErrors[errorScope[0]] = {};
        rawErrors[errorScope[0]][errorScope[1]] = errorType;
    }
    log.debug(checkLevel);
    log.inspect({ apiData });
    log.inspect({ rawErrors });
    log.inspect({ app });
    const errorLabels = {};
    const allParsed = {};
    const allNodes = {};
    let earlyExit = false;
    let nbErrors = 0;
    let nbParsed = 0;
    for (const nodeKey of Object.keys(apiData)) {
        const found = lookupNodes(nodeKey);
        if (found.length === 0) {
            errorLabels[nodeKey] = ['node not found'];
            nbErrors += 1;
            continue;
        }
        else if (found.length > 1) {
            errorLabels[nodeKey] = ['multiple nodes found - skipped'];
            nbErrors += 1;
            continue;
        }
        if (!apiData[nodeKey])
            continue;
        allNodes[nodeKey] = found[0];
        const checked = checkNodeConfig(found[0], apiData[nodeKey], rawErrors[nodeKey] || {}, checkLevel);
        allParsed[nodeKey] = checked.parsed;
        nbParsed += checked.parsed.size;
        for (const [widgetName, errorLabel] of Object.entries(checked.errorLabels)) {
            if (!errorLabels[nodeKey])
                errorLabels[nodeKey] = [];
            errorLabels[nodeKey].push(`'${widgetName}': ${errorLabel}`);
            nbErrors += 1;
        }
        if (checked.earlyExit)
            earlyExit = true;
    }
    if (nbParsed === 0 || earlyExit || (nbErrors > 0 && checkLevel === 'any')) {
        return {
            success: 'partial',
            data: {},
            nbErrors,
            errors: errorLabels,
            applied: false,
        };
    }
    for (const [nodeKey, parsed] of Object.entries(allParsed)) {
        const targetNode = allNodes[nodeKey];
        if (!targetNode)
            continue;
        const widgetNames = Array.from(parsed.keys());
        for (const name of widgetNames) {
            const widget = findWidget(targetNode, name);
            if (!widget)
                continue;
            try {
                widget.value = parsed.get(name);
                if (widget.callback)
                    await widget.callback(widget.value);
            }
            catch (e) {
                if (!errorLabels[nodeKey])
                    errorLabels[nodeKey] = [];
                errorLabels[nodeKey].push(`'${name}': Unknown error: ${e}`);
                nbErrors += 1;
                allParsed[nodeKey].delete(name);
                nbParsed -= 1;
            }
        }
    }
    if (nbParsed === 0)
        return {
            success: 'partial',
            data: {},
            nbErrors,
            errors: errorLabels,
            applied: false,
        };
    const parsedDict = {};
    for (const [nodeKey, parsed] of Object.entries(allParsed)) {
        parsedDict[nodeKey] = Object.fromEntries(parsed);
    }
    if (nbErrors > 0)
        return {
            success: 'partial',
            data: parsedDict,
            nbErrors: nbErrors,
            errors: errorLabels,
            applied: true,
        };
    return {
        success: true,
        data: parsedDict,
        applied: true,
    };
}
