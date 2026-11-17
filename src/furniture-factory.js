import * as THREE from 'three';

/** Creates movable office furniture and workstation equipment. */
export function createFurnitureFactory(context) {
  const {
    mat, box, cylinder, addCable, getState, getScene, getFurnitureGroup,
    getImportedModel, getMovable, seatKey, translate, HALF_W
  } = context;
  let boardRoot = null;
  let boardSurface = null;
  let boardMarkerTray = null;
  let boardDrawings = null;

  function makeChair(parent, side, seatId) {
    const chair = new THREE.Group(); chair.position.set(side * .62, 0, 0);
    chair.userData.walkInteraction = 'chair';
    chair.userData.seatId = seatId;
    chair.userData.side = side;
    const upholstery = mat(0x7d888d), metal = mat(0x555956, .52);
    // This chair sits beside the 600 × 1200 mm desk and faces inward along X.
    box(chair, .48, .13, .48, upholstery, 0, .46, 0);
    // The backrest is behind the sitter, away from the desktop; its width follows Z.
    box(chair, .09, .47, .48, upholstery, side * .2, .69, 0);
    box(chair, .47, .24, .07, upholstery, -side * .04, .53, -.25);
    box(chair, .47, .24, .07, upholstery, -side * .04, .53, .25);
    cylinder(chair, .045, .055, .36, metal, 0, .25, 0, 10);
    cylinder(chair, .22, .22, .045, metal, 0, .07, 0, 5);
    for (let index = 0; index < 5; index++) {
      const angle = index * Math.PI * 2 / 5;
      const spoke = box(chair, .25, .035, .035, metal, Math.cos(angle) * .1, .055, Math.sin(angle) * .1);
      spoke.rotation.y = -angle;
      cylinder(chair, .045, .045, .07, metal, Math.cos(angle) * .22, .035, Math.sin(angle) * .22, 8);
    }
    parent.add(chair);
  }
  function addNameLabel(parent, name) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const context = canvas.getContext('2d'); context.fillStyle = 'rgba(255,255,255,.94)';
    context.roundRect(8, 8, 496, 112, 24); context.fill();
    context.fillStyle = '#41423e'; context.font = '800 76px Arial'; context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name || '·', 256, 64, 460);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    sprite.scale.set(.76, .19, 1); sprite.position.set(0, .84, 0); parent.add(sprite);
  }
  function makeWorkstation(seat) {
    const root = new THREE.Group(); root.position.set(seat.x, 0, seat.z); root.rotation.y = seat.rot || 0;
    root.userData.moveKey = seatKey(seat.id); root.visible = !getImportedModel(); getScene().add(root);
    const desktop = mat(0xf3efe5, .4), legs = mat(0x555855, .54);
    box(root, .6, .075, 1.2, desktop, 0, .77, 0);
    for (const x of [-.26, .26]) for (const z of [-.55, .55]) box(root, .035, .74, .035, legs, x, .37, z);
    box(root, .34, .045, .1, legs, 0, .53, -.43);
    makeDeskEquipment(root, seat.side || 1);
    makeChair(root, seat.side || 1, seat.id); addNameLabel(root, seat.name);
    getMovable().set(seatKey(seat.id), { group: root, data: seat, kind: 'seat', width: 1.16, depth: 1.2, localX: (seat.side || 1) * .28, localZ: 0 });
  }
  function makeDeskEquipment(parent, side) {
    const dark = mat(0x171b1e, .4, { metalness: .28 });
    const trim = mat(0x434a4d, .34, { metalness: .42 });
    const stand = mat(0x343a3c, .42, { metalness: .38 });
    const rgbMaterials = [
      mat(0x39dcff, .25, { emissive: 0x159dff, emissiveIntensity: 1.9, metalness: .18 }),
      mat(0xd44bff, .25, { emissive: 0x932cff, emissiveIntensity: 1.8, metalness: .18 }),
      mat(0xff4c9a, .25, { emissive: 0xc21f65, emissiveIntensity: 1.8, metalness: .18 }),
      mat(0x64ffd5, .25, { emissive: 0x20c992, emissiveIntensity: 1.8, metalness: .18 })
    ];

    const monitorPositions = [
      { z: -.3, angle: -side * .12 },
      { z: .3, angle: side * .12 }
    ];
    for (const { z, angle } of monitorPositions) {
      const x = -side * .18;
      const monitor = new THREE.Group();
      monitor.position.set(x, 0, z);
      monitor.rotation.y = angle;
      parent.add(monitor);
      box(monitor, .026, .36, .6, dark, 0, 1.015, 0);
      box(monitor, .19, .016, .14, stand, 0, .823, 0);
      box(monitor, .025, .07, .025, stand, 0, .847, 0);

      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 210;
      const context = canvas.getContext('2d');
      context.fillStyle = '#101a22'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#253746'; context.fillRect(0, 0, 320, 24);
      context.fillStyle = '#93a9b3'; context.fillRect(12, 8, 40, 5);
      context.fillStyle = '#d4aa3e'; context.fillRect(0, 24, 42, 186);
      for (let row = 0; row < 10; row++) {
        context.fillStyle = ['#78b9a2', '#d6ad65', '#87a6d2'][row % 3];
        context.fillRect(58 + (row % 3) * 13, 42 + row * 14, 120 + (row % 4) * 24, 4);
      }
      context.fillStyle = '#8b9ca5'; context.fillRect(236, 54, 62, 104);
      context.fillStyle = '#354b59'; context.fillRect(244, 63, 46, 48);
      const screenTexture = new THREE.CanvasTexture(canvas);
      screenTexture.colorSpace = THREE.SRGBColorSpace;
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(.59, .332), new THREE.MeshBasicMaterial({
        map: screenTexture, side: THREE.DoubleSide, toneMapped: false
      }));
      screen.rotation.y = side * Math.PI / 2;
      screen.position.set(side * .014, 1.015, 0);
      monitor.add(screen);
      box(monitor, .012, .014, .6, trim, side * .018, .832, 0);

      // Four soft RGB strips outline the rear panel of each monitor.
      const glowX = -side * .016;
      const topGlow = rgbMaterials[(z < 0 ? 0 : 2)];
      const sideGlow = rgbMaterials[(z < 0 ? 1 : 3)];
      box(monitor, .006, .007, .58, topGlow, glowX, 1.199, 0);
      box(monitor, .006, .007, .58, sideGlow, glowX, .831, 0);
      box(monitor, .006, .35, .007, sideGlow, glowX, 1.015, -.295);
      box(monitor, .006, .35, .007, topGlow, glowX, 1.015, .295);
      box(monitor, .008, .018, .018, rgbMaterials[0], glowX, 1.015, 0);

      const cableMaterial = mat(0x222729, .88);
      addCable(parent, [
        [x - side * .028, 1.015, z],
        [x - side * .035, .87, z],
        [-side * .12, .79, z],
        [-side * .055, .57, .37]
      ], cableMaterial, .0045);
    }

    // Compact mechanical keyboard with a legible layout and raised keycaps.
    const keyboardCanvas = document.createElement('canvas');
    keyboardCanvas.width = 600; keyboardCanvas.height = 220;
    const keyboardContext = keyboardCanvas.getContext('2d');
    keyboardContext.fillStyle = '#101416'; keyboardContext.fillRect(0, 0, 600, 220);
    keyboardContext.strokeStyle = '#59646a'; keyboardContext.lineWidth = 5;
    keyboardContext.strokeRect(3, 3, 594, 214);
    const keyLabels = [
      ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
      ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
      ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
      ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
      ['Ctrl', 'Win', 'Alt', 'Space', '', '', '', '', '', '', 'Alt', 'Fn', '←', '→']
    ];
    keyLabels.forEach((row, rowIndex) => {
      row.forEach((label, column) => {
        if (!label || label === 'Space') return;
        const x = 12 + column * 41;
        const y = 12 + rowIndex * 39;
        keyboardContext.fillStyle = ['Esc', 'Tab', 'Caps', 'Shift', 'Enter', 'Ctrl', 'Fn', 'Alt', '←', '↓', '↑', '→'].includes(label)
          ? '#38464c' : '#263136';
        keyboardContext.beginPath();
        keyboardContext.roundRect(x, y, 34, 31, 5);
        keyboardContext.fill();
        keyboardContext.fillStyle = '#c9d5d8';
        keyboardContext.font = `${label.length > 2 ? 12 : 15}px Segoe UI, Arial`;
        keyboardContext.textAlign = 'center';
        keyboardContext.textBaseline = 'middle';
        keyboardContext.fillText(label, x + 17, y + 16, 31);
      });
    });
    keyboardContext.fillStyle = '#38464c';
    keyboardContext.beginPath();
    keyboardContext.roundRect(135, 168, 206, 31, 5);
    keyboardContext.fill();

    const keyboardTexture = new THREE.CanvasTexture(keyboardCanvas);
    keyboardTexture.colorSpace = THREE.SRGBColorSpace;
    const keyboard = new THREE.Group();
    keyboard.position.set(side * .055, .82, .005);
    keyboard.rotation.y = side * Math.PI / 2;
    parent.add(keyboard);
    box(keyboard, .405, .014, .145, dark, 0, 0, 0);
    const keyboardTop = new THREE.Mesh(new THREE.PlaneGeometry(.405, .145), new THREE.MeshBasicMaterial({
      map: keyboardTexture, side: THREE.DoubleSide, toneMapped: false
    }));
    keyboardTop.rotation.x = -Math.PI / 2;
    keyboardTop.position.y = .0075;
    keyboard.add(keyboardTop);

    const keyGeometry = new THREE.BoxGeometry(.018, .006, .014);
    const keyMaterial = mat(0x66757a, .34, { metalness: .12 });
    const accentKeyMaterial = mat(0xf0b92f, .3, { emissive: 0x5c3900, emissiveIntensity: .28 });
    const regularKeys = [];
    const accentKeys = [];
    for (let row = 0; row < 5; row++) {
      const count = 14;
      for (let column = 0; column < count; column++) {
        if (row === 4 && column >= 3 && column <= 9) continue;
        const x = -.165 + column * .025;
        const z = -.047 + row * .023;
        const target = row === 4 && column === 13 || row === 0 && column === 0
          ? accentKeys : regularKeys;
        target.push(new THREE.Vector3(x, .015, z));
      }
    }
    const addKeyInstances = (positions, material) => {
      const keys = new THREE.InstancedMesh(keyGeometry, material, positions.length);
      const transform = new THREE.Object3D();
      positions.forEach((position, index) => {
        transform.position.copy(position);
        transform.updateMatrix();
        keys.setMatrixAt(index, transform.matrix);
      });
      keys.instanceMatrix.needsUpdate = true;
      keyboard.add(keys);
    };
    addKeyInstances(regularKeys, keyMaterial);
    addKeyInstances(accentKeys, accentKeyMaterial);
    box(keyboard, .13, .006, .016, mat(0x657278, .35), 0, .015, .047);

    const keyboardFeet = mat(0x343a3c, .52, { metalness: .24 });
    for (const x of [-.17, .17]) {
      box(keyboard, .018, .012, .018, keyboardFeet, x, -.008, -.055);
    }

    const mousePad = mat(0x282f32, .96);
    box(parent, .205, .012, .22, mousePad, side * .065, .816, .43);
    const mouse = new THREE.Mesh(new THREE.SphereGeometry(.043, 18, 12), mat(0x202527, .34));
    mouse.scale.set(.72, .28, 1.18);
    mouse.rotation.y = side * .16;
    mouse.position.set(side * .065, .838, .43);
    parent.add(mouse);
    box(parent, .004, .003, .05, mat(0xd6b145), side * .065, .85, .414);

    // The headset sits on the left side of the desktop, aligned with the mouse.
    const headsetX = -side * .15;
    const headsetZ = .43;
    box(parent, .15, .014, .12, dark, headsetX, .816, headsetZ);
    box(parent, .018, .12, .018, stand, headsetX, .88, headsetZ);
    const headband = new THREE.Mesh(new THREE.TorusGeometry(.07, .01, 8, 28, Math.PI), dark);
    headband.rotation.y = Math.PI / 2;
    headband.position.set(headsetX, .982, headsetZ);
    parent.add(headband);
    const earPadMaterial = mat(0x899396, .82);
    for (const direction of [-1, 1]) {
      const earCup = new THREE.Group();
      earCup.position.set(headsetX, .95, headsetZ + direction * .067);
      earCup.rotation.y = direction > 0 ? Math.PI : 0;
      parent.add(earCup);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(.03, 16, 14), dark);
      ear.scale.set(.95, 1.25, .52);
      earCup.add(ear);
      box(parent, .055, .018, .018, stand, headsetX, .978, headsetZ + direction * .067);
      const earPad = new THREE.Mesh(new THREE.SphereGeometry(.024, 14, 12), earPadMaterial);
      earPad.scale.set(.9, 1.05, .38);
      earPad.position.z = .018;
      earCup.add(earPad);
      const cushionRim = new THREE.Mesh(new THREE.TorusGeometry(.016, .003, 7, 20), trim);
      cushionRim.scale.set(1, 1.22, 1);
      cushionRim.position.z = .018;
      earCup.add(cushionRim);
    }

    // The tower sits to the user's left, with its long edge parallel to the desk's short side.
    const pcCase = new THREE.Group();
    pcCase.position.set(-side * .05, 0, side * .39);
    pcCase.rotation.y = -Math.PI / 2;
    parent.add(pcCase);
    box(pcCase, .22, .43, .43, mat(0x1b1f21, .38, { metalness: .3 }), 0, .285, 0);
    box(pcCase, .008, .34, .35, mat(0x27343a, .26, { transparent: true, opacity: .68, metalness: .32 }),
      side * .115, .29, 0);
    box(pcCase, .014, .34, .012, trim, side * .122, .29, -.18);
    const motherboard = mat(0x1b342b, .72, { metalness: .08 });
    box(pcCase, .008, .3, .31, motherboard, -side * .065, .29, 0);

    // Two RGB memory modules and a finned CPU cooler are visible through the side glass.
    for (let index = 0; index < 2; index++) {
      const memoryZ = -.09 + index * .052;
      box(pcCase, .018, .125, .023, dark, side * .045, .34, memoryZ);
      box(pcCase, .006, .012, .026, rgbMaterials[index], side * .057, .405, memoryZ);
      box(pcCase, .006, .012, .026, rgbMaterials[(index + 1) % rgbMaterials.length],
        side * .057, .275, memoryZ);
    }
    box(pcCase, .065, .17, .12, dark, side * .025, .3, .105);
    for (let index = 0; index < 8; index++) {
      box(pcCase, .085, .009, .126, trim, side * .045, .235 + index * .018, .105);
    }
    const cpuFan = new THREE.Mesh(new THREE.TorusGeometry(.043, .005, 7, 28), rgbMaterials[3]);
    cpuFan.rotation.y = side * Math.PI / 2;
    cpuFan.position.set(side * .071, .3, .105);
    pcCase.add(cpuFan);
    const cpuHub = new THREE.Mesh(new THREE.SphereGeometry(.012, 10, 8), rgbMaterials[0]);
    cpuHub.position.copy(cpuFan.position);
    pcCase.add(cpuHub);

    // Triple intake fans are mounted on the outer short end, away from the glass panel.
    for (let index = 0; index < 3; index++) {
      const fan = new THREE.Mesh(new THREE.TorusGeometry(.047, .006, 8, 32), rgbMaterials[index]);
      fan.position.set(0, .18 + index * .105, .218);
      pcCase.add(fan);
      const innerRing = new THREE.Mesh(new THREE.TorusGeometry(.032, .0035, 6, 28), rgbMaterials[(index + 1) % rgbMaterials.length]);
      innerRing.position.copy(fan.position);
      pcCase.add(innerRing);
      const hub = new THREE.Mesh(new THREE.SphereGeometry(.014, 12, 10), rgbMaterials[(index + 2) % rgbMaterials.length]);
      hub.position.copy(fan.position);
      pcCase.add(hub);
      for (let blade = 0; blade < 5; blade++) {
        const angle = blade * Math.PI * 2 / 5;
        const fin = box(pcCase, .008, .025, .006, rgbMaterials[(index + 3) % rgbMaterials.length],
          Math.cos(angle) * .021, fan.position.y + Math.sin(angle) * .021, .22);
        fin.rotation.z = angle;
      }
    }

    // The monitor, keyboard and mouse leads meet a cable tray beneath the desktop.
    const cableMaterial = mat(0x202426, .9);
    const cableHub = [-side * .055, .56, .36];
    addCable(parent, [[side * .055, .827, .07], [side * .08, .79, .19], cableHub], cableMaterial, .004);
    addCable(parent, [[side * .065, .84, .43], [side * .03, .78, .43], cableHub], cableMaterial, .004);
    addCable(parent, [cableHub, [-side * .05, .35, .4], [-side * .05, .13, side * .39]], cableMaterial, .007);

    // A grounded floor cord runs from the case to the nearest wall socket.
    const wallSide = parent.position.x < 0 ? -1 : 1;
    const socketX = wallSide * (HALF_W - .035) - parent.position.x;
    const floorCable = mat(0x292b2c, .92);
    addCable(parent, [
      [-side * .05, .025, side * .39],
      [-side * .05, .015, side * .52],
      [socketX * .45, .015, side * .57],
      [socketX, .015, .4],
      [socketX, .015, .05],
      [socketX, .19, 0]
    ], floorCable, .009);
  }
  function makeBoard() {
    const board = new THREE.Group();
    board.position.set(getState().board.x, 0, getState().board.z);
    board.rotation.y = getState().board.rot || 0;
    board.userData.moveKey = 'board';
    const frame = mat(0x535b59, .34, { metalness: .32 });
    const trim = mat(0x858e8d, .38, { metalness: .46 });
    const foot = mat(0x3e4545, .48, { metalness: .38 });
    box(board, 1.2, .86, .065, frame, 0, 1.37, 0);
    boardSurface = box(board, 1.11, .77, .018, mat(0xf8f5ec, .25), 0, 1.37, .042);
    boardSurface.userData.drawSurface = true;
    box(board, 1.13, .025, .055, trim, 0, 1.775, .012);
    box(board, 1.13, .025, .055, trim, 0, .965, .012);
    box(board, .025, .82, .055, trim, -.565, 1.37, .012);
    box(board, .025, .82, .055, trim, .565, 1.37, .012);
    box(board, .07, 1.23, .07, frame, -.43, .62, 0);
    box(board, .07, 1.23, .07, frame, .43, .62, 0);
    box(board, .9, .07, .42, frame, 0, .055, 0);
    box(board, .55, .045, .07, trim, 0, .48, 0);

    // A front-facing marker tray with a raised rail and four colored dry-erase markers.
    boardMarkerTray = new THREE.Group();
    boardMarkerTray.name = 'Marker tray';
    box(boardMarkerTray, .96, .035, .16, frame, 0, .935, .105);
    box(boardMarkerTray, .96, .022, .018, trim, 0, .961, .181);
    for (let index = 0; index < 4; index++) {
      box(boardMarkerTray, .014, .01, .08, trim, -.36 + index * .24, .958, .1);
    }
    board.add(boardMarkerTray);

    const markerColors = [0x263033, 0xd9473f, 0x3678d2, 0x2e9a68];
    for (let index = 0; index < markerColors.length; index++) {
      const color = markerColors[index];
      const marker = new THREE.Group();
      marker.userData.walkInteraction = 'marker';
      marker.userData.markerColor = color;
      marker.userData.markerId = index;
      marker.position.set(-.33 + index * .22, .976, .105);
      const barrel = cylinder(marker, .012, .012, .145, mat(color, .34), 0, 0, 0, 14);
      barrel.rotation.z = Math.PI / 2;
      for (const end of [-1, 1]) {
        const cap = cylinder(marker, .013, .013, .025, mat(end < 0 ? 0x303638 : color, .34), end * .078, 0, 0, 14);
        cap.rotation.z = Math.PI / 2;
      }
      box(marker, .028, .018, .004, mat(0xf0e8d8, .62), 0, .012, .014);
      marker.userData.homePosition = marker.position.clone();
      boardMarkerTray.add(marker);
    }

    const eraser = new THREE.Group();
    eraser.name = 'Board eraser';
    eraser.userData.walkInteraction = 'eraser';
    box(eraser, .105, .055, .07, mat(0xe5e1d7, .5), 0, .028, 0);
    box(eraser, .105, .012, .07, mat(0x4c77ad, .42), 0, -.005, 0);
    eraser.position.set(.44, .978, .105);
    eraser.userData.homePosition = eraser.position.clone();
    boardMarkerTray.add(eraser);

    boardDrawings = new THREE.Group();
    boardDrawings.name = 'Board drawings';
    board.add(boardDrawings);
    (getState().boardMarks || []).forEach(mark => createBoardStrokeMesh(boardDrawings, mark.points, mark.color));

    for (const x of [-.43, .43]) {
      for (const y of [.1, 1.37, 1.76]) {
        const fastener = new THREE.Mesh(new THREE.SphereGeometry(.018, 10, 8), trim);
        fastener.position.set(x, y, .047);
        board.add(fastener);
      }
      cylinder(board, .04, .04, .08, foot, x, .1, 0, 12);
    }

    boardRoot = board;
    board.visible = !getImportedModel();
    getScene().add(board);
    getMovable().set('board', { group: board, data: getState().board, kind: 'board', width: 1.2, depth: .2, localX: 0, localZ: 0 });
  }
  function createBoardStrokeMesh(parent, points, color) {
    if (!points || points.length < 2) return null;
    const path = points.map(([x, y]) => new THREE.Vector3(x, y, .054));
    const curve = new THREE.CatmullRomCurve3(path);
    const geometry = new THREE.TubeGeometry(curve, Math.max(8, points.length * 3), .006, 5, false);
    const material = new THREE.MeshBasicMaterial({ color: color ?? 0x263033, depthTest: false, toneMapped: false });
    const stroke = new THREE.Mesh(geometry, material);
    stroke.renderOrder = 5;
    parent.add(stroke);
    return stroke;
  }
  function makeCabinet() {
    const cabinet = new THREE.Group();
    cabinet.position.set(getState().cabinet.x, 0, getState().cabinet.z);
    cabinet.rotation.y = getState().cabinet.rot;
    cabinet.userData.moveKey = 'cabinet';
    const body = mat(0x555653, .62);
    const doors = mat(0x77766f, .58);
    const trim = mat(0x96948d, .46, { metalness: .2 });
    const vent = mat(0x353a3b, .82);
    box(cabinet, .72, 1.72, .64, body, 0, .89, 0);
    box(cabinet, .76, .09, .68, mat(0x353a3b, .62), 0, .075, 0);
    box(cabinet, .76, .06, .68, trim, 0, 1.77, 0);

    // Two full-height wardrobe doors with recessed panels and central handles.
    for (const side of [-1, 1]) {
      const centerX = side * .18;
      box(cabinet, .351, 1.55, .022, doors, centerX, .91, .331);
      box(cabinet, .009, 1.43, .009, trim, centerX - side * .156, .91, .346);
      box(cabinet, .009, 1.43, .009, trim, centerX + side * .156, .91, .346);
      box(cabinet, .32, .009, .009, trim, centerX, .194, .346);
      box(cabinet, .32, .009, .009, trim, centerX, 1.626, .346);

      cylinder(cabinet, .012, .012, .24, trim, side * .035, .91, .365, 12);
      cylinder(cabinet, .018, .018, .018, mat(0xb7b9b2, .36, { metalness: .42 }),
        side * .035, .91, .365, 12);
      box(cabinet, .032, .038, .008, vent, centerX + side * .115, 1.565, .347);
      box(cabinet, .012, .018, .01, mat(0xc7b46d, .4, { metalness: .25 }),
        centerX + side * .035, .91, .354);
    }

    // Small ventilation slots above the doors and four adjustable feet below the plinth.
    for (let index = 0; index < 8; index++) {
      box(cabinet, .035, .008, .008, vent, -.14 + index * .04, 1.69, .328);
    }
    const feet = mat(0x25292a, .5, { metalness: .28 });
    for (const x of [-.29, .29]) for (const z of [-.25, .25]) {
      cylinder(cabinet, .025, .025, .045, feet, x, .0225, z, 10);
    }

    getFurnitureGroup().add(cabinet);
    getMovable().set('cabinet', { group: cabinet, data: getState().cabinet, kind: 'cabinet', width: .76, depth: .68, localX: 0, localZ: 0 });
  }
  function makeCart() {
    const cart = new THREE.Group();
    cart.name = translate('cart');
    cart.position.set(getState().cart.x, 0, getState().cart.z);
    cart.rotation.y = getState().cart.rot || 0;
    cart.userData.moveKey = 'cart';
    cart.visible = !getImportedModel();

    const frame = mat(0xb5d62b, .42, { metalness: .22 });
    const darkFrame = mat(0x252a2c, .54, { metalness: .36 });
    const deck = mat(0x202426, .5, { metalness: .32 });
    const redEdge = mat(0xc74d3d, .36, { metalness: .22 });
    const glass = mat(0x28363b, .22, { transparent: true, opacity: .52, metalness: .24 });

    box(cart, .72, .075, .92, deck, 0, .29, 0);
    box(cart, .72, .018, .035, redEdge, 0, .33, .455);
    box(cart, .72, .018, .035, redEdge, 0, .33, -.455);
    box(cart, .025, .025, .82, redEdge, -.35, .33, 0);
    box(cart, .025, .025, .82, redEdge, .35, .33, 0);

    for (const x of [-.28, .28]) for (const z of [-.34, .34]) {
      box(cart, .045, .055, .045, darkFrame, x, .22, z);
      const wheel = cylinder(cart, .069, .069, .052, darkFrame, x, .105, z, 20);
      wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(cart, .028, .028, .056, mat(0x858a88, .38, { metalness: .62 }), x, .105, z, 16);
      hub.rotation.z = Math.PI / 2;
    }

    // Continuous tubular U-handle from the axle deck to the padded grip.
    const handlePath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.29, .31, -.36), new THREE.Vector3(-.29, .75, -.36),
      new THREE.Vector3(-.29, 1.12, -.36), new THREE.Vector3(-.24, 1.2, -.36),
      new THREE.Vector3(0, 1.22, -.36), new THREE.Vector3(.24, 1.2, -.36),
      new THREE.Vector3(.29, 1.12, -.36), new THREE.Vector3(.29, .75, -.36),
      new THREE.Vector3(.29, .31, -.36)
    ]);
    const handle = new THREE.Mesh(new THREE.TubeGeometry(handlePath, 40, .022, 10, false), frame);
    handle.castShadow = true; cart.add(handle);

    // Compact tower secured to the platform; its glass side and fans face outward.
    box(cart, .43, .66, .62, darkFrame, 0, .7, .025);
    box(cart, .008, .54, .48, glass, .22, .7, .025);
    box(cart, .01, .54, .012, frame, .228, .7, -.22);
    for (let index = 0; index < 3; index++) {
      const fan = new THREE.Mesh(new THREE.TorusGeometry(.083, .008, 8, 28), mat(0x54b69a, .3, {
        emissive: 0x16745c, emissiveIntensity: .86, metalness: .24
      }));
      fan.rotation.y = Math.PI / 2;
      fan.position.set(.231, .53 + index * .16, .02);
      cart.add(fan);
      const fanHub = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 10), mat(0xb1ead8, .28, {
        emissive: 0x46ad8b, emissiveIntensity: .8
      }));
      fanHub.position.copy(fan.position);
      cart.add(fanHub);
    }
    // Rack servers face the aisle, with individual drive bays, vents, handles and status LEDs.
    const rackRail = mat(0x697176, .38, { metalness: .52 });
    const vent = mat(0x111719, .82);
    const drive = mat(0x32393c, .46, { metalness: .32 });
    for (const x of [-.19, .19]) {
      box(cart, .018, .58, .022, rackRail, x, .7, .347);
      for (let index = 0; index < 4; index++) {
        box(cart, .012, .024, .01, mat(0x969c9e, .42, { metalness: .4 }),
          x, .45 + index * .16, .362);
      }
    }
    const driveLight = mat(0x70d49f, .24, { emissive: 0x287c54, emissiveIntensity: 1.15 });
    const driveActivity = mat(0xf1bd43, .24, { emissive: 0xa16b16, emissiveIntensity: .85 });
    for (let index = 0; index < 4; index++) {
      const y = .455 + index * .15;
      box(cart, .36, .12, .028, drive, 0, y, .34);
      box(cart, .018, .075, .008, rackRail, -.17, y, .359);
      box(cart, .018, .075, .008, rackRail, .17, y, .359);
      box(cart, .095, .065, .009, vent, -.085, y, .36);
      for (let slit = 0; slit < 5; slit++) {
        box(cart, .004, .052, .004, rackRail, -.12 + slit * .017, y, .366);
      }
      box(cart, .09, .048, .012, mat(0x202628, .44), .07, y, .361);
      box(cart, .045, .025, .008, rackRail, .07, y, .37);
      for (let led = 0; led < 2; led++) {
        box(cart, .012, .012, .006, led ? driveActivity : driveLight,
          .139 + led * .021, y, .37);
      }
    }
    box(cart, .42, .018, .025, rackRail, 0, 1.035, .34);
    box(cart, .42, .018, .025, rackRail, 0, .365, .34);
    const statusLight = mat(0x8cd2ab, .25, { emissive: 0x33865d, emissiveIntensity: 1.1 });
    box(cart, .012, .018, .012, statusLight, .224, .98, .25);

    // A loose headset and a short cable coil sit on the tower's top panel.
    const cable = new THREE.Mesh(new THREE.TorusGeometry(.075, .006, 6, 36, Math.PI * 1.7), mat(0x87c94a, .4));
    cable.rotation.x = -Math.PI / 2;
    cable.position.set(-.075, 1.04, .04);
    cart.add(cable);
    const headsetBand = new THREE.Mesh(new THREE.TorusGeometry(.075, .012, 8, 28, Math.PI), darkFrame);
    headsetBand.rotation.y = Math.PI / 2;
    headsetBand.position.set(.055, 1.055, .08);
    cart.add(headsetBand);
    for (const direction of [-1, 1]) {
      const cup = new THREE.Mesh(new THREE.SphereGeometry(.031, 14, 12), darkFrame);
      cup.scale.set(.52, 1.15, 1);
      cup.position.set(.055, 1.005, .08 + direction * .071);
      cart.add(cup);
    }

    // The cart and server assembly reaches approximately 1.8 m, matching the real unit.
    cart.scale.y = 1.475;
    getScene().add(cart);
    getMovable().set('cart', { group: cart, data: getState().cart, kind: 'cart', width: .72, depth: .92, localX: 0, localZ: 0 });
  }



  return {
    makeWorkstation,
    makeBoard,
    makeCabinet,
    makeCart,
    createBoardStrokeMesh,
    getBoardRoot: () => boardRoot,
    getBoardSurface: () => boardSurface,
    getBoardMarkerTray: () => boardMarkerTray,
    getBoardDrawings: () => boardDrawings
  };
}
