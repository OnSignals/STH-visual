import { Group, LinearFilter, Mesh, PlaneGeometry, SRGBColorSpace, TextureLoader, VideoTexture } from 'three';
import { CustomMaterial } from './CustomMaterial';
import { VideoElement } from './VideoElement';
import { disposeChildren } from './utils/object3d';
import { lerp } from '@superstructure.net/utils';

const PLANE_DIVISIONS = 128;

const SCALE = {
    portrait: 5,
    landscape: 9,
};

const TRANSITION = {
    x: 0,
    y: 0,
    z: 0,
    scale: {
        x: 3,
        y: 3,
        z: 3,
    },
    opacity: 0,
};

const LERP_FACTOR = {
    inputRotation: 0.005,
    transition: {
        position: 0.06,
        scale: 0.06,
        opacity: 0.06,
    },
};

/**
 * Item
 *
 * Items rendered in Visual.
 */
class Item {
    /**
     * Create an item.
     *
     * @param {object} data - item data
     * @param {function} onLoaded – Callback called when the item is loaded
     */
    constructor(data, onLoaded = () => {}) {
        console.log('new Item', data);

        if (!data) return;
        this.data = data;
        this.onLoaded = onLoaded;

        this.pointerPosition = { x: 0, y: 0 };

        this.video = null;
        this.texture = null;
        this.previewTexture = null;
        this.object = null;
        this.screen = null;
        this.seed = Math.random();

        this.is = {
            active: false, // is this item the current item and transitioned
            // loading: false,
            loadingTexture: false,
            loadingPreviewTexture: false,
        };

        // this.transition = {
        //     y: TRANSITION.y,
        //     opacity: 0,
        // };

        this.groups = {};
    }

    build() {
        console.log('Item.build()', this.data.id);

        const { width: videoWidth, height: videoHeight } = this.data?.video;

        // Object
        this.groups.object = new Group();
        this.groups.object.visible = false;

        // - Transition
        this.groups.transition = new Group();
        this.groups.transition.position.set(TRANSITION.x, TRANSITION.y, TRANSITION.z);

        // -- InputRotation
        this.groups.inputRotation = new Group();

        // --- AutoRotation
        this.groups.autoRotation = new Group();

        // ---- Scale
        this.groups.scale = new Group();
        this.groups.scale.scale.set(
            videoHeight > videoWidth ? SCALE.portrait : SCALE.landscape,
            videoHeight > videoWidth ? SCALE.portrait : SCALE.landscape,
            videoHeight > videoWidth ? SCALE.portrait : SCALE.landscape
        );

        console.info('scale', this.groups.scale.x);

        // ----- Screen
        // const screenMaterial = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide });
        const screenMaterial = CustomMaterial.clone();
        console.log('isVertical', videoHeight > videoWidth);
        screenMaterial.uniforms.isVertical.value = videoHeight > videoWidth;
        screenMaterial.uniforms.displacementScale.value = -0.5;

        this.screen = new Mesh(
            new PlaneGeometry(1, 1 / (videoWidth / videoHeight), PLANE_DIVISIONS, PLANE_DIVISIONS),
            screenMaterial
        );

        this.groups.object.add(this.groups.transition);
        this.groups.transition.add(this.groups.inputRotation);
        this.groups.inputRotation.add(this.groups.autoRotation);
        this.groups.autoRotation.add(this.groups.scale);
        this.groups.scale.add(this.screen);
    }

    unbuild() {
        console.log('Item.unbuild()', this.data.id);

        if (!this.groups.object) return;

        // Scene graph
        this.groups.object.removeFromParent();

        // Children
        disposeChildren(this.groups.object);

        // Video
        this.unload();

        // Cleanup
        this.groups.object = null;
        this.groups.transition = null;
        this.groups.inputRotation = null;
        this.groups.autoRotation = null;
        this.groups.scale = null;
        this.screen = null;
    }

    /**
     * TODO: Handle edge case / race condition:
     * load() und then unload() quickly.
     * 

     *
     */
    async load() {
        console.log('Item.load()', this.data.id, this.is.loading, this.texture);

        if (this.texture) return; // already loaded, simple as that...
        // if (this.is.loading) return; // never a bad idea to have a flag

        const { combined: videoUrl, thumbnail: previewImageUrl } = this.data?.video;

        // Preview image
        if (previewImageUrl) {
            this.initPreviewTexture(previewImageUrl).then(({ texture } = {}) => {
                // do not override already loaded video
                // + correctly dispose temporary texture
                if (this.texture) {
                    if (texture) texture.dispose();
                    return;
                }

                if (this.previewTexture) {
                    if (texture) texture.dispose();
                    return;
                }

                this.previewTexture = texture;

                // Apply texture
                this.applyTexture(this.previewTexture);
            });
        }

        // Video texture
        if (videoUrl) {
            this.initTexture(videoUrl).then(({ video, texture } = {}) => {
                // do not override already loaded video or texture
                // + correctly dispose temporary video or texture
                if (this.video) {
                    if (video) video.destroy();
                } else {
                    this.video = video;
                }

                if (this.texture) {
                    if (texture) texture.dispose();
                } else {
                    this.texture = texture;
                }

                // Apply texture
                this.applyTexture(this.texture);
            });
        }
    }

    unload() {
        console.log('Item.unload()', this.data.id);

        if (this.texture) this.texture.dispose();
        if (this.previewTexture) this.previewTexture.dispose();
        if (this.video) this.video.destroy();

        this.texture = null;
        this.previewTexture = null;
        this.video = null;
    }

    // transitionIn() {
    //     console.log('Item.transitionIn()', this.data.id);
    //     // this.groups.object.visible = true;

    //     this.transition.y = 0;
    //     this.transition.opacity = 1;
    // }

    // transitionOut() {
    //     console.log('Item.transitionOut()', this.data.id);
    //     // this.groups.object.visible = false;

    //     this.transition.y = TRANSITION.y;
    //     this.transition.opacity = 0;
    // }

    show() {
        console.log('Item.show()', this.data.id);

        this.is.active = true;
    }

    hide() {
        this.is.active = false;
    }

    activate() {
        console.log('Item.activate()', this.data.id);

        if (!this.groups.object) return;

        this.groups.object.visible = true;
    }

    deactivate() {
        console.log('Item.deactivate()', this.data.id);

        if (!this.groups.object) return;

        this.groups.object.visible = false;
    }

    destroy() {
        this.unbuild();
    }

    /**
     * Build, loads video texture
     *
     * @param {*} videoUrl
     * @returns
     */
    async initTexture(videoUrl) {
        if (!videoUrl) return;
        if (this.video) return; // do not create multiple videos
        if (this.texture) return; // do not create multiple textures
        if (this.is.loadingTexture) return;

        console.log('initTexture()', this.data.id, this.texture);

        this.is.loadingTexture = true;

        // Create and load <video> element
        const video = new VideoElement(videoUrl);
        await video.build();

        // Create video texture
        const texture = new VideoTexture(video.getVideoElement());
        texture.colorSpace = SRGBColorSpace;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;

        this.is.loadingTexture = false;

        return { video, texture };
    }

    async initPreviewTexture(previewImageUrl) {
        console.log('initPreviewTexture()', this.data.id);

        if (!previewImageUrl) return;
        if (this.previewTexture) return; // do not create multiple textures
        if (this.is.loadingPreviewTexture) return;

        this.is.loadingPreviewTexture = true;

        const loader = new TextureLoader();
        const texture = await loader.loadAsync(previewImageUrl);

        this.is.loadingPreviewTexture = false;

        return {
            texture,
        };
    }

    applyTexture(texture) {
        if (!texture) return;
        if (!this.screen) return;

        this.screen.material.uniforms.combinedTexture.value.dispose(); // this is important when overwriting unfiform texture
        this.screen.material.uniforms.combinedTexture.value = texture;
        this.screen.material.needsUpdate = true;

        this.is.loaded = true;

        this.onLoaded();
    }

    onFrame(time, delta) {
        // Auto Rotation
        if (this.groups.autoRotation) {
            this.groups.autoRotation.rotation.x = Math.sin(time) * 0.2;
            this.groups.autoRotation.rotation.y = Math.sin(time + this.seed * 10 + 12) * 0.2;
            this.groups.autoRotation.rotation.z = Math.sin(time + this.seed * 10 + 3) * 0.2;
        }

        // Input Rotation
        if (this.groups.inputRotation) {
            this.groups.inputRotation.rotation.y = lerp(
                this.groups.inputRotation.rotation.y,
                this.pointerPosition.x * 0.6,
                LERP_FACTOR.inputRotation / delta
            );

            this.groups.inputRotation.rotation.x = lerp(
                this.groups.inputRotation.rotation.x,
                this.pointerPosition.y * -0.6,
                LERP_FACTOR.inputRotation / delta
            );
        }

        // Transition
        if (this.groups.transition) {
            // - Position
            this.groups.transition.position.x = lerp(
                this.groups.transition.position.x,
                this.is.active && (this.is.loaded || true) ? 0 : TRANSITION.x,
                LERP_FACTOR.transition.scale / delta
            );

            this.groups.transition.position.y = lerp(
                this.groups.transition.position.y,
                this.is.active && (this.is.loaded || true) ? 0 : TRANSITION.y,
                LERP_FACTOR.transition.scale / delta
            );

            this.groups.transition.position.z = lerp(
                this.groups.transition.position.z,
                this.is.active && (this.is.loaded || true) ? 0 : TRANSITION.z,
                LERP_FACTOR.transition.scale / delta
            );

            // - scale
            this.groups.transition.scale.set(
                lerp(
                    this.groups.transition.scale.x,
                    this.is.active && (this.is.loaded || true) ? 1 : TRANSITION.scale.x,
                    LERP_FACTOR.transition.scale / delta
                ),
                lerp(
                    this.groups.transition.scale.y,
                    this.is.active && (this.is.loaded || true) ? 1 : TRANSITION.scale.y,
                    LERP_FACTOR.transition.scale / delta
                ),
                lerp(
                    this.groups.transition.scale.z,
                    this.is.active && (this.is.loaded || true) ? 1 : TRANSITION.scale.z,
                    LERP_FACTOR.transition.scale / delta
                )
            );
        }

        // - Opacity
        if (this.screen.material) {
            if (this.screen.material?.uniforms?.opacity) {
                this.screen.material.uniforms.opacity.value = lerp(
                    this.screen.material.uniforms.opacity.value,
                    this.is.active && (this.is.loaded || true) ? 1 : TRANSITION.opacity,
                    LERP_FACTOR.transition.opacity / delta
                );
            } else {
                this.screen.material.opacity = lerp(
                    this.screen.material.opacity,
                    this.is.active && (this.is.loaded || true) ? 1 : TRANSITION.opacity,
                    LERP_FACTOR.transition.opacity / delta
                );
            }
        }
    }

    getObject() {
        return this?.groups?.object;
    }

    getTexture() {
        return this?.texture;
    }

    setPointerPosition(pointerPosition) {
        if (!pointerPosition) return;

        this.pointerPosition.x = pointerPosition.x;
        this.pointerPosition.y = pointerPosition.y;
    }
}

export { Item };
