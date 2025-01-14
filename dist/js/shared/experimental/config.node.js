import { findWidget, fetchApi } from '../../shared/utils.js';
class ConvertError extends Error {
}
export const NODECONFIG_CHECK_LEVELS = {
    any: 'any error: unknown widget, value not matching widget type',
    config_only: 'invalid config only (ex. value as list)',
    none: 'none: apply as much as possible',
};
function convertToWidgetValue(value, widget) {
    const baseValueType = typeof value;
    if (!['string', 'number', 'boolean'].includes(baseValueType))
        throw new ConvertError('should be a string, number or boolean');
    const strValue = String(value);
    const valueTypes = [];
    if (baseValueType === 'boolean') {
        valueTypes.push('bool');
    }
    else if (baseValueType === 'number') {
        valueTypes.push('float');
        if (Number.isInteger(value))
            valueTypes.push('int');
    }
    else {
        valueTypes.push('string');
        if (strValue === 'true' || strValue === 'false') {
            valueTypes.push('bool');
        }
        else if (!isNaN(+strValue)) {
            valueTypes.push('float');
            if (Number.isInteger(+strValue))
                valueTypes.push('int');
        }
    }
    const isInt = widget.type === 'number' && widget.options?.round === 1;
    switch (widget.type) {
        case 'text':
        case 'customtext':
            if (!valueTypes.includes('string'))
                throw new ConvertError('expected a string');
            return strValue;
        case 'toggle':
            if (!valueTypes.includes('bool'))
                throw new ConvertError('expected a boolean');
            if (baseValueType === 'boolean')
                return value;
            else if (strValue === 'true')
                return true;
            else
                return false;
        case 'combo':
            if (!valueTypes.includes('string') ||
                !widget.options.values.includes(value))
                throw new ConvertError('expected one of: ' +
                    widget.options.values.map((v) => `'${v}'`).join(', '));
            return strValue;
        case 'number':
            if (isInt) {
                if (!valueTypes.includes('int'))
                    throw new ConvertError('expected an integer');
            }
            else {
                if (!valueTypes.includes('float'))
                    throw new ConvertError('expected a float');
            }
            break;
        default:
            throw new ConvertError(`unknown widget type '${widget.type}'`);
    }
    const nbValue = value;
    const widgetMin = widget.options.min;
    const widgetMax = widget.options.max;
    if ((widgetMin || widgetMin === 0) && nbValue < widgetMin)
        throw new ConvertError(`minimum value is ${widgetMin}`);
    if ((widgetMax || widgetMax === 0) && nbValue > widgetMax)
        throw new ConvertError(`maximum value is ${widgetMax}`);
    return +strValue;
}
export async function fetchNodeConfig(otherNode, format) {
    if (!otherNode)
        return '';
    const data = otherNode.widgets.reduce((acc, w) => {
        acc[w.name] = w.value;
        return acc;
    }, {});
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
export function checkNodeConfig(targetNode, apiData, rawErrors, checkLevel) {
    const parsed = new Map();
    for (const [k, val] of Object.entries(apiData)) {
        if (Object.keys(rawErrors).includes(k))
            continue;
        parsed.set(k, val);
    }
    const errorLabels = {};
    for (const key of Object.keys(rawErrors)) {
        errorLabels[key] = 'should be a string, number or boolean';
    }
    if (Object.keys(errorLabels).length > 0 &&
        ['config_only', 'any'].includes(checkLevel)) {
        return {
            parsed,
            errorLabels,
            earlyExit: true,
        };
    }
    const widgetNames = Array.from(parsed.keys());
    for (const name of widgetNames) {
        const widget = findWidget(targetNode, name);
        if (!widget) {
            errorLabels[name] = 'not found in node';
            parsed.delete(name);
            continue;
        }
        try {
            const converted = convertToWidgetValue(parsed.get(name), widget);
            parsed.set(name, converted);
        }
        catch (e) {
            const err = e;
            errorLabels[name] = err.message;
            parsed.delete(name);
        }
    }
    return {
        parsed,
        errorLabels,
        earlyExit: false,
    };
}
export async function applyNodeConfig(targetNode, config, checkLevel) {
    if (!targetNode || !config)
        return;
    let body = undefined;
    try {
        body = await fetchApi('config_validate', 'POST', {
            raw: config,
            schema: 'config.node',
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
        rawErrors[errorScope[0]] = errorType;
    }
    const checked = checkNodeConfig(targetNode, apiData, rawErrors, checkLevel);
    if (checked.earlyExit) {
        return {
            success: 'partial',
            data: {},
            nbErrors: Object.keys(checked.errorLabels).length,
            errors: checked.errorLabels,
            applied: false,
        };
    }
    if (checked.parsed.size === 0 ||
        (Object.keys(checked.errorLabels).length > 0 && checkLevel === 'any')) {
        return {
            success: 'partial',
            data: {},
            nbErrors: Object.keys(checked.errorLabels).length,
            errors: checked.errorLabels,
            applied: false,
        };
    }
    const widgetNames = Array.from(checked.parsed.keys());
    for (const name of widgetNames) {
        const widget = findWidget(targetNode, name);
        if (!widget)
            continue;
        try {
            widget.value = checked.parsed.get(name);
            if (widget.callback)
                await widget.callback(widget.value);
        }
        catch (e) {
            checked.errorLabels[name] = 'Unknown error: ' + String(e);
            checked.parsed.delete(name);
        }
    }
    if (checked.parsed.size === 0)
        return {
            success: 'partial',
            data: {},
            nbErrors: Object.keys(checked.errorLabels).length,
            errors: checked.errorLabels,
            applied: false,
        };
    if (Object.keys(checked.errorLabels).length > 0)
        return {
            success: 'partial',
            data: Object.fromEntries(checked.parsed),
            nbErrors: Object.keys(checked.errorLabels).length,
            errors: checked.errorLabels,
            applied: true,
        };
    return {
        success: true,
        data: Object.fromEntries(checked.parsed),
        applied: true,
    };
}
