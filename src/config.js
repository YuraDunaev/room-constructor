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
  { id: 's1', name: 'Сергей', x: -1.6418356679830433, z: -1.7092308608887012, rot: Math.PI / 2, side: -1 },
  { id: 's2', name: 'Олег', x: 1.53, z: -1.1975, rot: 0, side: 1 },
  { id: 's3', name: 'Юра', x: -1.4999884769906744, z: 1.0153218123997292, rot: 0, side: -1 },
  { id: 's4', name: 'Юля', x: 1.53, z: 1.2025, rot: 0, side: 1 },
  { id: 's5', name: 'Богдан', x: -1.53, z: 3.6025, rot: 0, side: -1 },
  { id: 's6', name: 'Никита', x: -.93, z: 3.6025, rot: 0, side: 1 },
  { id: 's7', name: 'Илья', x: -1.6398127225172336, z: -2.3432410463139286, rot: -Math.PI / 2, side: -1 },
  { id: 's8', name: 'Даша', x: 1.53, z: 3.6025, rot: 0, side: 1 }
].map(seat => ({ ...seat, zone: 'work' }));
export const baseState = {
  seats: startSeats,
  board: { x: .0476918642933013, z: -2.1468339363100073, rot: Math.PI / 12 },
  cabinet: { x: -.512003023999215, z: -3.8575, rot: 0 },
  cart: { x: -.19109337189030517, z: 1.1010297786047212, rot: -.18 },
  boardMarks: [],
  language: 'ru',
  theme: 'dark',
  kitchenObjects: {
    'pantry-rack-back': { x: 4.12, z: .2124999999999999, rot: 0 },
    'pantry-rack-side': { x: 5.55, z: -1.2475, rot: Math.PI / 2 },
    'pantry-cleaning-tools': { x: 5.464067795716357, z: -2.9691661840134844, rot: 0 },
    'pantry-cartons': { x: 3.5561553205527563, z: -.6837609378244749, rot: 0 },
    'kitchen-column-1': { x: 8.102296300169034, z: -2.2739052785082743, rot: 0 },
    'kitchen-column-2': { x: 8.019544955273492, z: 2.4932705740286685, rot: 0 },
    'kitchen-column-3': { x: 7.998254322088818, z: 4.464613518073203, rot: 0 },
    'coffee-counter': { x: 9.903411245967625, z: -3.5027334849907197, rot: 0 },
    'water-dispenser': { x: 7.081425955507003, z: -3.9025777269603967, rot: 0 },
    'dining-table-1': { x: 7.984706964354481, z: -.3829068735016632, rot: Math.PI / 2 },
    'dining-table-2': { x: 10.411068188411232, z: -1.5201098562433741, rot: 0 },
    'dining-table-3': { x: 10.03202152465984, z: 3.535784091783255, rot: -Math.PI / 2 },
    'dining-table-4': { x: 10.374680463486708, z: 1.0093981330965733, rot: 0 },
    'window-bar': { x: 7, z: 6.0525, rot: 0 },
    'sofa-blue': { x: 3.556379688744008, z: 2.874885429190544, rot: Math.PI / 2 },
    'sofa-green': { x: 4.963691249014405, z: 1.332001912561183, rot: 0 },
    'sofa-yellow': { x: 5.099339460893011, z: 4.018770294355725, rot: -Math.PI },
    'lounge-table': { x: 4.967162441927876, z: 2.627820433400129, rot: 0 },
    'plant-shelf': { x: 11.461949543024955, z: 5.806479354536584, rot: 0 },
    'wall-art': { x: 12.39, z: .4269611520872334, rot: 0 }
  },
  showWalls: true,
  showDimensions: false,
  showCollisions: true,
  showZones: false,
  layoutVersion: 11
};
