import { makeButtonWidget, makeComboWidget, } from '../widgets/factories.js';
import { makeWidgetAsync } from '../shared/utils.js';
import { log } from '../shared/common.js';
export function HIDDEN(node, inputName, inputData) {
    const initialValue = inputData[1].value;
    const widget = {
        type: 'HIDDEN',
        name: inputName,
        value: initialValue,
        size: [0, -4],
        computeSize: () => {
            return [0, -4];
        },
    };
    node.addCustomWidget(widget);
    return widget;
}
export function BTN(node, inputName, inputData) {
    const label = inputData[1].label || inputName;
    return makeButtonWidget(node, inputName, label, inputData[1]);
}
export function NODE_COMBO(node, name) {
    const getNodeList = (_widget, thisNode) => {
        const nodes = [''];
        if (thisNode)
            nodes.push(...thisNode.graph._nodes
                .filter((otherNode) => otherNode.id !== thisNode.id)
                .map((otherNode) => {
                return `#${otherNode.id}: ${otherNode.title}`;
            }));
        return nodes;
    };
    const getSelected = (label) => {
        if (!label) {
            return [undefined, undefined];
        }
        else {
            const selected = parseInt(label.split(':')[0].substring(1));
            return [selected, node.graph._nodes_by_id[selected]];
        }
    };
    const widget = node.addWidget('combo', name, '', async function (label) {
        ;
        [this.selected, this.selectedNode] = getSelected(label);
        if (this.onSelected)
            await this.onSelected(this.selected, this.selectedNode);
    }, { values: getNodeList });
    makeWidgetAsync(widget);
    widget.callback = async (label) => {
        ;
        [widget.selected, widget.selectedNode] = getSelected(label);
        if (widget.onSelected)
            await widget.onSelected(widget.selected, widget.selectedNode);
    };
    widget.tooltip = 'select node from list';
    const original_onNodeConfigure = node.onConfigure;
    node.onConfigure = function (...args) {
        ;
        [widget.selected, widget.selectedNode] = getSelected(widget.value);
        original_onNodeConfigure?.apply(this, ...args);
    };
    return widget;
}
export const ERROR_DISPLAY_CHOICES = {
    browser: 'in browser console (F12)',
    dialog: 'in a popup',
    none: 'do not display',
};
export function ERROR_DISPLAY(node, name = 'error_display') {
    const widget = makeComboWidget(node, name, ERROR_DISPLAY_CHOICES, 'dialog', () => { }, 'how to display detected errors');
    return widget;
}
export function MODEL_LIST(node, inputName, inputData) {
    inputData[1].value = [];
    if (!Array.isArray(inputData[1].all) || !inputData[1].all) {
        log.error("MODEL_LIST: 'all is invalid");
        inputData[1].all = [];
    }
    const widget = HIDDEN(node, inputName, inputData);
    widget.all = inputData[1].all;
    return widget;
}
