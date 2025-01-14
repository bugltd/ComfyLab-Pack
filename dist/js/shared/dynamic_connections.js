import { app } from '../../../../scripts/app.js';
export const nodesFromLink = (node, link) => {
    const fromNode = app.graph.getNodeById(link.origin_id);
    const toNode = app.graph.getNodeById(link.target_id);
    let tp = 'error';
    if (fromNode.id === node.id) {
        tp = 'outgoing';
    }
    else if (toNode.id === node.id) {
        tp = 'incoming';
    }
    return { to: toNode, from: fromNode, type: tp };
};
export const setupDynamicConnections = (nodeType, prefix, inputType, opts = undefined) => {
    const options = Object.assign({
        separator: '_',
        start_index: 1,
    }, opts || {});
    const onNodeCreated = nodeType.prototype.onNodeCreated;
    const inputList = typeof inputType === 'object';
    nodeType.prototype.onNodeCreated = function () {
        const r = onNodeCreated ? onNodeCreated.apply(this, []) : undefined;
        this.addInput(`${prefix}${options.separator}${options.start_index}`, inputList ? '*' : inputType);
        return r;
    };
    const onConnectionsChange = nodeType.prototype.onConnectionsChange;
    nodeType.prototype.onConnectionsChange = function (...args) {
        const [type, slotIndex, isConnected, link, ioSlot] = args;
        options.link = link;
        options.ioSlot = ioSlot;
        const r = onConnectionsChange
            ? onConnectionsChange.apply(this, [
                type,
                slotIndex,
                isConnected,
                link,
                ioSlot,
            ])
            : undefined;
        options.DEBUG = {
            node: this,
            type,
            slotIndex,
            isConnected,
            link,
            ioSlot,
        };
        const oldSize = [this.size[0], this.size[1]];
        const oldComputedSize = this.computeSize();
        dynamicConnection(this, slotIndex, isConnected, `${prefix}${options.separator}`, inputType, options);
        for (const widget of this.widgets || []) {
            delete widget.y;
            delete widget.last_y;
            delete widget.computedHeight;
        }
        const newComputedSize = this.computeSize();
        this.setSize([
            oldSize[0],
            oldSize[1] + newComputedSize[1] - oldComputedSize[1],
        ]);
        return r;
    };
};
export const dynamicConnection = (node, index, connected, connectionPrefix = 'input_', connectionType = '*', opts = undefined) => {
    const options = Object.assign({
        start_index: 1,
    }, opts || {});
    const isDynamicInput = (inputName) => inputName.startsWith(connectionPrefix);
    if (node.inputs.length > 0 && !isDynamicInput(node.inputs[index].name)) {
        return;
    }
    const listConnection = typeof connectionType === 'object';
    const conType = listConnection ? '*' : connectionType;
    const nameArray = options.nameArray || [];
    const clean_inputs = () => {
        if (node.inputs.length === 0)
            return;
        let i_count = node.inputs?.length || 0;
        const to_remove = [];
        for (let n = 1; n < node.inputs.length; n++) {
            const element = node.inputs[n];
            if (!element.link && isDynamicInput(element.name)) {
                if (node.widgets) {
                    const w = node.widgets.find((w) => w.name === element.name);
                    if (w) {
                        w.onRemoved?.();
                        node.widgets.length = node.widgets.length - 1;
                    }
                }
                to_remove.push(n);
            }
        }
        for (let i = 0; i < to_remove.length; i++) {
            const id = to_remove[i];
            node.removeInput(id);
            i_count -= 1;
        }
        node.inputs.length = i_count;
        i_count = node.inputs?.length || 0;
        let prefixed_idx = options.start_index;
        for (let i = 0; i < node.inputs.length; i++) {
            let name = '';
            if (isDynamicInput(node.inputs[i].name)) {
                name = `${connectionPrefix}${prefixed_idx}`;
                prefixed_idx += 1;
            }
            else {
                name = node.inputs[i].name;
            }
            if (nameArray.length > 0) {
                name = i < nameArray.length ? nameArray[i] : name;
            }
            node.inputs[i].label = node.inputs[i].label || name;
            node.inputs[i].name = name;
        }
    };
    if (!connected) {
        if (!options.link) {
            clean_inputs();
        }
        else {
            if (!options.ioSlot.link) {
                node.connectionTransit = true;
            }
            else {
                node.connectionTransit = false;
                clean_inputs();
            }
        }
    }
    if (connected) {
        if (options.link) {
            const link = nodesFromLink(node, options.link);
            if (link.type === 'outgoing')
                return;
        }
        else {
        }
        if (node.connectionTransit) {
            node.connectionTransit = false;
        }
        clean_inputs();
        if (node.inputs.length === 0)
            return;
        if (node.inputs[node.inputs.length - 1].link !== null) {
            const nextIndex = node.inputs.reduce((acc, cur) => isDynamicInput(cur.name) ? ++acc : acc, 0);
            const name = nextIndex < nameArray.length
                ? nameArray[nextIndex]
                : `${connectionPrefix}${nextIndex + options.start_index}`;
            node.addInput(name, conType);
        }
    }
};
