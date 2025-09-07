var e = `varying vec3 vBarycentric;

void main() {
    vec3 barycentric = vec3(0.0);
    int index = gl_VertexID % 3;
    if (index == 0) barycentric = vec3(1.0, 0.0, 0.0);
    else if (index == 1) barycentric = vec3(0.0, 1.0, 0.0);
    else barycentric = vec3(0.0, 0.0, 1.0);
    vBarycentric = barycentric;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
export {
  e as default
};
