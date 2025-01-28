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
    const original_onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
        original_onNodeCreated?.apply(this, ...args);
        const modelList = findWidget(this, 'models');
        makeComboWidget(this, `${model_type}_0`, modelList.all, modelList.all[0]);
    };
}
