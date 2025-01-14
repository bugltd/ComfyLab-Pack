import { findWidget, loadTextFile } from '../shared/utils.js';
export function InputMultiline(nodeType) {
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
