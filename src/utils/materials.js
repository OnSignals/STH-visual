function disposeMaterials(materials) {
    if (!materials) return;

    for (const materialKey in materials) {
        if (!materials.hasOwnProperty(materialKey)) return;

        const material = materials?.[materialKey];
        if (!material) continue;

        console.log('found material to dispose', material);
        // textures
        maps.forEach((map) => {
            if (material?.[map]) {
                console.log('found map to dispose', map, material?.map);
                material?.[map].dispose();
            }
        });

        material.dispose();
    }
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

export { disposeMaterials };
