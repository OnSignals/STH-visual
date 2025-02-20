import { Instance } from './Instance.js';

/**
 * STH Visual
 *
 */

console.log('index.js');

class STHVisual {
    constructor(options = {}) {
        const defaults = {
            selectorInstance: '[data-STHVisual-role~="instance"]',
        };

        this.options = { ...defaults, ...options };

        this.instances = [];

        this.init();
    }

    init() {
        if (this.instances.length) this.destroy();

        const instanceElements = document.querySelectorAll(this.options.selectorInstance);
        if (!instanceElements?.length) return;

        instanceElements.forEach((instanceElement) => {
            const instance = new Instance(instanceElement);
            this.instances.push(instance);
        });
    }

    destroy() {
        if (this.instances) this.instances.forEach((instance) => instance.destroy());

        this.instances = [];
    }
}

window.STHVisual = new STHVisual({});
