import { app } from '../../../../scripts/app.js';
import { ComfyWidgets } from '../../../../scripts/widgets.js';
import { findWidget, makeWidgetAsync } from '../shared/utils.js';
export function makeTextWidget(node, name, options = {}) {
    const widgetOptions = ['multiline', 'placeholder'].reduce((obj, optKey) => {
        if (optKey in options)
            obj[optKey] = options[optKey];
        return obj;
    }, {});
    const widget = ComfyWidgets['STRING'](node, name, ['STRING', widgetOptions], app).widget;
    if (options.default)
        widget.value = options.default;
    if (options.label)
        widget.label = options.label;
    if (options.tooltip) {
        if (options.multiline)
            widget.inputEl.title = options.tooltip;
        else
            widget.tooltip = options.tooltip;
    }
    if (options.disabled) {
        if (!options.multiline)
            widget.disabled = true;
        else {
            widget.inputEl.readOnly = true;
            widget.inputEl.style.border = 'none';
            widget.inputEl.style.opacity = 0.6;
        }
    }
    if (options.multiline && options.domStyle)
        for (const [styleKey, styleValue] of Object.entries(options.domStyle)) {
            widget.inputEl.style[styleKey] = styleValue;
        }
    return widget;
}
export function makeButtonWidget(node, name, label, options = {}) {
    options = Object.assign({
        async: true,
    }, options);
    const widget = node.addWidget('button', name, 0, () => { });
    widget.label = label;
    if (options.tooltip)
        widget.tooltip = options.tooltip;
    if (options.disabled)
        widget.disabled = options.disabled;
    if (options.async)
        makeWidgetAsync(widget);
    if (options.callback)
        widget.callback = options.callback;
    return widget;
}
export function makeToggleWidget(node, name, options = {}) {
    const widgetOptions = ['default', 'label_on', 'label_off'].reduce((obj, optKey) => {
        if (optKey in options)
            obj[optKey] = options[optKey];
        return obj;
    }, {});
    const widget = ComfyWidgets['BOOLEAN'](node, name, ['STRING', widgetOptions], app).widget;
    if (options.label)
        widget.label = options.label;
    if (options.tooltip)
        widget.tooltip = options.tooltip;
    if (options.disabled)
        widget.disabled = options.disabled;
    if (options.callback)
        widget.callback = options.callback;
    return widget;
}
export function makeComboWidget(node, name, choices, defaultSelected, onSelected, tooltip) {
    const getSelected = (label) => {
        if (Array.isArray(choices))
            return choices.indexOf(label);
        else {
            for (const [key, val] of Object.entries(choices)) {
                if (val === label)
                    return key;
            }
        }
    };
    const labels = Array.isArray(choices) ? choices : Object.values(choices);
    const widget = node.addWidget('combo', name, choices[defaultSelected], () => { }, { values: labels });
    widget.choices = choices;
    widget.selected = defaultSelected;
    widget.onSelected = onSelected;
    makeWidgetAsync(widget);
    widget.callback = async (label) => {
        widget.selected = getSelected(label);
        if (widget.onSelected)
            await widget.onSelected(widget.selected, label);
    };
    if (tooltip)
        widget.tooltip = tooltip;
    const original_onNodeConfigure = node.onConfigure;
    node.onConfigure = function (...args) {
        widget.selected = getSelected(widget.value);
        original_onNodeConfigure?.apply(this, ...args);
    };
    return widget;
}
function setWidgetVisible(widget, type) {
    if (type === 'hidden') {
        widget.hidden = true;
        widget.type = 'hidden';
        widget.computedHeight = null;
        if (widget.element) {
            widget.element.style.display = 'none';
            widget.element.dataset.shouldHide = true;
        }
        widget.computeSize = () => [0, -4];
    }
    else {
        delete widget.hidden;
        delete widget.computeSize;
        widget.type = type;
        if (widget.element) {
            widget.element.style.display = null;
            widget.element.dataset.shouldHide = false;
        }
    }
}
export function makeSwitchWidget(node, name, widgetGroup1, widgetGroup2 = []) {
    const serializeWidgets = (widgetGroup) => {
        return widgetGroup
            .filter((w) => w.name !== name)
            .reduce((acc, w) => {
            acc[w.name] = w.type;
            return acc;
        }, {});
    };
    const initialValue = {
        current: true,
        states: {
            true: {
                size: undefined,
                members: serializeWidgets(widgetGroup1),
            },
            false: {
                size: undefined,
                members: serializeWidgets(widgetGroup2),
            },
        },
    };
    const widget = node.addWidget('hidden', name, initialValue, () => { });
    widget.computeSize = () => [0, -4];
    widget.switch = (value) => {
        widget.value.current = value;
        const states = widget.value.states;
        for (const [widgetName, widgetType] of Object.entries(states[value].members)) {
            const w = findWidget(node, widgetName);
            if (w) {
                setWidgetVisible(w, widgetType);
            }
        }
        for (const widgetName of Object.keys(states[!value].members)) {
            const w = findWidget(node, widgetName);
            if (w) {
                setWidgetVisible(w, 'hidden');
            }
        }
        for (const w of node.widgets) {
            delete w.y;
            delete w.last_y;
        }
        const height = states[value].size?.[1] || node.computeSize()[1];
        node.setSize([node.size[0], height]);
    };
    widget.saveSize = () => {
        widget.value.states[widget.value.current].size = [
            node.size[0],
            node.size[1],
        ];
    };
    const original_onResize = node.onResize;
    node.onResize = function (size) {
        original_onResize?.apply(this, size);
        for (const w of this.widgets) {
            delete w.y;
            delete w.last_y;
            delete w.computedHeight;
        }
        widget.saveSize();
    };
    const original_onConfigure = node.onConfigure;
    node.onConfigure = function (...args) {
        original_onConfigure?.apply(this, ...args);
        widget.switch(widget.value.current);
    };
    widget.guard = async (fct) => {
        const contentVisible = widget.value.current;
        const oldSize = [node.size[0], node.size[1]];
        const oldComputedSize = node.computeSize();
        if (contentVisible)
            widget.switch(false);
        await fct();
        if (contentVisible)
            widget.switch(true);
        const newComputedSize = node.computeSize();
        node.setSize([
            oldSize[0],
            oldSize[1] + newComputedSize[1] - oldComputedSize[1],
        ]);
    };
    widget.switch(widget.value.current);
    return widget;
}
