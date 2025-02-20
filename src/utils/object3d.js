import { Mesh } from 'three';

function disposeChildren(object) {
    if (!object || !object?.traverse || typeof object.traverse !== 'function') return;

    object.traverse((node) => {
        if (node instanceof Mesh) {
            if (node?.geometry) {
                console.log('found geometry to dispose', node?.geometry);
                node.geometry.dispose();
            }

            if (node?.material) {
                console.log('found material to dispose', node.material);

                maps.forEach((map) => {
                    if (node.material?.[map]) {
                        console.log('found map to dispose', map, node.material.map);
                        node.material[map].dispose();
                    }
                });

                node.material.dispose();
            }
        }
    });
}

const maps = [
    'alphaMap',
    'map',
    'aoMap',
    'bumpMap',
    'clearcoatMap',
    'clearCoarNormalMap',
    'clearcoatRoughnessMap',
    'displacementMap',
    'emissiveMap',
    'envMap',
    'iridescenceMap',
    'iridescenceThicknessMap',
    'lightMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap',
    'sheenColorMap',
    'sheenRoughnessMap',
    'specularCOlorMap',
    'specularIntensityMap',
    'thicknessMap',
    'transmissionMap',
];

export { disposeChildren };
