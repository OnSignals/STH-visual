import { Group, LinearFilter, Mesh, PlaneGeometry, SRGBColorSpace, VideoTexture } from 'three';
import { CustomMaterial } from './CustomMaterial';
import { VideoElement } from './VideoElement';

const PLANE_DIVISIONS = 128;

class Item {
    constructor(data, onReady = () => {}) {
        console.log('new Item', data);

        if (!data) return;
        this.data = data;
        this.onReady = onReady;

        this.video = null;
        this.texture = null;
        this.object = null;
        this.screen = null;

        this.groups = {};
    }

    async build() {
        const { combined: videoUrl, width: videoWidth, height: videoHeight } = this.data?.video;
        if (!videoUrl) return;

        // Create and load <video> element
        this.video = new VideoElement(videoUrl);
        await this.video.build();

        // Create video texture
        this.texture = new VideoTexture(this.video.getVideoElement());
        this.texture.colorSpace = SRGBColorSpace;
        this.texture.minFilter = LinearFilter;
        this.texture.magFilter = LinearFilter;

        // Object
        this.groups.object = new Group();

        // - InputRotation
        this.groups.inputRotation = new Group();

        // -- AutoRotation
        this.groups.autoRotation = new Group();

        // --- Scale
        this.groups.scale = new Group();
        this.groups.scale.scale.set(12, 12, 12);

        // ---- Screen
        const screenMaterial = CustomMaterial.clone();

        screenMaterial.uniforms.displacementScale.value = -0.5;
        screenMaterial.uniforms.combinedTexture.value = this.texture;
        screenMaterial.needsUpdate = true;

        this.screen = new Mesh(
            new PlaneGeometry(1, 1 / (videoWidth / videoHeight), PLANE_DIVISIONS, PLANE_DIVISIONS),
            screenMaterial
        );

        this.groups.object.add(this.groups.inputRotation);
        this.groups.inputRotation.add(this.groups.autoRotation);
        this.groups.autoRotation.add(this.groups.scale);
        this.groups.scale.add(this.screen);
    }

    unbuild() {}

    destroy() {
        this.unbuild();
    }

    update(time, delta) {
        if (this.groups.autoRotation) {
            this.groups.autoRotation.rotation.x = Math.sin(time) * 0.2;
            this.groups.autoRotation.rotation.y = Math.sin(time) * 0.2;
            this.groups.autoRotation.rotation.z = Math.sin(time) * 0.2;
        }
    }

    getObject() {
        return this?.groups?.object;
    }

    getTexture() {
        return this?.texture;
    }
}

export { Item };
