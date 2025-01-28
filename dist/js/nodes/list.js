import { log } from '../shared/common.js';
import { findWidget, loadTextFile } from '../shared/utils.js';
import { makeComboWidget } from '../widgets/factories.js';
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
export function ListModels(nodeType, model_type) {
    const findModelCombos = (node) => node.widgets.filter((w) => w.name.startsWith(model_type + '_'));
    const addModelCombo = (node, modelList) => {
        const index = findModelCombos(node).length;
        const width = node.size[0];
        const widget = makeComboWidget(node, `${model_type}_${index}`.toLowerCase(), ['none', ...modelList.all], 0, () => {
            refreshModelList(node, modelList);
        });
        node.setSize([width, node.size[1]]);
        widget.label = `${model_type} #${index + 1}`;
        return widget;
    };
    const refreshModelList = (node, modelList) => {
        const files = [];
        let widgetIndex = 0;
        let comboIndex = 0;
        while (widgetIndex < node.widgets.length) {
            const widget = node.widgets[widgetIndex];
            if (!widget.name.startsWith(model_type + '_')) {
                widgetIndex += 1;
                continue;
            }
            if (widget.selected === 0) {
                node.widgets.splice(widgetIndex, 1);
                continue;
            }
            widget.name = `${model_type}_${comboIndex}`.toLowerCase();
            widget.label = `${model_type} #${comboIndex + 1}`;
            log.debug(widget.value);
            files.push(widget.value);
            widgetIndex += 1;
            comboIndex += 1;
        }
        addModelCombo(node, modelList);
        modelList.value = { files };
        log.debug(modelList.value);
    };
    const original_onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
        original_onNodeCreated?.apply(this, ...args);
        const modelList = findWidget(this, 'models');
        addModelCombo(this, modelList);
    };
}
