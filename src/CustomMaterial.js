import { ShaderMaterial, Texture } from 'three';

const CustomMaterial = new ShaderMaterial({
    uniforms: {
        time: { value: 1.0 },
        opacity: { value: 1.0 },
        displacementScale: { value: 1.0 },
        combinedTexture: { value: new Texture() },
    },

    vertexShader: /*glsl*/ `
uniform float displacementScale;
uniform sampler2D combinedTexture;    
varying vec2 vUv;

void main() {
    vUv = uv;
    
    float displacement = texture2D(combinedTexture, vec2( vUv.x, vUv.y / 2.0) ).x;
    vec3 displacedPosition = vec3(position.x, position.y, position.z + displacement * displacementScale);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
    `,
    fragmentShader: /*glsl*/ `
uniform float opacity;
uniform float time;
uniform sampler2D combinedTexture;
varying vec2 vUv;
    
void main() {
    vec4 textureColor = texture2D(combinedTexture, vec2( vUv.x, 0.5 + vUv.y / 2.0));  
    
    gl_FragColor = vec4(textureColor.rgb, opacity );
}
    `,
});

export { CustomMaterial };
