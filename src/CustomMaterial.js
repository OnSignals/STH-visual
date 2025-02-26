import { DoubleSide, ShaderMaterial, Texture } from 'three';

/**
 * CustomMaterial
 *
 * Custom Three.ShaderMaterial.
 */
const CustomMaterial = new ShaderMaterial({
    depthWrite: false,
    transparent: true,
    side: DoubleSide,
    uniforms: {
        time: { value: 1.0 },
        opacity: { value: 0.0 },
        displacementScale: { value: 1.0 },
        combinedTexture: { value: new Texture() },
        isVertical: { value: 0 },
    },

    vertexShader: /*glsl*/ `
uniform float displacementScale;
uniform sampler2D combinedTexture;    
uniform int isVertical;    
varying vec2 vUv;

void main() {
    vUv = uv;
    
    float displacement;

    if( isVertical == 1 ) {
        displacement = texture2D(combinedTexture, vec2( vUv.x / 2.0, vUv.y) ).x;
    } else {
        displacement = texture2D(combinedTexture, vec2( vUv.x, vUv.y / 2.0) ).x;

    }

    vec3 displacedPosition = vec3(position.x, position.y, position.z + displacement * displacementScale);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
    `,
    fragmentShader: /*glsl*/ `
uniform float opacity;
uniform float time;
uniform sampler2D combinedTexture;
uniform int isVertical;    
varying vec2 vUv;
    
void main() {
    vec4 textureColor = vec4(0.0,0.0,0.0,0.0);

    if( isVertical == 1 ) {
        textureColor = texture2D(combinedTexture, vec2( vUv.x / 2.0, vUv.y));  
    } else {
        textureColor = texture2D(combinedTexture, vec2( vUv.x,  0.5 + vUv.y / 2.0));  
    }
    
    gl_FragColor = vec4(textureColor.rgb, opacity );
}
    `,
});

export { CustomMaterial };
