import { Instance } from './Instance.js';

const API_ACTIONS = ['init', 'destroy'];

/**
 * STH Visual
 *
 */
class STHVisual {
    constructor(options = {}) {
        const defaults = {
            selectorInstance: '[data-STHVisual-role~="instance"]',
        };

        this.options = { ...defaults, ...options };

        this.instances = [];

        if (window.matchMedia('(prefers-reduced-motion)').matches) return;

        this.init();
        this.bindEvents();
    }

    init() {
        if (this.instances.length) this.destroy();

        const instanceElements = document.querySelectorAll(this.options.selectorInstance);
        if (!instanceElements?.length) return;

        instanceElements.forEach((instanceElement) => {
            const instance = new Instance(instanceElement);
            if (instance) this.instances.push(instance);
        });
    }

    destroy() {
        if (this.instances) this.instances.forEach((instance) => instance.destroy());

        this.instances = [];
    }

    bindEvents() {
        this.onApi = this.onApi.bind(this);

        document.addEventListener('STHVisual/api', this.onApi);
    }

    // don't unbind global events...
    unbindEvents() {
        document.removeEventListener('STHVisual/api', this.onApi);
    }

    onApi(event) {
        const { action, index } = event?.detail;
        if (!action || !API_ACTIONS.includes(action)) return;

        console.log('STHVisual.onApi()', action, index);

        switch (action) {
            case 'init':
                this.init();
                break;

            case 'destroy':
                this.destroy();
                break;
        }
    }
}

window.STHVisual = new STHVisual({});
