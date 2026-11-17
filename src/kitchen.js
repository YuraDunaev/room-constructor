import * as THREE from 'three';
import {
  HALF_W, HALF_L, KITCHEN, KITCHEN_RIGHT, KITCHEN_INNER_X, KITCHEN_DOORS,
  KITCHEN_CENTER_X, KITCHEN_HALF_LENGTH, KITCHEN_PANTRY_END_Z, KITCHEN_Z_OFFSET
} from './config.js';

/** Builds the fixed kitchen scene using the current room scene groups. */
export function createKitchenBuilder(context) {
  const {
    roomGroup: roomParent, wallGroup: wallParent, windowGroup: windowParent,
    columnGroup: columnParent, furnitureGroup: furnitureParent, obstacles,
    mat, box, cylinder, addCable,
    getKitchenObjectData, registerMovable, registerWalkDoor
  } = context;
  const roomGroup = createKitchenLayer(roomParent, 'Kitchen floor and overhead fixtures');
  const wallGroup = createKitchenLayer(wallParent, 'Kitchen walls');
  const windowGroup = createKitchenLayer(windowParent, 'Kitchen glazing');
  const columnGroup = createKitchenLayer(columnParent, 'Kitchen columns');
  const furnitureGroup = createKitchenLayer(furnitureParent, 'Kitchen fixed furniture');
  let kitchenGroup = null;
  let kitchenCeiling = null;

  function createKitchenLayer(parent, name) {
    const layer = new THREE.Group();
    layer.name = name;
    layer.position.z = KITCHEN_Z_OFFSET;
    parent.add(layer);
    return layer;
  }

function buildKitchen() {
  const firstKitchenObstacle = obstacles.length;
  kitchenGroup = new THREE.Group();
  kitchenGroup.name = 'L-shaped kitchen, dining and lounge';
  furnitureGroup.add(kitchenGroup);

  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x696c70, roughness: .98 });
  const carpetMaterial = new THREE.MeshStandardMaterial({ color: 0x77797c, roughness: 1 });
  addKitchenFloor(KITCHEN.width - KITCHEN.notchWidth, KITCHEN.length,
    (KITCHEN_INNER_X + KITCHEN_RIGHT) / 2, 0, floorMaterial, carpetMaterial);
  addKitchenFloor(KITCHEN.notchWidth, KITCHEN_HALF_LENGTH - KITCHEN_PANTRY_END_Z,
    (HALF_W + KITCHEN_INNER_X) / 2, (KITCHEN_PANTRY_END_Z + KITCHEN_HALF_LENGTH) / 2,
    floorMaterial, carpetMaterial);
  addKitchenFloor(KITCHEN.notchWidth, KITCHEN.pantryLength,
    (HALF_W + KITCHEN_INNER_X) / 2, KITCHEN.pantryStartZ + KITCHEN.pantryLength / 2,
    mat(0x77736c, .96, { roughness: 1 }), mat(0x88827a, 1));

  buildKitchenShell();
  buildPantryStorage();
  buildKitchenColumns();
  buildKitchenCeiling();
  buildKitchenCoffeePoint();
  buildKitchenDiningArea();
  buildKitchenWindowBar();
  buildKitchenLounge();
  buildKitchenPlantShelves();
  buildKitchenWallArt();

  for (const obstacle of obstacles.slice(firstKitchenObstacle)) {
    obstacle.z += KITCHEN_Z_OFFSET;
  }
}
function createKitchenMovable(id, nameKey, x, localZ, width, depth, build, rotation = 0) {
  const defaultTransform = { x, z: localZ + KITCHEN_Z_OFFSET, rot: rotation };
  const data = getKitchenObjectData(id, defaultTransform);
  const group = new THREE.Group();
  group.name = id;
  group.userData.moveKey = `kitchen:${id}`;
  group.position.set(data.x, 0, data.z - KITCHEN_Z_OFFSET);
  group.rotation.y = data.rot || 0;

  const content = new THREE.Group();
  content.position.set(-x, 0, -localZ);
  group.add(content);

  const previousParent = kitchenGroup;
  const firstObstacle = obstacles.length;
  kitchenGroup = content;
  try {
    build(content);
  } finally {
    kitchenGroup = previousParent;
    obstacles.splice(firstObstacle);
  }

  previousParent.add(group);
  registerMovable(group.userData.moveKey, {
    key: group.userData.moveKey,
    id,
    nameKey,
    group,
    data,
    kind: 'kitchen',
    width,
    depth,
    localX: 0,
    localZ: 0,
    defaultTransform
  });
  return group;
}
function addKitchenFloor(width, length, x, z, baseMaterial, carpetMaterial) {
  const base = new THREE.Mesh(new THREE.PlaneGeometry(width, length), baseMaterial);
  base.rotation.x = -Math.PI / 2;
  base.position.set(x, -.04, z);
  base.receiveShadow = true;
  roomGroup.add(base);

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(.1, width - .12), Math.max(.1, length - .12)), carpetMaterial);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(x, -.008, z);
  carpet.receiveShadow = true;
  roomGroup.add(carpet);
}
function buildKitchenShell() {
  const plaster = mat(0xe3dfd6, .92);
  const charcoal = mat(0x202426, .9);
  const trim = mat(0x343a3b, .42, { metalness: .24 });

  // Corridor-facing wall has one kitchen entrance and two utility-room doors.
  buildKitchenCorridorWall(-KITCHEN_HALF_LENGTH - .07, plaster, trim);

  // The kitchen and office windows face the same positive-Z exterior side.
  box(wallGroup, KITCHEN.width, .76, .14, plaster,
    KITCHEN_CENTER_X, .38, KITCHEN_HALF_LENGTH + .07);
  box(wallGroup, KITCHEN.width, .55, .14, plaster,
    KITCHEN_CENTER_X, 2.525, KITCHEN_HALF_LENGTH + .07);
  box(wallGroup, .18, 1.5, .14, plaster,
    HALF_W + .09, 1.5, KITCHEN_HALF_LENGTH + .07);
  box(wallGroup, .18, 1.5, .14, plaster,
    KITCHEN_RIGHT - .09, 1.5, KITCHEN_HALF_LENGTH + .07);
  box(wallGroup, KITCHEN.width, .1, .14, trim,
    KITCHEN_CENTER_X, .05, KITCHEN_HALF_LENGTH + .07);
  box(wallGroup, KITCHEN.notchWidth, KITCHEN.wallHeight, .14, plaster,
    (HALF_W + KITCHEN_INNER_X) / 2, KITCHEN.wallHeight / 2, KITCHEN_PANTRY_END_Z + .07);
  box(wallGroup, KITCHEN.notchWidth, .1, .14, trim,
    (HALF_W + KITCHEN_INNER_X) / 2, .05, KITCHEN_PANTRY_END_Z + .07);

  // The utility room sits at the lower right corner against the office wall.
  box(wallGroup, .14, KITCHEN.wallHeight, KITCHEN.pantryLength, plaster,
    KITCHEN_INNER_X - .07, KITCHEN.wallHeight / 2, KITCHEN.pantryStartZ + KITCHEN.pantryLength / 2);

  // Keep a solid outer side wall so only the two rooms' north-facing windows remain.
  box(wallGroup, .14, KITCHEN.wallHeight, KITCHEN.length, plaster,
    KITCHEN_RIGHT + .07, KITCHEN.wallHeight / 2, 0);
  box(wallGroup, .1, .1, KITCHEN.length, trim, KITCHEN_RIGHT + .07, .05, 0);

  // Glazed far wall: mullions, sill, upper rail and subtle reflections.
  const glass = mat(0x8fa9a7, .18, {
    transparent: true, opacity: .42, metalness: .12, side: THREE.DoubleSide, depthWrite: false
  });
  const glassFrame = mat(0x252b2c, .38, { metalness: .28 });
  const glassPlaneZ = KITCHEN_HALF_LENGTH - .11;
  const framePlaneZ = KITCHEN_HALF_LENGTH - .06;
  const glassStartX = HALF_W + .18;
  const glassSpan = KITCHEN.width - .36;
  const glassCenterX = (glassStartX + KITCHEN_RIGHT - .18) / 2;
  // Put one dark backing plane inside the glazing opening. Keeping it clear of
  // the solid sill/lintel avoids coplanar wall faces and z-fighting.
  box(wallGroup, glassSpan, 1.39, .03, charcoal,
    glassCenterX, 1.515, KITCHEN_HALF_LENGTH - .025);
  const paneCount = 5;
  const paneWidth = glassSpan / paneCount;
  for (let index = 0; index < paneCount; index++) {
    const x = glassStartX + paneWidth * (index + .5);
    box(windowGroup, paneWidth - .06, 1.39, .025, glass, x, 1.515, glassPlaneZ);
    box(windowGroup, .07, 1.39, .03, glassFrame, x - paneWidth / 2, 1.515, framePlaneZ);
  }
  box(windowGroup, glassSpan, .08, .03, glassFrame, glassCenterX, .78, framePlaneZ);
  box(windowGroup, glassSpan, .08, .03, glassFrame, glassCenterX, 2.25, framePlaneZ);

  box(wallGroup, KITCHEN.width, .12, .06, trim, KITCHEN_CENTER_X, .06, KITCHEN_HALF_LENGTH - .07);

  // A glazed return makes the kitchen's corner visible, matching the reference plan.
  const returnStartZ = HALF_L - KITCHEN_Z_OFFSET;
  const returnLength = KITCHEN_HALF_LENGTH - returnStartZ - .04;
  const returnGlassX = HALF_W + .095;
  const returnFrameX = HALF_W + .03;
  box(wallGroup, .03, 1.39, returnLength - .08, charcoal,
    HALF_W + .13, 1.515, (returnStartZ + KITCHEN_HALF_LENGTH - .04) / 2);
  box(windowGroup, .025, 1.39, returnLength - .08, glass,
    returnGlassX, 1.515, (returnStartZ + KITCHEN_HALF_LENGTH - .04) / 2);
  for (const z of [returnStartZ, KITCHEN_HALF_LENGTH - .08]) {
    box(windowGroup, .03, 1.39, .055, glassFrame, returnFrameX, 1.515, z);
  }
  for (const y of [.78, 2.25]) {
    box(windowGroup, .03, .08, returnLength - .08, glassFrame,
      returnFrameX, y, (returnStartZ + KITCHEN_HALF_LENGTH - .04) / 2);
  }
  obstacles.push({ x: KITCHEN_INNER_X, z: KITCHEN.pantryStartZ + KITCHEN.pantryLength / 2,
    width: .16, depth: KITCHEN.pantryLength, rot: 0 });
  obstacles.push({ x: KITCHEN_INNER_X - .07, z: KITCHEN.pantryStartZ + KITCHEN.pantryLength / 2,
    width: .16, depth: KITCHEN.pantryLength, rot: 0 });
  obstacles.push({ x: KITCHEN_RIGHT + .07, z: 0, width: .16, depth: KITCHEN.length, rot: 0 });
}
function buildKitchenCorridorWall(z, wallMaterial, trim) {
  const openings = [
    { ...KITCHEN_DOORS.pantry, kind: 'pantry' },
    { ...KITCHEN_DOORS.kitchen, kind: 'kitchen' }
  ].sort((left, right) => left.center - right.center);
  const frame = mat(0x292f31, .34, { metalness: .22 });
  const glass = mat(0xa9c4c2, .24, { transparent: true, opacity: .56, side: THREE.DoubleSide });
  let cursor = HALF_W;

  for (const opening of openings) {
    const start = opening.center - opening.width / 2;
    const end = opening.center + opening.width / 2;
    if (start > cursor) {
      const width = start - cursor;
      const center = (start + cursor) / 2;
      box(wallGroup, width, KITCHEN.wallHeight, .14, wallMaterial,
        center, KITCHEN.wallHeight / 2, z);
      box(wallGroup, width, .09, .12, trim, center, .045, z);
      addKitchenObstacle(center, z, width, .16);
    }

    const doorHeight = 2.06;
    box(wallGroup, opening.width, KITCHEN.wallHeight - doorHeight, .14, wallMaterial,
      opening.center, doorHeight + (KITCHEN.wallHeight - doorHeight) / 2, z);
    for (const side of [-1, 1]) {
      box(wallGroup, .045, doorHeight, .075, frame,
        opening.center + side * (opening.width / 2 - .0225), doorHeight / 2, z + .01);
    }
    if (opening.kind === 'pantry') {
      const leafWidth = (opening.width - .06) / 2;
      const openingLeft = opening.center - opening.width / 2;
      for (const direction of [1, -1]) {
        const leaf = new THREE.Group();
        const hingeX = direction > 0 ? openingLeft : opening.center + opening.width / 2;
        const openRotation = direction > 0 ? -Math.PI / 2 : Math.PI / 2;
        const leafCenter = direction * leafWidth / 2;
        leaf.position.set(hingeX, 0, z + .025);
        leaf.rotation.y = openRotation;
        box(leaf, leafWidth, doorHeight - .05, .035, frame,
          leafCenter, doorHeight / 2, 0);
        box(leaf, leafWidth - .12, doorHeight - .28, .012, glass,
          leafCenter, doorHeight / 2, .025);
        box(leaf, .025, .11, .025, mat(0xc8b16d, .34, { metalness: .42 }),
          direction * leafWidth * .76, 1.02, .048);
        wallGroup.add(leaf);
        registerWalkDoor({
          group: leaf,
          hingeX,
          hingeZ: z + KITCHEN_Z_OFFSET + .025,
          width: leafWidth,
          direction,
          closedRotation: 0,
          openRotation,
          targetRotation: openRotation
        });
      }
    } else {
      const leafWidth = opening.width - .09;
      const leaf = new THREE.Group();
      const hingeX = opening.center - leafWidth / 2;
      const openRotation = -Math.PI / 2;
      leaf.position.set(hingeX, 0, z + .025);
      leaf.rotation.y = openRotation;
      box(leaf, leafWidth, doorHeight - .05, .035, frame, leafWidth / 2, doorHeight / 2, 0);
      box(leaf, leafWidth - .12, doorHeight - .28, .012, glass, leafWidth / 2, doorHeight / 2, .025);
      box(leaf, .025, .11, .025, mat(0xc8b16d, .34, { metalness: .42 }), leafWidth * .84, 1.02, .048);
      wallGroup.add(leaf);
      registerWalkDoor({
        group: leaf,
        hingeX,
        hingeZ: z + KITCHEN_Z_OFFSET + .025,
        width: leafWidth,
        closedRotation: 0,
        openRotation,
        targetRotation: leaf.rotation.y
      });
    }
    cursor = end;
  }

  if (cursor < KITCHEN_RIGHT) {
    const width = KITCHEN_RIGHT - cursor;
    const center = (KITCHEN_RIGHT + cursor) / 2;
    box(wallGroup, width, KITCHEN.wallHeight, .14, wallMaterial,
      center, KITCHEN.wallHeight / 2, z);
    box(wallGroup, width, .09, .12, trim, center, .045, z);
    addKitchenObstacle(center, z, width, .16);
  }
}
function buildKitchenColumns() {
  const columnMaterial = mat(0x242729, .88);
  const capMaterial = mat(0x343839, .42, { metalness: .22 });
  const positions = [[7.9, -4.15], [10.45, -.15], [7.4, 4.55]];
  positions.forEach(([x, z], index) => createKitchenMovable(
    `kitchen-column-${index + 1}`, 'kitchenColumn', x, z, .52, .52, () => {
      box(kitchenGroup, .42, KITCHEN.wallHeight - .06, .42, columnMaterial,
        x, (KITCHEN.wallHeight - .06) / 2, z);
      box(kitchenGroup, .52, .09, .52, capMaterial, x, .045, z);
      box(kitchenGroup, .5, .08, .5, capMaterial, x, KITCHEN.wallHeight - .04, z);
      for (const y of [.82, 1.62, 2.42]) {
        box(kitchenGroup, .43, .012, .008, capMaterial, x, y, z + .216);
        box(kitchenGroup, .43, .012, .008, capMaterial, x, y, z - .216);
      }
    }
  ));
}
function buildPantryStorage() {
  const backRack = { x: 4.12, z: -1.19, width: 2.05, depth: .5 };
  createKitchenMovable('pantry-rack-back', 'pantryRack', backRack.x, backRack.z,
    backRack.width, backRack.depth, () => buildPantryRack(backRack, 'back'));

  const sideRack = { x: 5.55, z: -2.65, width: 2.25, depth: .52 };
  createKitchenMovable('pantry-rack-side', 'pantryRack', sideRack.x, sideRack.z,
    sideRack.width, sideRack.depth, () => buildPantryRack(sideRack, 'side'), Math.PI / 2);

  const toolStorage = { x: 5.56, z: -4.55, width: .48, depth: .72 };
  createKitchenMovable('pantry-cleaning-tools', 'cleaningTools', toolStorage.x, toolStorage.z,
    toolStorage.width, toolStorage.depth, () => buildPantryCleaningTools(toolStorage));

  const cartons = { x: 4.08, z: -3.55, width: .92, depth: .82 };
  createKitchenMovable('pantry-cartons', 'pantryCartons', cartons.x, cartons.z,
    cartons.width, cartons.depth, () => buildPantryCartons(cartons));
}
function buildPantryRack(rack, section) {
  const steel = mat(0x343a3b, .4, { metalness: .48 });
  const steelEdge = mat(0x59605f, .36, { metalness: .48 });
  const shelfWood = mat(0x9a7651, .74);
  const xOffsets = [-rack.width / 2 + .045, rack.width / 2 - .045];
  const zOffsets = [-rack.depth / 2 + .035, rack.depth / 2 - .035];

  for (const dx of xOffsets) {
    for (const dz of zOffsets) {
      box(kitchenGroup, .045, 2.16, .045, steel, rack.x + dx, 1.08, rack.z + dz);
      for (const y of [.24, .79, 1.34, 1.89]) {
        box(kitchenGroup, .052, .035, .052, steelEdge, rack.x + dx, y, rack.z + dz);
      }
    }
  }
  for (const y of [.22, .76, 1.3, 1.84]) {
    box(kitchenGroup, rack.width - .1, .055, rack.depth, shelfWood, rack.x, y, rack.z);
    box(kitchenGroup, rack.width - .1, .018, .025, steelEdge,
      rack.x, y + .035, rack.z + rack.depth / 2 - .012);
  }
  for (const y of [.46, 1.01, 1.56, 2.11]) {
    box(kitchenGroup, .018, .018, rack.depth - .1, steel, rack.x, y, rack.z);
  }

  const packages = section === 'back'
    ? [
      [-.72, .5, .2, .24, .22, 0x76523a], [-.42, .5, .2, .24, .22, 0x9a6a43],
      [-.08, .51, .16, .27, .18, 0xe5d9b8], [.25, .51, .16, .26, .18, 0xe7dfc9],
      [.59, .5, .22, .25, .21, 0x9e754f], [.76, 1.05, .16, .3, .17, 0xefe5ce],
      [.42, 1.05, .16, .3, .17, 0x76523a], [.1, 1.05, .2, .26, .22, 0xd6be91],
      [-.28, 1.05, .18, .29, .2, 0x6e503a], [-.62, 1.05, .2, .3, .21, 0xc9b08a],
      [-.68, 1.59, .18, .29, .19, 0x74634b], [-.34, 1.59, .16, .28, .18, 0xe8dec9],
      [.02, 1.59, .2, .28, .2, 0x9b744f], [.4, 1.59, .18, .3, .2, 0xd9c7a4],
      [.73, 1.59, .15, .26, .16, 0x826044]
    ]
    : [
      [-.72, .5, .18, .24, .2, 0xb68e5f], [-.34, .5, .16, .22, .18, 0xe9dfc4],
      [.04, .5, .2, .24, .22, 0x78533c], [.42, .5, .17, .25, .18, 0xcdb58f],
      [.72, .5, .16, .22, .18, 0x988168], [-.7, 1.05, .18, .28, .18, 0x7a563b],
      [-.32, 1.05, .2, .27, .2, 0xd8c6a5], [.06, 1.05, .16, .29, .18, 0xa47b51],
      [.43, 1.05, .18, .27, .2, 0xe9dfc4], [.72, 1.59, .2, .29, .2, 0x8c6847]
    ];
  for (const [offset, y, width, height, depth, color] of packages) {
    makePantryPackage(rack.x + offset, y, rack.z, width, height, depth, color);
  }

  const canRows = section === 'back' ? [-.78, -.53, -.28, .03, .28, .53] : [-.63, -.31, .01, .33, .63];
  for (const offset of canRows) {
    const x = rack.x + offset;
    cylinder(kitchenGroup, .072, .072, .24, mat(0x858783, .34, { metalness: .42 }),
      x, section === 'back' ? 1.43 : 1.43, rack.z, 16);
    cylinder(kitchenGroup, .068, .068, .012, mat(0xc2b998, .42), x, 1.555, rack.z, 16);
    box(kitchenGroup, .01, .1, .13, mat(offset % 2 ? 0x7c5940 : 0x687c73, .7),
      x + .068, 1.43, rack.z);
  }
}
function makePantryPackage(x, y, z, width, height, depth, color) {
  const packageMaterial = mat(color, .72);
  const labelMaterial = mat(0xe5ddc9, .68);
  box(kitchenGroup, width, height, depth, packageMaterial, x, y, z);
  box(kitchenGroup, width * .55, height * .32, .012, labelMaterial,
    x, y, z + depth / 2 + .007);
  box(kitchenGroup, width * .62, .018, depth + .015, mat(0xbca578, .66),
    x, y + height / 2 - .012, z);
}
function buildPantryCleaningTools(storage) {
  const handleMaterials = [mat(0x9b744c, .54), mat(0x586a69, .48, { metalness: .18 }), mat(0x343a3b, .45, { metalness: .22 })];
  const headMaterials = [mat(0xb6b3a9, .86), mat(0x7d8884, .9), mat(0xd2c9b7, .9)];
  const toolX = storage.x;
  const toolZ = storage.z;
  for (let index = 0; index < 3; index++) {
    const x = toolX - .16 + index * .16;
    const leaning = (index - 1) * .1;
    const handle = cylinder(kitchenGroup, .012, .014, 1.65, handleMaterials[index],
      x + leaning / 2, .91, toolZ, 12);
    handle.rotation.z = leaning;
    if (index === 0) {
      box(kitchenGroup, .29, .09, .13, headMaterials[index], x - .06, .13, toolZ);
      for (let fringe = 0; fringe < 7; fringe++) {
        box(kitchenGroup, .018, .15, .02, headMaterials[index], x - .18 + fringe * .04, .025, toolZ);
      }
    } else if (index === 1) {
      box(kitchenGroup, .08, .17, .12, headMaterials[index], x, .13, toolZ);
      for (let fringe = 0; fringe < 5; fringe++) {
        box(kitchenGroup, .018, .12, .018, headMaterials[index], x - .04 + fringe * .02, .025, toolZ + .07);
      }
    } else {
      box(kitchenGroup, .14, .055, .14, headMaterials[index], x, .055, toolZ);
      for (let bristle = 0; bristle < 5; bristle++) {
        box(kitchenGroup, .012, .06, .012, headMaterials[index], x - .05 + bristle * .025, .0, toolZ + .075);
      }
    }
  }
  const bucket = mat(0x78837f, .48, { metalness: .12 });
  cylinder(kitchenGroup, .19, .16, .32, bucket, toolX - .05, .16, toolZ + .28, 20);
  cylinder(kitchenGroup, .2, .2, .025, mat(0x343a3b, .38, { metalness: .22 }), toolX - .05, .33, toolZ + .28, 20);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.16, .012, 8, 20), mat(0xb0b4ae, .38, { metalness: .38 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(toolX - .05, .33, toolZ + .28);
  kitchenGroup.add(rim);
}
function buildPantryCartons(storage) {
  const stacks = [
    { x: storage.x - .21, z: storage.z - .15, w: .48, h: .38, d: .42, color: 0xb88957 },
    { x: storage.x + .2, z: storage.z - .16, w: .42, h: .3, d: .38, color: 0xc49a67 },
    { x: storage.x - .11, z: storage.z + .22, w: .6, h: .34, d: .36, color: 0xa97849 },
    { x: storage.x + .17, z: storage.z + .04, w: .32, h: .24, d: .3, color: 0xd0a878 }
  ];
  for (const carton of stacks) {
    const y = carton.h / 2 + (carton === stacks[3] ? .68 : 0);
    box(kitchenGroup, carton.w, carton.h, carton.d, mat(carton.color, .9), carton.x, y, carton.z);
    box(kitchenGroup, .045, carton.h + .008, carton.d + .012, mat(0xe0c69c, .84),
      carton.x, y, carton.z);
    box(kitchenGroup, carton.w * .42, .12, .012, mat(0xe7dfcf, .76),
      carton.x, y + .035, carton.z + carton.d / 2 + .008);
    box(kitchenGroup, carton.w * .25, .025, .012, mat(0x74766e, .8),
      carton.x, y + .035, carton.z + carton.d / 2 + .016);
  }
  for (const [index, color] of [0x827052, 0xddd1b5, 0x566b5d].entries()) {
    const canX = storage.x - .33 + index * .27;
    cylinder(kitchenGroup, .075, .075, .27, mat(0x888b86, .32, { metalness: .46 }),
      canX, .14, storage.z - .43, 16);
    cylinder(kitchenGroup, .071, .071, .015, mat(0xc5c0b3, .3, { metalness: .52 }),
      canX, .282, storage.z - .43, 16);
    box(kitchenGroup, .01, .13, .14, mat(color, .62), canX + .07, .14, storage.z - .43);
  }
}
function buildKitchenCeiling() {
  kitchenCeiling = new THREE.Group();
  kitchenCeiling.name = 'Kitchen rails, lamps and leaf garlands';
  kitchenCeiling.visible = false;
  roomGroup.add(kitchenCeiling);

  const rail = mat(0x141819, .76, { metalness: .22 });
  const lampHousing = mat(0x343a3c, .48, { metalness: .26 });
  const led = new THREE.MeshStandardMaterial({ color: 0xfff4dc, emissive: 0xffe0a8, emissiveIntensity: 1.55, roughness: .32 });
  for (const z of [-3.9, -1.15, 1.6, 4.45]) {
    const armStart = z > KITCHEN.pantryStartZ ? KITCHEN_INNER_X + .25 : HALF_W + .25;
    box(kitchenCeiling, .06, .07, KITCHEN_RIGHT - armStart - .2, rail,
      (KITCHEN_RIGHT + armStart - .2) / 2, KITCHEN.wallHeight - .12, z);
  }
  for (const x of [5.1, 7.85, 10.6]) {
    const beginZ = x < KITCHEN_INNER_X ? -KITCHEN_HALF_LENGTH + .3 : -KITCHEN_HALF_LENGTH + .3;
    const endZ = x < KITCHEN_INNER_X ? .7 : KITCHEN_HALF_LENGTH - .3;
    for (let z = beginZ + .8; z < endZ; z += 2.15) {
      if (x < KITCHEN_INNER_X && z > KITCHEN.pantryStartZ) continue;
      box(kitchenCeiling, .9, .065, .13, lampHousing, x, KITCHEN.wallHeight - .18, z);
      box(kitchenCeiling, .76, .018, .075, led, x, KITCHEN.wallHeight - .222, z);
    }
  }
  makeKitchenGarland(kitchenCeiling, -1.5, HALF_W + .75, KITCHEN_RIGHT - .9);
  makeKitchenGarland(kitchenCeiling, 2.35, KITCHEN_INNER_X + .55, KITCHEN_RIGHT - .7);

  for (const [x, z] of [[5.2, -3.4], [9.3, -.8], [9.2, 3.8]]) {
    const light = new THREE.PointLight(0xffedcf, 13, 5.5, 1.6);
    light.position.set(x, KITCHEN.wallHeight - .3, z);
    kitchenCeiling.add(light);
  }
}
function makeKitchenGarland(parent, z, startX, endX) {
  const wire = mat(0x302a24, .82);
  const vine = mat(0x58452f, .84);
  const leafMaterials = [mat(0x9b4d2c, .76), mat(0xb66635, .74), mat(0x7c382a, .78), mat(0xc27a3e, .72)];
  const points = [];
  for (let index = 0; index <= 12; index++) {
    const t = index / 12;
    points.push([startX + (endX - startX) * t, 2.61 + Math.sin(t * Math.PI) * .15, z + Math.sin(t * Math.PI * 2) * .06]);
  }
  addCable(parent, points, wire, .008);
  for (let index = 0; index < 48; index++) {
    const t = (index + .4) / 48;
    const x = startX + (endX - startX) * t;
    const y = 2.61 + Math.sin(t * Math.PI) * .15;
    const vineZ = z + Math.sin(t * Math.PI * 2) * .06;
    const side = index % 2 ? -1 : 1;
    const leafStem = cylinder(parent, .004, .004, .11, vine, x, y - .04, vineZ + side * .015, 6);
    leafStem.rotation.z = side * .42;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), leafMaterials[index % leafMaterials.length]);
    leaf.position.set(x + side * .035, y - .075, vineZ + side * .025);
    leaf.scale.set(.045, .012, .028);
    leaf.rotation.y = (index % 7) * .48;
    parent.add(leaf);
  }
}
function buildKitchenCoffeePoint() {
  const xStart = 7.35;
  const xEnd = 12.15;
  const centerX = (xStart + xEnd) / 2;
  const z = -KITCHEN_HALF_LENGTH + .48;
  const length = xEnd - xStart;
  createKitchenMovable('coffee-counter', 'coffeeCounter', centerX, z, length, .82, () => {
    const wood = mat(0x78543a, .64);
    const woodEdge = mat(0x9a704b, .52);
    const dark = mat(0x242829, .5, { metalness: .18 });
    const backsplash = mat(0x302e2b, .72);

    box(kitchenGroup, length, .09, .68, wood, centerX, .94, z);
    box(kitchenGroup, length, .035, .7, woodEdge, centerX, .89, z);
    box(kitchenGroup, length, .55, .58, dark, centerX, .58, z);
    for (const x of [xStart + .12, centerX, xEnd - .12]) {
      box(kitchenGroup, .055, .82, .055, dark, x, .47, z);
      box(kitchenGroup, .055, .82, .055, dark, x, .47, z + .28);
    }
    box(kitchenGroup, length + .3, 1.18, .08, backsplash, centerX, 1.43, z - .43);
    box(kitchenGroup, length, .055, .4, wood, centerX, 1.64, z - .46);
    box(kitchenGroup, length, .05, .4, wood, centerX, 2.16, z - .46);
    for (const x of [xStart + .08, xEnd - .08]) {
      box(kitchenGroup, .045, .68, .045, dark, x, 1.84, z - .47);
      box(kitchenGroup, .045, .68, .045, dark, x, 1.84, z - .13);
    }
    for (const x of [xStart + .38, xStart + 1.15, centerX + .1, xEnd - 1.0]) {
      cylinder(kitchenGroup, .065, .055, .19, mat(0x4a4038, .72), x, 1.76, z - .48, 16);
      cylinder(kitchenGroup, .066, .066, .018, mat(0xb4a48b, .44), x, 1.864, z - .48, 16);
    }
    makeKitchenEspressoMachine(kitchenGroup, centerX + .35, z - .01);
    makeKitchenGrinder(kitchenGroup, centerX - 1.08, z - .03);
    makeKitchenGrinder(kitchenGroup, centerX + 1.72, z - .02);
    makeKitchenCup(kitchenGroup, centerX - 1.55, z - .01, 0xf0e7d8);
    makeKitchenCup(kitchenGroup, centerX + 1.36, z - .02, 0xf0e7d8);
  });
  createKitchenMovable('water-dispenser', 'waterDispenser', xStart + .25, z + .8, .58, .58,
    () => makeKitchenWaterDispenser(kitchenGroup, xStart + .25, z + .8));
}
function makeKitchenEspressoMachine(parent, x, z) {
  const body = mat(0x171b1c, .38, { metalness: .26 });
  const stainless = mat(0xb5b7b2, .32, { metalness: .65 });
  const glass = mat(0x425152, .16, { metalness: .2 });
  box(parent, .82, .58, .49, body, x, 1.27, z);
  box(parent, .76, .05, .47, stainless, x, .98, z);
  box(parent, .23, .17, .018, glass, x - .2, 1.39, z + .255);
  box(parent, .16, .11, .014, mat(0x63a6a4, .28, { emissive: 0x174e52, emissiveIntensity: .5 }),
    x - .2, 1.39, z + .27);
  for (const xOffset of [-.23, .23]) {
    cylinder(parent, .1, .1, .07, stainless, x + xOffset, 1.63, z, 16);
    cylinder(parent, .09, .09, .015, body, x + xOffset, 1.672, z, 16);
    const group = new THREE.Group();
    group.position.set(x + xOffset, 1.2, z + .3);
    parent.add(group);
    const handle = box(group, .28, .025, .025, stainless, .1, 0, 0);
    handle.rotation.y = -.16;
  }
  box(parent, .54, .045, .14, stainless, x, 1.015, z + .3);
  for (let index = -3; index <= 3; index++) {
    box(parent, .008, .006, .13, body, x + index * .065, 1.041, z + .3);
  }
  for (let index = 0; index < 3; index++) {
    const button = new THREE.MeshStandardMaterial({ color: 0xe6c678, emissive: 0x755321, emissiveIntensity: .6 });
    cylinder(parent, .014, .014, .01, button, x + .18 + index * .075, 1.52, z + .26, 10);
  }
}
function makeKitchenGrinder(parent, x, z) {
  const black = mat(0x1c2021, .4, { metalness: .2 });
  const hopper = mat(0x806d4f, .16, { transparent: true, opacity: .68 });
  box(parent, .3, .3, .28, black, x, 1.12, z);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.04, .11, .2, 18), hopper);
  bowl.position.set(x, 1.37, z);
  parent.add(bowl);
  cylinder(parent, .11, .11, .035, mat(0x393d3b, .3, { metalness: .4 }), x, 1.49, z, 18);
  box(parent, .16, .055, .014, mat(0x527d79, .24, { emissive: 0x1c423f, emissiveIntensity: .35 }), x, 1.17, z + .147);
  box(parent, .16, .022, .18, black, x, .96, z);
}
function makeKitchenWaterDispenser(parent, x, z) {
  const white = mat(0xe8e7e0, .48);
  const dark = mat(0x303638, .28, { metalness: .22 });
  box(parent, .48, .92, .48, white, x, .46, z);
  box(parent, .36, .28, .025, dark, x, .63, z + .252);
  box(parent, .28, .09, .08, dark, x, .93, z);
  cylinder(parent, .19, .16, .48, mat(0x8dc4c8, .1, { transparent: true, opacity: .46 }), x, 1.24, z, 20);
  cylinder(parent, .19, .19, .035, mat(0xb4dadd, .18, { transparent: true, opacity: .6 }), x, 1.49, z, 20);
  box(parent, .12, .16, .035, mat(0xb65239, .38), x - .1, .72, z + .29);
  box(parent, .12, .16, .035, mat(0x467c9c, .35), x + .1, .72, z + .29);
  addKitchenObstacle(x, z, .58, .58);
}
function makeKitchenCup(parent, x, z, color = 0xf0e7d8) {
  const cup = mat(color, .32);
  cylinder(parent, .045, .035, .09, cup, x, .995, z, 16);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.03, .006, 8, 16, Math.PI), cup);
  handle.position.set(x + .05, 1, z);
  handle.rotation.z = Math.PI / 2;
  parent.add(handle);
}
function buildKitchenDiningArea() {
  const tables = [
    [6.72, -3.05],
    [9.45, -3.05],
    [6.72, -.15],
    [9.45, -.15]
  ];
  tables.forEach(([x, z], index) => {
    createKitchenMovable(`dining-table-${index + 1}`, 'kitchenTable', x, z, 2.16, 1.96,
      () => makeKitchenDiningTable(kitchenGroup, x, z));
  });
}
function makeKitchenDiningTable(parent, x, z) {
  const width = 2.16;
  const depth = .96;
  const top = mat(0xd1cec6, .48);
  const edge = mat(0xa8a49b, .42);
  const frame = mat(0x202425, .64, { metalness: .18 });
  box(parent, width, .055, depth, edge, x, .755, z);
  box(parent, width - .035, .035, depth - .035, top, x, .8, z);
  box(parent, width - .08, .1, .045, frame, x, .68, z - depth / 2 + .09);
  box(parent, width - .08, .1, .045, frame, x, .68, z + depth / 2 - .09);
  for (const dx of [-width / 2 + .1, width / 2 - .1]) {
    for (const dz of [-depth / 2 + .1, depth / 2 - .1]) {
      const leg = box(parent, .045, .72, .045, frame, x + dx, .37, z + dz);
      leg.rotation.z = dx < 0 ? -.035 : .035;
      box(parent, .07, .018, .07, frame, x + dx, .025, z + dz);
    }
  }
  for (const chairX of [x - .62, x + .62]) {
    makeKitchenChair(parent, chairX, z - .76, 0);
    makeKitchenChair(parent, chairX, z + .76, Math.PI);
  }
  makeKitchenNapkinHolder(parent, x - .5, z + .03);
  makeKitchenCup(parent, x + .45, z - .04, 0xded8cb);
  cylinder(parent, .032, .025, .095, mat(0x8b806a, .3, { transparent: true, opacity: .78 }), x, .86, z - .12, 14);
  addKitchenObstacle(x, z, width + .08, depth + .1);
}
function makeKitchenChair(parent, x, z, rotation = 0) {
  const chair = new THREE.Group();
  chair.position.set(x, 0, z);
  chair.rotation.y = rotation;
  parent.add(chair);
  const shell = mat(0x303234, .78);
  const wood = mat(0x8c6644, .62);
  const black = mat(0x242829, .55, { metalness: .15 });
  box(chair, .46, .07, .44, shell, 0, .47, 0);
  box(chair, .46, .48, .07, shell, 0, .72, -.18);
  for (const dx of [-.17, .17]) {
    const front = box(chair, .032, .48, .032, wood, dx, .24, .13);
    front.rotation.x = dx * .22;
    const rear = box(chair, .032, .48, .032, wood, dx, .24, -.15);
    rear.rotation.x = dx * .16;
  }
  for (const dx of [-.17, .17]) {
    box(chair, .02, .34, .02, black, dx, .66, -.2);
  }
}
function makeKitchenNapkinHolder(parent, x, z) {
  const metal = mat(0x292d2d, .35, { metalness: .35 });
  box(parent, .15, .025, .11, metal, x, .835, z);
  box(parent, .012, .19, .012, metal, x - .065, .93, z);
  box(parent, .012, .19, .012, metal, x + .065, .93, z);
  for (let index = 0; index < 5; index++) {
    const sheet = box(parent, .105, .002, .075, mat(0xf4f0e8, .9), x, .842 + index * .004, z);
    sheet.rotation.z = (index - 2) * .025;
  }
}
function addKitchenObstacle(x, z, width, depth, rot = 0) {
  obstacles.push({ x, z, width, depth, rot });
}
function buildKitchenWindowBar() {
  const wood = mat(0x704e36, .57);
  const edge = mat(0x9c724d, .5);
  const metal = mat(0x282c2d, .42, { metalness: .28 });
  const centerX = 7.0;
  const centerZ = 4.65;
  const length = 7.8;
  createKitchenMovable('window-bar', 'windowBar', centerX, centerZ, length, 1.65, () => {
    box(kitchenGroup, length, .07, .62, wood, centerX, .96, centerZ);
    box(kitchenGroup, length, .025, .62, edge, centerX, 1.0, centerZ);
    for (const x of [centerX - length / 2 + .14, centerX, centerX + length / 2 - .14]) {
      box(kitchenGroup, .05, .88, .5, metal, x, .48, centerZ);
    }
    for (const x of [3.65, 4.8, 5.95, 7.1, 8.25, 9.4, 10.55]) {
      makeKitchenBarStool(kitchenGroup, x, centerZ - .56);
    }
    for (const x of [4.15, 7.0, 9.85]) makeKitchenPlant(kitchenGroup, x, 1.02, centerZ, .72);
  });
}
function makeKitchenBarStool(parent, x, z) {
  const metal = mat(0x252a2b, .5, { metalness: .25 });
  const seat = mat(0x373b3d, .72);
  cylinder(parent, .21, .21, .07, seat, x, .68, z, 20);
  const post = cylinder(parent, .027, .035, .61, metal, x, .34, z, 12);
  post.rotation.z = 0;
  cylinder(parent, .26, .26, .035, metal, x, .04, z, 16);
  const footRing = new THREE.Mesh(new THREE.TorusGeometry(.15, .012, 8, 20), metal);
  footRing.rotation.x = Math.PI / 2;
  footRing.position.set(x, .28, z);
  parent.add(footRing);
}
function buildKitchenLounge() {
  createKitchenMovable('sofa-blue', 'kitchenSofa', 3.45, 2.0, 2.15, .92,
    () => makeKitchenSofa(kitchenGroup, 3.45, 2.0, 0, 0x82aaa9), Math.PI / 2);
  createKitchenMovable('sofa-green', 'kitchenSofa', 4.9, 2.75, 2.15, .92,
    () => makeKitchenSofa(kitchenGroup, 4.9, 2.75, 0, 0x234d4c));
  createKitchenMovable('sofa-yellow', 'kitchenSofa', 4.6, 1.3, 1.65, .92,
    () => makeKitchenSofa(kitchenGroup, 4.6, 1.3, 0, 0xd9b843, true));

  createKitchenMovable('lounge-table', 'loungeTable', 6.8, 2.2, .9, .6, () => {
    const tableTop = mat(0x94704e, .54);
    const legs = mat(0x282b2c, .56, { metalness: .18 });
    box(kitchenGroup, .82, .055, .52, tableTop, 6.8, .43, 2.2);
    for (const dx of [-.32, .32]) for (const dz of [-.18, .18]) {
      box(kitchenGroup, .028, .42, .028, legs, 6.8 + dx, .21, 2.2 + dz);
    }
    box(kitchenGroup, .28, .035, .19, mat(0x41464a, .6), 6.7, .48, 2.15);
    box(kitchenGroup, .24, .018, .18, mat(0xb18c51, .52), 6.7, .505, 2.15);
    makeKitchenPlant(kitchenGroup, 7.1, .48, 2.25, .36);
  });
}
function makeKitchenSofa(parent, x, z, rotation, color, loveseat = false) {
  const sofa = new THREE.Group();
  sofa.position.set(x, 0, z);
  sofa.rotation.y = rotation;
  parent.add(sofa);
  const width = loveseat ? 1.55 : 2.05;
  const depth = .82;
  const upholstery = mat(color, .88);
  const dark = mat(0x343637, .72);
  const wood = mat(0x443b32, .68);
  box(sofa, width, .24, depth, dark, 0, .34, 0);
  box(sofa, width - .13, .18, depth - .16, upholstery, 0, .53, .04);
  box(sofa, width, .42, .16, upholstery, 0, .67, -.32);
  for (const side of [-1, 1]) {
    box(sofa, .17, .45, depth, upholstery, side * (width / 2 - .085), .53, -.015);
    for (const legZ of [-.28, .28]) box(sofa, .045, .24, .045, wood,
      side * (width / 2 - .13), .12, legZ);
  }
  const cushionColors = [color === 0xd9b843 ? 0xe7ce73 : 0xb7cdca, color === 0x234d4c ? 0x3e706d : 0xaac3c1];
  for (let index = 0; index < (loveseat ? 2 : 3); index++) {
    box(sofa, width / (loveseat ? 2.7 : 3.4), .18, .42, mat(cushionColors[index % 2], .92),
      -width * .27 + index * width * .27, .66, -.045);
  }
  for (const legX of [-width * .38, width * .38]) {
    const leg = box(sofa, .035, .2, .035, wood, legX, .11, .26);
    leg.rotation.x = -.2;
  }
  addKitchenObstacle(x, z, width + .08, depth + .08, rotation);
}
function buildKitchenPlantShelves() {
  createKitchenMovable('plant-shelf', 'plantShelf', 11.2, 4.45, .94, 2.1, () => {
    const shelf = new THREE.Group();
    shelf.name = 'Open plant and cubby shelf';
    shelf.position.set(11.2, 0, 4.45);
    kitchenGroup.add(shelf);
    const frame = mat(0x202526, .45, { metalness: .3 });
    const boards = mat(0x805a3c, .6);
    for (const z of [-.95, 0, .95]) {
      box(shelf, .065, 2.15, .065, frame, 0, 1.075, z);
      box(shelf, .065, 2.15, .065, frame, .86, 1.075, z);
    }
    for (const y of [.08, .78, 1.45, 2.1]) {
      box(shelf, .92, .055, 2.02, boards, .43, y, 0);
    }
    const cubbies = [
      [0, 1.12, 0xc77e78], [.43, 1.12, 0xe3cf72], [.86, 1.12, 0x82aaa9],
      [.2, .43, 0x64717c], [.65, .43, 0xb88858]
    ];
    cubbies.forEach(([z, y, color], index) => {
      const x = index % 2 ? .87 : .44;
      box(shelf, .035, .48, .56, mat(color, .72), x, y, z - .1);
      if (index % 2 === 0) {
        makeKitchenPlant(shelf, x - .04, y + .25, z + .08, .48);
      } else {
        box(shelf, .2, .24, .16, mat(index === 1 ? 0x62524a : 0x84938e, .82), x + .02, y + .13, z);
      }
    });
  });
}
function buildKitchenWallArt() {
  const backgrounds = [0xc9b5a0, 0x79918d, 0xc78a70, 0xdbc891, 0x63797a, 0xb27869];
  const darkFrame = mat(0x282b2c, .48, { metalness: .16 });
  const centerX = KITCHEN_RIGHT - .09;
  const centerZ = .3;
  createKitchenMovable('wall-art', 'kitchenWallArt', centerX, centerZ, .18, 6.6, () => {
    const portrait = new THREE.Group();
    portrait.name = 'Kitchen portrait collage';
    kitchenGroup.add(portrait);
    let index = 0;
    for (const y of [1.45, 2.1]) {
      for (const z of [-2.7, -1.5, -.3, .9, 2.1, 3.3]) {
        const panel = new THREE.Group();
        panel.position.set(centerX, y, z);
        panel.rotation.y = Math.PI;
        portrait.add(panel);
        box(panel, .035, .62, .48, darkFrame, 0, 0, 0);
        box(panel, .018, .55, .41, mat(backgrounds[index % backgrounds.length], .78), .027, 0, 0);
        const skinColors = [0xd9b393, 0x9d694d, 0xe5c5a4, 0x80563e];
        const skin = new THREE.Mesh(
          new THREE.SphereGeometry(.105, 16, 12),
          mat(skinColors[index % skinColors.length], .9)
        );
        skin.scale.set(.12, 1, .82);
        skin.position.set(.043, .105, -.015);
        panel.add(skin);
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(.11, 16, 10),
          mat(index % 2 ? 0x302b29 : 0x564034, .95)
        );
        hair.scale.set(.11, .45, .85);
        hair.position.set(.046, .18, -.015);
        panel.add(hair);
        box(panel, .012, .22, .3,
          mat([0xeaded0, 0x3f5558, 0x8d5860, 0xd4b476][index % 4], .9),
          .043, -.19, 0);
        index++;
      }
    }
  });
}
function makeKitchenPlant(parent, x, y, z, scale = 1) {
  const pot = new THREE.Group();
  pot.position.set(x, y, z);
  pot.scale.setScalar(scale);
  parent.add(pot);
  const ceramic = mat(0xe3ded2, .62);
  const darkSoil = mat(0x3c342b, 1);
  const greens = [mat(0x47734e, .84), mat(0x638a5a, .82), mat(0x315c42, .9)];
  cylinder(pot, .105, .075, .17, ceramic, 0, .085, 0, 20);
  cylinder(pot, .11, .11, .018, mat(0xc6b9a3, .56), 0, .17, 0, 20);
  cylinder(pot, .09, .09, .012, darkSoil, 0, .18, 0, 20);
  for (let index = 0; index < 9; index++) {
    const angle = index * Math.PI * 2 / 9;
    const height = .28 + (index % 3) * .06;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), greens[index % greens.length]);
    leaf.position.set(Math.cos(angle) * .11, .2 + height * .48, Math.sin(angle) * .11);
    leaf.scale.set(.035, height * .55, .025);
    leaf.rotation.z = -Math.cos(angle) * .72;
    leaf.rotation.x = Math.sin(angle) * .55;
    pot.add(leaf);
  }
  for (const stemX of [-.035, .025]) {
    cylinder(pot, .008, .012, .33, greens[2], stemX, .32, 0, 8);
  }
}


  return {
    build() {
      buildKitchen();
      return { group: kitchenGroup, ceiling: kitchenCeiling };
    }
  };
}
