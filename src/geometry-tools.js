import * as THREE from 'three';

/** Shared Three.js primitives used by scene builders. */
export function createGeometryTools() {
  const mat = (color, roughness = .72, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const box = (parent, width, height, depth, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (parent, top, bottom, height, material, x, y, z, segments = 12) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const addCable = (parent, points, material, radius = .006) => {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 7, false), material);
    cable.castShadow = true;
    // Cables are visual details and should not enlarge the furniture collision footprint.
    cable.userData.excludeFromFootprint = true;
    parent.add(cable);
    return cable;
  };
  const addLine = (parent, points, color = 0x514f49, opacity = 1) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color, transparent: opacity < 1, opacity, depthTest: false
    }));
    parent.add(mesh);
    return mesh;
  };
  const disposeObject = object => {
    object.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (!child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    });
  };
  return { mat, box, cylinder, addCable, addLine, disposeObject };
}
