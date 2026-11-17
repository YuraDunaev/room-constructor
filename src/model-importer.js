import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

/** Parses a local model file and prepares a centered, ground-aligned scene object. */
export async function parseLocalModel(file, selectedFiles = [file]) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const objectUrls = [];
  try {
    let object;
    if (extension === 'glb' || extension === 'gltf') {
      const manager = new THREE.LoadingManager();
      const siblingFiles = new Map(selectedFiles.map(selectedFile => [selectedFile.name, selectedFile]));
      manager.setURLModifier(url => {
        const fileName = decodeURIComponent(url.split(/[\\/]/).pop()?.split(/[?#]/)[0] || '');
        const sibling = siblingFiles.get(fileName);
        if (!sibling) return url;
        const objectUrl = URL.createObjectURL(sibling);
        objectUrls.push(objectUrl);
        return objectUrl;
      });
      object = await new Promise((resolve, reject) => {
        file.arrayBuffer().then(buffer => new GLTFLoader(manager).parse(buffer, '', result => resolve(result.scene), reject), reject);
      });
    } else if (extension === 'obj') {
      object = new OBJLoader().parse(await file.text());
    } else if (extension === 'stl') {
      const geometry = new STLLoader().parse(await file.arrayBuffer());
      geometry.computeVertexNormals();
      object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xc9c5bb, metalness: .12, roughness: .72 }));
    } else {
      throw new Error('Unsupported model format');
    }
    object.name = file.name;
    object.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => { material.side = THREE.DoubleSide; });
      }
    });
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const largestSide = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(largestSide) || largestSide <= 0) throw new Error('The model has no visible geometry');
    object.position.x -= (bounds.min.x + bounds.max.x) / 2;
    object.position.z -= (bounds.min.z + bounds.max.z) / 2;
    object.position.y -= bounds.min.y;
    object.scale.multiplyScalar(Math.min(1, 4.5 / largestSide));
    object.position.y += .02;
    return { object, objectUrls, size, largestSide };
  } catch (error) {
    objectUrls.forEach(URL.revokeObjectURL);
    throw error;
  }
}
