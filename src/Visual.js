import { clamp } from '@superstructure.net/utils';
import {
    ACESFilmicToneMapping,
    Clock,
    ColorManagement,
    PerspectiveCamera,
    Scene,
    SRGBColorSpace,
    WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { ThreePerf } from 'three-perf';
import { Item } from './Item';

const MAX_DPR = 2;

const USE_COMPOSER = false;

const AFTERIMAGE_STRENGTH = 0.6; // based on 60fps

/**
 * Visual
 *
 * Creates a WebGL context and renders Items to it.
 */
class Visual {
    /**
     * Create a visual.
     *
     * @param {object} data - instance data
     * @param {s} currentIndex – state object of the current index
     * @param {function} onLoaded – Callback called when the first Item is loaded
     */
    constructor(data, currentIndex, onLoaded = () => {}) {
        console.log('new Visual', data, currentIndex);
        if (!data) return;

        this.data = data;
        this.currentIndex = currentIndex;
        this.onLoaded = onLoaded;

        this.items = [];
        this.pointerPosition = { x: 0, y: 0 };

        this.is = {
            debug: window.location.href.includes('?debug'),
        };

        this.build();
        this.resize();

        this.currentIndex.on(() => {
            this.onCurrentIndexChange();
        });
        this.onCurrentIndexChange();
    }

    async build() {
        // Clock
        this.clock = new Clock();

        // Renderer
        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true,
            precision: 'highp',
        });
        this.renderer.outputColorSpace = SRGBColorSpace;
        // this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.domElement.setAttribute('data-STHVisual-role', 'canvas');

        // Scene
        this.scene = new Scene();

        // Camera
        this.camera = new PerspectiveCamera(50, 16 / 9, 0.1, 1000);
        this.camera.position.z = 10;

        // Items
        if (this.data.items) {
            this.data.items.forEach(async (itemData) => {
                const item = new Item(itemData, this.onLoaded);
                item.build();

                this.scene.add(item.getObject());
                this.items.push(item);
            });
        }

        // TODO:
        // Postprocessing
        if (USE_COMPOSER) {
            this.composer = {};

            this.composer.composer = new EffectComposer(this.renderer);

            // Renderpass
            this.composer.renderPass = new RenderPass(this.scene, this.camera);
            this.composer.composer.addPass(this.composer.renderPass);

            // AfterImage
            this.composer.afterimagePass = new AfterimagePass();
            this.composer.composer.addPass(this.composer.afterimagePass);

            // OutputPass
            this.composer.outputPass = new OutputPass();
            // this.composer.composer.addPass(this.composer.outputPass);
        }

        // Stats
        if (this.is.debug) {
            this.monitor = new ThreePerf({
                anchorX: 'left',
                anchorY: 'top',
                domElement: document.body,
                renderer: this.renderer,
                scale: 0.6,
            });
        }
    }

    unbuild() {
        // Items
        if (this.items) {
            this.items.forEach((item) => item.destroy());
            this.items = [];
        }

        // Renderer
        if (this.renderer) this.renderer.dispose();

        // Stats
        if (this?.monitor) this.monitor.dispose();

        // Composer
        if (this?.composer?.composer) this.composer.composer.dispose();
        if (this?.composer?.afterimagePass) this.composer.afterimagePass.dispose();
        if (this?.composer?.renderPass) this.composer.renderPass.dispose();
        if (this?.composer?.outputPass) this.composer.outputPass.dispose();
    }

    resize(dimensions) {
        if (!dimensions) return;
        if (!this.renderer) return;

        console.log('Visual.resize()', dimensions);

        const renderWidth = clamp(window.devicePixelRatio, 1, MAX_DPR) * dimensions.width;
        const renderHeight = clamp(window.devicePixelRatio, 1, MAX_DPR) * dimensions.height;

        // WebGLRenderer
        this.renderer.setSize(renderWidth, renderHeight, false);

        // Composer
        if (this?.composer?.composer) {
            this.composer.composer.setSize(renderWidth, renderWidth);
        }

        // Camera
        this.camera.aspect = dimensions.width / dimensions.height;
        this.camera.updateProjectionMatrix();
    }

    start() {
        if (!this.renderer) return;

        this.render = this.render.bind(this);
        this.renderer.setAnimationLoop(this.render);

        this.clock.start();
    }

    stop() {
        if (!this.renderer) return;

        this.renderer.setAnimationLoop(null);

        this.clock.stop();
    }

    render(state) {
        const delta = this.clock.getDelta();
        const deltaNormalized = 1 / 60 / delta;

        if (this.items)
            this.items.forEach((item) => {
                item.setPointerPosition(this.pointerPosition);
                item.onFrame(this.clock.getElapsedTime(), deltaNormalized);
            });

        if (this?.monitor) this.monitor.begin();

        if (USE_COMPOSER && this?.composer?.composer) {
            this.composer.afterimagePass.uniforms.damp.value = AFTERIMAGE_STRENGTH / deltaNormalized;
            this.composer.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }

        if (this?.monitor) this.monitor.end();
    }

    destroy() {
        this.stop();
        this.unbuild();
    }

    setPointerPosition(pointerPosition) {
        if (!pointerPosition) return;

        this.pointerPosition.x = pointerPosition.x;
        this.pointerPosition.y = pointerPosition.y;
    }

    getRendererElement() {
        if (!this.renderer) return;

        return this.renderer.domElement;
    }

    onCurrentIndexChange() {
        console.log('Visual.onCurrentIndexChange()', this.currentIndex.get());

        if (!this.items?.length) return;

        this.items.forEach(async (item, i) => {
            if (
                Math.abs(this.currentIndex.get() - i) <= 1 ||
                Math.abs(this.currentIndex.get() + this.items.length - i) <= 1
            ) {
                // close items
                if (this.currentIndex.get() === i) {
                    // current item
                    item.show();
                } else {
                    // close not bit current
                    item.hide();
                }

                await item.load();
                // this.renderer.initTexture(item.getTexture());
                item.activate();
            } else {
                // not so close items
                item.hide();
                item.unload();
                item.deactivate();
            }
        });
    }
}

export { Visual };
