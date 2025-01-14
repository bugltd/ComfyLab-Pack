import { findWidget, ALL_CONFIG_FILE_TYPES, humanFileType, guessFileType, loadTextFile, retrievefile, forceMouseEvent, removeAllOutputs, } from '../shared/utils.js';
import { makeTextWidget, makeButtonWidget, makeToggleWidget, makeSwitchWidget, } from '../widgets/factories.js';
import { ERROR_DISPLAY } from '../widgets/misc.js';
import { processOutputConfigLocal, } from '../shared/config.output.js';
import { displaySingleError, displayErrorDict } from '../shared/error.js';
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
async function processOutputConfigUI(node, switchWidget, configWidget, dataWidget, statusWidget, errorDisplayWidget) {
    let res;
    await switchWidget.guard(async () => {
        res = await processOutputConfigLocal(node, configWidget.value || undefined);
    });
    const result = res;
    if (!result || result.success === false)
        configWidget.value = '';
    await processOutputResult(node, result, dataWidget, statusWidget, errorDisplayWidget.selected);
    statusWidget.value = statusWidget.label;
}
export function OutputConfigBackend(nodeType) {
    const original_onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
        original_onNodeCreated?.apply(this, ...args);
        const pathWidget = makeTextWidget(this, 'file_path', {
            multiline: false,
            placeholder: 'path to file (backend)',
            default: '',
            tooltip: 'full path to file (backend)',
        });
        const retrieveButtonWidget = makeButtonWidget(this, 'retrieve', 'Retrieve output config', {
            disabled: true,
            tooltip: 'retrieve output config from a backend JSON or YAML file',
        });
        const errorDisplayWidget = ERROR_DISPLAY(this);
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
        const statusWidget = makeButtonWidget(this, 'status', 'No file selected', {
            tooltip: 'status',
            disabled: true,
        });
        const switchWidget = makeSwitchWidget(this, 'switch', [configWidget]);
        const dataWidget = findWidget(this, 'data');
        pathWidget.callback = (text) => {
            retrieveButtonWidget.disabled = !text;
        };
        showConfigWidget.callback = (value) => {
            switchWidget.switch(value);
        };
        retrieveButtonWidget.callback = async () => {
            filenameWidget.label = 'no file';
            filenameWidget.value = '';
            configWidget.value = '';
            statusWidget.label = 'Retrieving file...';
            try {
                const retrieved = await retrievefile(pathWidget.value);
                filenameWidget.label = `file: (${humanFileType(retrieved.mime)})`;
                filenameWidget.value = retrieved.filename;
                configWidget.value = retrieved.content;
                await processOutputConfigUI(this, switchWidget, configWidget, dataWidget, statusWidget, errorDisplayWidget);
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
                await displaySingleError(this.title || this.type, errorDisplayWidget.selected, e.message);
            }
            finally {
                forceMouseEvent();
            }
        };
    };
    const original_onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function (...args) {
        original_onConfigure?.apply(this, ...args);
        console.log('OutputConfigBackend / onConfigure');
        const statusWidget = findWidget(this, 'status');
        if (statusWidget.value)
            statusWidget.label = statusWidget.value;
        const filenameWidget = findWidget(this, 'filename');
        filenameWidget.label = 'no file';
        if (filenameWidget.value) {
            const ext = filenameWidget.value.split('.').pop();
            if (ext === 'json')
                filenameWidget.label = 'file: (json)';
            else if (['yml', 'yaml'].includes(ext))
                filenameWidget.label = 'file: (yaml)';
            else
                filenameWidget.label = 'file:';
        }
        const retrieveButtonWidget = findWidget(this, 'retrieve');
        const pathWidget = findWidget(this, 'file_path');
        retrieveButtonWidget.disabled = !pathWidget.value;
        const showConfigWidget = findWidget(this, 'show_config');
        if (!showConfigWidget.value)
            showConfigWidget.callback(false);
    };
}
export function OutputConfigLocal(nodeType) {
    const original_onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
        original_onNodeCreated?.apply(this, ...args);
        const loadButtonWidget = makeButtonWidget(this, 'load', 'Load output config', {
            tooltip: 'load output config from a local JSON or YAML file',
        });
        const errorDisplayWidget = ERROR_DISPLAY(this);
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
            try {
                const loaded = await loadTextFile(ALL_CONFIG_FILE_TYPES);
                if (loaded) {
                    filenameWidget.label = `file: (${humanFileType(loaded.type)})`;
                    filenameWidget.value = loaded.name;
                    configWidget.value = loaded.content;
                }
                else {
                    return;
                }
            }
            catch (e) {
                statusWidget.label = e.message;
                configWidget.value = '';
                dataWidget.value = {};
                await switchWidget.guard(async () => {
                    removeAllOutputs(this);
                    for (const w of this.widgets) {
                        delete w.y;
                        delete w.last_y;
                    }
                });
                await displaySingleError(this.title || this.type, errorDisplayWidget.selected, 'Content is not JSON or YAML');
                return;
            }
            await processOutputConfigUI(this, switchWidget, configWidget, dataWidget, statusWidget, errorDisplayWidget);
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
