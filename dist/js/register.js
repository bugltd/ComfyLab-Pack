import { app } from '../../../scripts/app.js';
import { CATEGORY } from './shared/common.js';
import { customizeNode } from './custom.js';
import { setupDynamicConnections } from './shared/dynamic_connections.js';
import { QUEUE_STATUS } from './widgets/queue.js';
import { HIDDEN, BTN, ERROR_DISPLAY } from './widgets/misc.js';
import { OutputConfigBackend, OutputConfigLocal } from './nodes/config.js';
import { NodeConfigFetch, NodeConfigApplyLocal, MultiConfigFetch, MultiConfigApplyLocal, } from './nodes/experimental/config.node_multi.js';
import { OutputConfigAuto } from './nodes/experimental/config.output.auto.js';
import { ListFromMultiline } from './nodes/list.js';
import { InputMultiline } from './nodes/input.js';
import { DebugJSONYAML, DebugWidgetVisibility } from './nodes/debug.js';
globalThis[CATEGORY] = { log: 'debug' };
app.registerExtension({
    name: 'ComfyLab.pack',
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData?.category?.split('/')[0] !== CATEGORY) {
            return;
        }
        switch (nodeData.name) {
            case 'ListMerge':
                setupDynamicConnections(nodeType, 'list', 'LIST', {
                    separator: ' ',
                    start_index: 1,
                });
                break;
            case 'ListFromElements':
                setupDynamicConnections(nodeType, 'element', '*', {
                    separator: ' ',
                    start_index: 1,
                });
                break;
            case 'InputMultiline':
                InputMultiline(nodeType);
                break;
            case 'FormatString':
            case 'FormatMultiline':
                setupDynamicConnections(nodeType, 'arg', 'STRING,INT,FLOAT,BOOLEAN', {
                    separator: '',
                    start_index: 0,
                });
                break;
            case 'ListFromMultiline':
                ListFromMultiline(nodeType);
                break;
            case 'DebugJSONYAML':
                DebugJSONYAML(nodeType);
                break;
            case 'DebugWidgetVisibility':
                DebugWidgetVisibility(nodeType);
                break;
            case 'OutputConfigBackend':
                OutputConfigBackend(nodeType);
                break;
            case 'OutputConfigLocal':
                OutputConfigLocal(nodeType);
                break;
            case 'OutputConfigAuto':
                OutputConfigAuto(nodeType);
                break;
            case 'NodeConfigFetch':
                NodeConfigFetch(nodeType);
                break;
            case 'NodeConfigApplyLocal':
                NodeConfigApplyLocal(nodeType);
                break;
            case 'MultiConfigFetch':
                MultiConfigFetch(nodeType);
                break;
            case 'MultiConfigApplyLocal':
                MultiConfigApplyLocal(nodeType);
                break;
        }
        customizeNode(nodeType, nodeData);
        return nodeType;
    },
    getCustomWidgets() {
        return {
            QUEUE_STATUS,
            HIDDEN,
            BTN,
            ERROR_DISPLAY,
        };
    },
});
