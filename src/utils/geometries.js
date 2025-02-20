import { Mesh } from 'three';

function diposeChildGeometries(object) {
    if (!object || !object?.traverse || typeof object.traverse !== 'function') return;

    object.traverse((node) => {
        if (node instanceof Mesh && node?.geometry) {
            console.log('found geometry to dispose', node?.geometry);
            node.geometry.dispose();
        }
    });
}

export { diposeChildGeometries };
