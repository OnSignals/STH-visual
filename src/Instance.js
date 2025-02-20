import { ResizeObserver } from '@juggle/resize-observer';
import { Visual } from './Visual';

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

        this.build();
    }

    build() {
        console.log('Instance.build()');
        // Visual
        this.visual = new Visual(this.data);

        // DOM
        this.wrapperElement.appendChild(this.visual.getRendererElement());

        // ResizeObserver
        this.observeResize();

        // IntersectionObserver
        this.observeIntersection();

        // Events
        this.bindEvents();
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
    }

    bindEvents() {
        console.log('Instance.bindEvents()');

        this.onMouseMove = this.onMouseMove.bind(this);

        this.wrapperElement.addEventListener('mousemove', this.onMouseMove);
    }

    unbindEvents() {
        this.wrapperElement.removeEventListener('mousemove', this.onMouseMove);
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
}

export { Instance };
