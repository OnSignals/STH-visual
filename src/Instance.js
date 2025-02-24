import { ResizeObserver } from '@juggle/resize-observer';
import { Visual } from './Visual';
import { s } from '@superstructure.net/s';
import { wrap } from '@superstructure.net/utils';

const API_ACTIONS = ['prev', 'next', 'go'];

/**
 *
 *
 * Handle:
 * + ResizeObserver
 * + IntersectionObserver
 */
class Instance {
    constructor(wrapperElement) {
        console.log('new Instance', wrapperElement);

        if (!wrapperElement) return;

        this.wrapperElement = wrapperElement;
        this.data = this.wrapperElement.getAttribute('data-STHVisual-data')
            ? JSON.parse(this.wrapperElement.getAttribute('data-STHVisual-data'))
            : null;
        if (!this.data) return;

        this.dimensions = { width: 1, height: 1 };

        this.resizeObserver = null;
        this.intersectionObserver = null;

        this.visual = null;

        this.currentIndex = new s(0);

        this.build();
    }

    build() {
        console.log('Instance.build()');
        // Visual
        this.visual = new Visual(this.data, this.currentIndex, () => {
            this.onLoaded();
        });
        if (this.visual?.monitor) this.wrapperElement.appendChild(this.visual?.monitor.ui.wrapper);

        // DOM
        this.wrapperElement.appendChild(this.visual.getRendererElement());

        // ResizeObserver
        this.observeResize();

        // IntersectionObserver
        this.observeIntersection();

        // Events
        this.bindEvents();

        // DOM Attributes
        this.wrapperElement.setAttribute('data-STHVisual-isInitiated', 'true');
    }

    unbuild() {
        // Visual
        if (this.visual) this.visual.destroy();

        // DOM
        const canvasElement = this.wrapperElement.querySelector('[data-STHVisual-role~="canvas"]');
        if (canvasElement) canvasElement.remove();

        // ResizeObserver
        this.unobserveResize();

        // IntersectionObserver
        this.unobserveIntersection();

        // Events
        this.unbindEvents();

        // DOM Attributes
        this.wrapperElement.removeAttribute('data-STHVisual-isInitiated');
        this.wrapperElement.removeAttribute('data-STHVisual-isLoaded');
    }

    bindEvents() {
        console.log('Instance.bindEvents()');

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onApi = this.onApi.bind(this);

        this.wrapperElement.addEventListener('mousemove', this.onMouseMove);
        this.wrapperElement.addEventListener('mouseleave', this.onMouseLeave);
        this.wrapperElement.addEventListener('click', this.onClick);
        this.wrapperElement.addEventListener('STHVisual/api', this.onApi);
    }

    unbindEvents() {
        this.wrapperElement.removeEventListener('mousemove', this.onMouseMove);
        this.wrapperElement.removeEventListener('mousemove', this.onMouseLeave);
        this.wrapperElement.removeEventListener('click', this.onClick);
        this.wrapperElement.removeEventListener('STHVisual/api', this.onApi);
    }

    observeResize() {
        this.resizeObserver = new ResizeObserver(() => {
            this.resize();
        }).observe(this.wrapperElement);
    }

    unobserveResize() {
        if (!this.resizeObserver) return;

        this.resizeObserver.disconnect();
        this.resizeObserver = null;
    }

    observeIntersection() {
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                if (!entries[0]) return;

                if (entries[0].isIntersecting) {
                    this.onEnter();
                } else {
                    this.onLeave();
                }
            },
            { threshold: 0.0 }
        );

        this.intersectionObserver.observe(this.wrapperElement);
    }

    unobserveIntersection() {
        if (!this.intersectionObserver) return;
    }

    resize() {
        this.dimensions = { width: this.wrapperElement.offsetWidth, height: this.wrapperElement.offsetHeight };

        if (this.visual) this.visual.resize(this.dimensions);
    }

    go(index = 0) {
        if (!this.data.items.length) return;

        this.currentIndex.set(wrap(index, this.data.items.length));
    }

    destroy() {
        this.unbuild();
    }

    onEnter() {
        if (this.visual) this.visual.start();
    }

    onLeave() {
        if (this.visual) this.visual.stop();
    }

    onMouseMove(event) {
        if (this.visual)
            this.visual.setPointerPosition({
                x: (-0.5 + event.offsetX / this.dimensions.width) * 2,
                y: (-0.5 + event.offsetY / this.dimensions.height) * 2,
            });
    }

    onMouseLeave(event) {
        if (this.visual)
            this.visual.setPointerPosition({
                x: 0,
                y: 0,
            });
    }

    onClick(event) {
        // this.currentIndex.set(wrap(this.currentIndex.get() + 1, this.data.items.length));
    }

    onLoaded() {
        console.log('Instance.onLoaded()');

        if (!this.wrapperElement) return;

        this.wrapperElement.setAttribute('data-STHVisual-isLoaded', 'true');

        const event = new CustomEvent('STHVisual/loaded');
        this.wrapperElement.dispatchEvent(event);
    }

    onApi(event) {
        const { action, index } = event?.detail;
        if (!action || !API_ACTIONS.includes(action)) return;

        console.log('Instance.onApi()', action, index);

        switch (action) {
            case 'prev':
                this.go(this.currentIndex.get() - 1);
                break;

            case 'next':
                this.go(this.currentIndex.get() + 1);
                break;

            case 'go':
                this.go(index);
        }
    }
}

export { Instance };
