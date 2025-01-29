import { findWidget, loadTextFile } from '../shared/utils.js';
import { makeComboWidget, makeButtonWidget } from '../widgets/factories.js';
export function ListFromMultiline(nodeType) {
    const original_onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
        original_onNodeCreated?.apply(this, ...args);
        const loadButtonWidget = findWidget(this, 'load');
        const textWidget = findWidget(this, 'multiline');
        loadButtonWidget.callback = async () => {
            const loaded = await loadTextFile('text/*');
            if (loaded) {
                textWidget.value = loaded.content;
            }
        };
    };
}
export function ListFromSelection(nodeType, selection_type) {
    const isCombo = (widget) => widget.name.startsWith(`${selection_type}_`.toLowerCase());
    const findCombos = (node) => node.widgets.filter((w) => isCombo(w));
    const addCombo = (node, selectionWidget) => {
        const index = findCombos(node).length;
        const width = node.size[0];
        const widget = makeComboWidget(node, `${selection_type}_${index}`.toLowerCase(), ['none', ...selectionWidget.all], 0);
        node.setSize([width, node.size[1]]);
        widget.label = `${selection_type} #${index + 1}`;
        widget.options.serialize = false;
        return widget;
    };
    const refreshSelection = (node, selectionWidget) => {
        const selected = [];
        let widgetIndex = 0;
        let comboIndex = 0;
        while (widgetIndex < node.widgets.length) {
            const widget = node.widgets[widgetIndex];
            if (!isCombo(widget)) {
                widgetIndex += 1;
                continue;
            }
            if (widget.selected === 0) {
                node.widgets.splice(widgetIndex, 1);
                continue;
            }
            widget.name = `${selection_type}_${comboIndex}`.toLowerCase();
            widget.label = `${selection_type} #${comboIndex + 1}`;
            selected.push(widget.value);
            widgetIndex += 1;
            comboIndex += 1;
        }
        const last = addCombo(node, selectionWidget);
        last.onSelected = () => {
            refreshSelection(node, selectionWidget);
        };
        selectionWidget.value = { selected };
    };
    const refreshFromSelection = (node, selectionWidget) => {
        let widgetIndex = 0;
        while (widgetIndex < node.widgets.length) {
            const widget = node.widgets[widgetIndex];
            if (isCombo(widget)) {
                node.widgets.splice(widgetIndex, 1);
                continue;
            }
            widgetIndex += 1;
        }
        const selected = selectionWidget.value.selected;
        for (const value of selected) {
            const widget = addCombo(node, selectionWidget);
            widget.value = value;
            widget.callback(widget.value);
            widget.onSelected = () => {
                refreshSelection(node, selectionWidget);
            };
        }
        const last = addCombo(node, selectionWidget);
        last.onSelected = () => {
            refreshSelection(node, selectionWidget);
        };
    };
    const original_onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
        original_onNodeCreated?.apply(this, ...args);
        const selectionWidget = findWidget(this, 'selection');
        refreshFromSelection(this, selectionWidget);
    };
    const original_onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function (...args) {
        original_onConfigure?.apply(this, ...args);
        const selectionWidget = findWidget(this, 'selection');
        refreshFromSelection(this, selectionWidget);
    };
}
export function ListRandomSeeds(nodeType) {
    const reset = (widget) => {
        widget.value = new Date().getTime();
    };
    const original_onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
        original_onNodeCreated?.apply(this, ...args);
        const resetBtn = makeButtonWidget(this, 'reset_btn', 'Reset', {
            tooltip: 'reset seeds',
        });
        resetBtn.callback = () => {
            reset(resetBtn);
        };
        reset(resetBtn);
    };
    const original_onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function (...args) {
        original_onConfigure?.apply(this, ...args);
        const resetBtn = findWidget(this, 'reset_btn');
        if (resetBtn)
            reset(resetBtn);
    };
}
