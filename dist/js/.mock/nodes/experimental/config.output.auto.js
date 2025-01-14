import { findWidget, ALL_CONFIG_FILE_TYPES, humanFileType, guessFileType, loadTextFile, removeAllOutputs, } from '../../../shared/utils.js';
import { makeTextWidget, makeButtonWidget, makeToggleWidget, makeComboWidget, makeSwitchWidget, } from '../../../widgets/factories.js';
import { ERROR_DISPLAY } from '../../../widgets/misc.js';
import { OUTPUT_CONNECT_CHOICES, processOutputConfigAuto, } from '../../../shared/experimental/config.output.auto.js';
import { displaySingleError, displayErrorDict } from '../../../shared/error.js';
async function processOutputResult(node, result, dataWidget, statusWidget, errorDisplay) {
    if (!result)
        return;
    const title = node.title || node.type;
    switch (result.success) {
        case false:
            dataWidget.value = {};
            statusWidget.label = result.error;
            await displaySingleError(title, errorDisplay, result.error);
            break;
        case true:
            dataWidget.value = result.data;
            statusWidget.label = 'All outputs generated';
            break;
        case 'partial': {
            dataWidget.value = result.data;
            const message = `${result.nbErrors} error${result.nbErrors > 1 ? 's' : ''} detected`;
            statusWidget.label = message;
            await displayErrorDict(title, errorDisplay, result.errors, message);
        }
    }
}
async function processOutputConfigAutoUI(node, switchWidget, configWidget, dataWidget, statusWidget, strategy, errorDisplay, silent) {
    let res;
    await switchWidget.guard(async () => {
        res = await processOutputConfigAuto(node, configWidget.value || undefined, strategy);
    });
    const result = res;
    if (!result || result.success === false)
        configWidget.value = '';
    if (!silent) {
        await processOutputResult(node, result, dataWidget, statusWidget, errorDisplay);
    }
    statusWidget.value = statusWidget.label;
}
export function OutputConfigAuto(nodeType) {
    const original_onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
        original_onNodeCreated?.apply(this, ...args);
        const loadButtonWidget = makeButtonWidget(this, 'load', 'Load output config', {
            tooltip: 'load output config from a local JSON or YAML file',
        });
        const showConfigWidget = makeToggleWidget(this, 'show_config', {
            default: true,
        });
        const configWidget = makeTextWidget(this, 'config', {
            multiline: true,
            placeholder: 'output config',
            default: '',
            tooltip: 'output config as JSON or YAML',
            disabled: true,
        });
        const filenameWidget = makeTextWidget(this, 'filename', {
            multiline: false,
            disabled: true,
            label: 'no file',
        });
        const connectWidget = makeComboWidget(this, 'auto_connect', OUTPUT_CONNECT_CHOICES, 'auto', () => { }, 'how to handle connection data and existing links');
        const errorDisplayWidget = ERROR_DISPLAY(this);
        const statusWidget = makeButtonWidget(this, 'status', 'No file selected', {
            tooltip: 'status',
            disabled: true,
        });
        const switchWidget = makeSwitchWidget(this, 'switch', [configWidget]);
        const dataWidget = findWidget(this, 'data');
        showConfigWidget.callback = (value) => {
            switchWidget.switch(value);
        };
        loadButtonWidget.callback = async () => {
            filenameWidget.label = 'no file';
            filenameWidget.value = '';
            configWidget.value = '';
            statusWidget.label = 'Waiting for file selection...';
            let silent = false;
            try {
                const loaded = await loadTextFile(ALL_CONFIG_FILE_TYPES);
                if (loaded) {
                    filenameWidget.label = `file: (${humanFileType(loaded.type)})`;
                    filenameWidget.value = loaded.name;
                    configWidget.value = loaded.content;
                }
                else {
                    statusWidget.label = 'No file selected';
                    silent = true;
                }
            }
            catch (e) {
                statusWidget.label = e.message;
                dataWidget.value = {};
                await switchWidget.guard(async () => {
                    removeAllOutputs(this);
                    for (const w of this.widgets) {
                        delete w.y;
                        delete w.last_y;
                    }
                });
                await displaySingleError(this.title || this.type, errorDisplayWidget.selected, 'Content is not JSON or YAML');
                this.serialize();
                return;
            }
            await processOutputConfigAutoUI(this, switchWidget, configWidget, dataWidget, statusWidget, connectWidget.selected, errorDisplayWidget.selected, silent);
        };
    };
    const original_onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function (...args) {
        original_onConfigure?.apply(this, ...args);
        const statusWidget = findWidget(this, 'status');
        if (statusWidget.value)
            statusWidget.label = statusWidget.value;
        const filenameWidget = findWidget(this, 'filename');
        filenameWidget.label = 'no file';
        if (filenameWidget.value) {
            filenameWidget.label = guessFileType(filenameWidget.value);
        }
        const showConfigWidget = findWidget(this, 'show_config');
        if (!showConfigWidget.value)
            showConfigWidget.callback(false);
    };
}
