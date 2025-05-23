import { isObject } from './common.js';
import { guessOutputType, compatibleTypes } from './types.js';
import { fetchApi, slotShapes, removeAllOutputs } from './utils.js';
export async function processOutputConfigLocal(node, config) {
    let body = {};
    let data = {};
    if (config) {
        try {
            body = await fetchApi('config_validate', 'POST', {
                raw: config,
                schema: 'config.output',
            });
        }
        catch (error) {
            removeAllOutputs(node);
            return {
                success: false,
                error: error.message,
            };
        }
        data = body.data;
    }
    const apiErrors = body.errors || [];
    const errors = {};
    for (const [errorScope, errorType] of apiErrors) {
        if (!Object.keys(errors).includes(errorScope[0]))
            errors[errorScope[0]] = {};
        errors[errorScope[0]][errorScope[1]] = errorType;
    }
    if (Object.keys(data).length === 0) {
        removeAllOutputs(node);
        return {
            success: false,
            error: 'No data',
        };
    }
    const parsed = new Map();
    for (const [k, entry] of Object.entries(data)) {
        if (Object.keys(errors).includes(k))
            continue;
        const key = String(k);
        let value, type;
        const extra_info = {};
        if (!isObject(entry)) {
            value = entry;
            type = guessOutputType(value);
        }
        else {
            const entryObj = entry;
            value = entryObj['value'];
            if (Object.keys(entryObj).includes('type')) {
                type = entryObj['type'];
            }
            else {
                type = guessOutputType(value);
            }
            for (const extra of ['label', 'tooltip', 'color_on', 'color_off']) {
                if (Object.keys(entryObj).includes(extra))
                    extra_info[extra] = entryObj[extra];
            }
            if (entryObj.shape && Object.keys(slotShapes).includes(entryObj.shape))
                extra_info.shape = slotShapes[entryObj.shape];
        }
        if (!extra_info.shape && type === 'LIST')
            extra_info.shape = slotShapes['grid'];
        parsed.set(key, {
            value,
            type,
            extra_info,
        });
    }
    const existingLinks = {};
    while (node.outputs?.length > 0) {
        const output = node.outputs[0];
        const entry = parsed.get(output.name);
        if (entry &&
            compatibleTypes(entry.type, output.type) &&
            entry.extra_info.label === output.label &&
            output.links &&
            output.links.length) {
            const links = [];
            for (const l of output.links) {
                const link = node.graph.links.get(l);
                if (link)
                    links.push(link);
            }
            if (links.length)
                existingLinks[output.name] = links;
        }
        node.removeOutput(0);
    }
    for (const [name, entry] of parsed.entries()) {
        node.addOutput(name, entry.type, entry.extra_info);
        const links = existingLinks[name];
        if (links) {
            for (const link of links) {
                const targetNode = node.graph._nodes_by_id[link.target_id];
                node.connect(name, targetNode, link.target_slot);
            }
        }
    }
    const errorLabels = {};
    let nbErrors = 0;
    for (const [output, props] of Object.entries(errors)) {
        errorLabels[output] = [];
        for (const [prop, errorType] of Object.entries(props)) {
            nbErrors++;
            if (errorType === 'required') {
                errorLabels[output].push(`'${prop}' is required`);
                continue;
            }
            let label = `'${prop}' `;
            switch (prop) {
                case 'type':
                    label += 'should be a string, or a list of strings';
                    break;
                case 'label':
                case 'tooltip':
                case 'color_off':
                case 'color_on':
                    label += 'should be a string';
                    break;
                case 'shape':
                    label += "should be one of: 'box', 'circle', 'arrow', 'grid'";
                    break;
            }
            errorLabels[output].push(label);
        }
    }
    if (nbErrors === 0)
        return {
            success: true,
            data: Object.fromEntries(parsed),
            applied: true,
        };
    else
        return {
            success: 'partial',
            data: Object.fromEntries(parsed),
            nbErrors,
            errors: errorLabels,
            applied: true,
        };
}
