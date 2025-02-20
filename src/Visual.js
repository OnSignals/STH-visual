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
import { CustomMaterial } from './CustomMaterial';
import { resolveRedirectedUrl } from './utils/videos';
import { VideoElement } from './VideoElement';
import { Item } from './Item';

const MAX_DPR = 2;

class Visual {
    constructor(data) {
        console.log('new Visual', data);
        if (!data) return;

        this.data = data;

        this.items = [];
        this.pointerPosition = { x: 0, y: 0 };

        this.build();
        this.resize();
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
                await item.build();

                this.scene.add(item.getObject());
                this.renderer.initTexture(item.getTexture());

                this.items.push(item);
            });
        }
    }

    unbuild() {
        // Items
        if (this.items) {
            this.items.forEach((item) => item.destroy());
            this.items = [];
        }

        this.renderer.dispose();
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

        if (this.items) this.items.forEach((item) => item.update(this.clock.getElapsedTime(), deltaNormalized));

        this.renderer.render(this.scene, this.camera);
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
}

export { Visual };
