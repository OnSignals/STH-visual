import { clamp } from '@superstructure.net/utils';
import {
    ACESFilmicToneMapping,
    AmbientLight,
    BoxGeometry,
    Clock,
    DoubleSide,
    LinearFilter,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PerspectiveCamera,
    RGBFormat,
    Scene,
    SRGBColorSpace,
    VideoTexture,
    WebGLRenderer,
} from 'three';
import { ThreePerf } from 'three-perf';
import { CustomMaterial } from './CustomMaterial';
import { resolveRedirectedUrl } from './utils/videos';
import { VideoElement } from './VideoElement';
import { Item } from './Item';

const MAX_DPR = 2;

class Visual {
    constructor(data, currentIndex) {
        console.log('new Visual', data, currentIndex);
        if (!data) return;

        this.data = data;
        this.currentIndex = currentIndex;

        this.items = [];
        this.pointerPosition = { x: 0, y: 0 };

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
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.domElement.setAttribute('data-STHVisual-role', 'canvas');

        // Scene
        this.scene = new Scene();

        // Camera
        this.camera = new PerspectiveCamera(50, 16 / 9, 0.1, 1000);
        this.camera.position.z = 10;

        // Items
        if (this.data.items) {
            this.data.items.forEach(async (itemData) => {
                const item = new Item(itemData);
                item.build();

                this.scene.add(item.getObject());
                this.items.push(item);
            });
        }

        // Stats
        this.monitor = new ThreePerf({
            anchorX: 'left',
            anchorY: 'top',
            domElement: document.body,
            renderer: this.renderer,
            scale: 0.6,
        });
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
        if (this.monitor) this.monitor.dispose();
    }

    resize(dimensions) {
        if (!dimensions) return;
        if (!this.renderer) return;

        console.log('Visual.resize()', dimensions);

        // WebGLRenderer
        this.renderer.setSize(
            clamp(window.devicePixelRatio, 1, MAX_DPR) * dimensions.width,
            clamp(window.devicePixelRatio, 1, MAX_DPR) * dimensions.height,
            false
        );

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

        if (this.monitor) this.monitor.begin();

        this.renderer.render(this.scene, this.camera);

        if (this.monitor) this.monitor.end();
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
                    item.transitionIn();
                } else {
                    // close not bit current
                    item.transitionOut();
                }

                await item.load();
                // this.renderer.initTexture(item.getTexture());
                item.activate();
            } else {
                // not so close items
                item.transitionOut();
                item.unload();
                item.deactivate();
            }
        });
    }
}

/**
 *   0   1   2   3   4
 *       x
 *  -1   0   1
 *   x
 *   0   1          -1
 *                   x
 *   1           -1  0
 *
 *
 * Math.abs( currentIndex - i ) < 1 || Math.abs( (currentIndex + items.length) - i ) < 1
 */

export { Visual };
