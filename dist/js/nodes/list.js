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
    const isModelCombo = (widget) => widget.name.startsWith(`${model_type}_`.toLowerCase());
    const findModelCombos = (node) => node.widgets.filter((w) => isModelCombo(w));
    const addModelCombo = (node, modelList) => {
        const index = findModelCombos(node).length;
        const width = node.size[0];
        const widget = makeComboWidget(node, `${model_type}_${index}`.toLowerCase(), ['none', ...modelList.all], 0);
        node.setSize([width, node.size[1]]);
        widget.label = `${model_type} #${index + 1}`;
        widget.options.serialize = false;
        return widget;
    };
    const refreshModelList = (node, modelList) => {
        const files = [];
        let widgetIndex = 0;
        let comboIndex = 0;
        while (widgetIndex < node.widgets.length) {
            const widget = node.widgets[widgetIndex];
            if (!isModelCombo(widget)) {
                widgetIndex += 1;
                continue;
            }
            if (widget.selected === 0) {
                node.widgets.splice(widgetIndex, 1);
                continue;
            }
            widget.name = `${model_type}_${comboIndex}`.toLowerCase();
            widget.label = `${model_type} #${comboIndex + 1}`;
            files.push(widget.value);
            widgetIndex += 1;
            comboIndex += 1;
        }
        const last = addModelCombo(node, modelList);
        last.onSelected = () => {
            refreshModelList(node, modelList);
        };
        modelList.value = { files };
    };
    const refreshFromModelList = (node, modelList) => {
        let widgetIndex = 0;
        while (widgetIndex < node.widgets.length) {
            const widget = node.widgets[widgetIndex];
            if (isModelCombo(widget)) {
                node.widgets.splice(widgetIndex, 1);
                continue;
            }
            widgetIndex += 1;
        }
        const files = modelList.value.files;
        for (const file of files) {
            const widget = addModelCombo(node, modelList);
            widget.value = file;
            widget.callback(widget.value);
            widget.onSelected = () => {
                refreshModelList(node, modelList);
            };
        }
        const last = addModelCombo(node, modelList);
        last.onSelected = () => {
            refreshModelList(node, modelList);
        };
    };
    const original_onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
        original_onNodeCreated?.apply(this, ...args);
        const modelList = findWidget(this, 'models');
        refreshFromModelList(this, modelList);
    };
    const original_onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function (...args) {
        original_onConfigure?.apply(this, ...args);
        const modelList = findWidget(this, 'models');
        refreshFromModelList(this, modelList);
    };
}
