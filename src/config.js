export const ROOM = { width: 5.76, length: 8.395, wallHeight: 2.8 };
export const HALF_W = ROOM.width / 2;
export const HALF_L = ROOM.length / 2;
// Approximate until on-site kitchen dimensions are available.
export const KITCHEN = {
  width: 9.6,
  length: 11.2,
  wallHeight: 2.8,
  notchWidth: 3.1,
  // The hand-drawn plan places the pantry's upper wall around the room center.
  pantryLength: 4.8,
  pantryStartZ: -5.6
};
export const KITCHEN_RIGHT = HALF_W + KITCHEN.width;
export const KITCHEN_INNER_X = HALF_W + KITCHEN.notchWidth;
export const KITCHEN_CENTER_X = HALF_W + KITCHEN.width / 2;
export const KITCHEN_HALF_LENGTH = KITCHEN.length / 2;
export const KITCHEN_PANTRY_END_Z = KITCHEN.pantryStartZ + KITCHEN.pantryLength;
export const KITCHEN_Z_OFFSET = KITCHEN_HALF_LENGTH - HALF_L;
// Place the kitchen on the opposite side from the screenshot's current layout.
export const KITCHEN_WORLD_LEFT = HALF_W;
export const KITCHEN_WORLD_TOP = KITCHEN_HALF_LENGTH + KITCHEN_Z_OFFSET;
export const SITE_CENTER_X = (KITCHEN_WORLD_LEFT + KITCHEN_RIGHT) / 2;
export const SITE_CENTER_Z = KITCHEN_Z_OFFSET;
export const KITCHEN_DOORS = {
  pantry: { center: (HALF_W + KITCHEN_INNER_X) / 2, width: 1.48 },
  kitchen: { center: KITCHEN_INNER_X + .47, width: .94 }
};
export const KITCHEN_MOVABLES = [
  { id: 'coffee-counter', nameKey: 'coffeeCounter' },
  { id: 'water-dispenser', nameKey: 'waterDispenser' },
  { id: 'kitchen-column-1', nameKey: 'kitchenColumn' },
  { id: 'kitchen-column-2', nameKey: 'kitchenColumn' },
  { id: 'kitchen-column-3', nameKey: 'kitchenColumn' },
  { id: 'pantry-rack-back', nameKey: 'pantryRack' },
  { id: 'pantry-rack-side', nameKey: 'pantryRack' },
  { id: 'pantry-cleaning-tools', nameKey: 'cleaningTools' },
  { id: 'pantry-cartons', nameKey: 'pantryCartons' },
  { id: 'dining-table-1', nameKey: 'kitchenTable' },
  { id: 'dining-table-2', nameKey: 'kitchenTable' },
  { id: 'dining-table-3', nameKey: 'kitchenTable' },
  { id: 'dining-table-4', nameKey: 'kitchenTable' },
  { id: 'window-bar', nameKey: 'windowBar' },
  { id: 'sofa-blue', nameKey: 'kitchenSofa' },
  { id: 'sofa-green', nameKey: 'kitchenSofa' },
  { id: 'sofa-yellow', nameKey: 'kitchenSofa' },
  { id: 'lounge-table', nameKey: 'loungeTable' },
  { id: 'plant-shelf', nameKey: 'plantShelf' },
  { id: 'wall-art', nameKey: 'kitchenWallArt' }
];
// Preserve the committed office doorway position.
export const ENTRY = { width: 1.25, centerX: 1.25, height: 2.2 };
export const startSeats = [
  { id: 's1', name: 'Сергей', x: -1.53, z: -1.1975, rot: 0, side: -1 },
  { id: 's2', name: 'Олег', x: 1.53, z: -1.1975, rot: 0, side: 1 },
  { id: 's3', name: 'Юра', x: -1.53, z: 1.2025, rot: 0, side: -1 },
  { id: 's4', name: 'Юля', x: 1.53, z: 1.2025, rot: 0, side: 1 },
  { id: 's5', name: 'Богдан', x: -1.53, z: 3.6025, rot: 0, side: -1 },
  { id: 's6', name: 'Никита', x: -.93, z: 3.6025, rot: 0, side: 1 },
  { id: 's7', name: 'Илья', x: .93, z: 3.6025, rot: 0, side: -1 },
  { id: 's8', name: 'Даша', x: 1.53, z: 3.6025, rot: 0, side: 1 }
].map(seat => ({ ...seat, zone: 'work' }));
export const baseState = {
  seats: startSeats, board: { x: 0, z: .45, rot: 0 }, cabinet: { x: 11.75, z: 3.0, rot: Math.PI },
  cart: { x: 1.85, z: -2.65, rot: -.18 }, boardMarks: [], language: 'ru', theme: 'light',
  kitchenObjects: {}, showWalls: true, showDimensions: false, showCollisions: false,
  showZones: false, layoutVersion: 9
};
