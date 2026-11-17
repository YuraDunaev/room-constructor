import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { parseLocalModel } from './model-importer.js';
import { createGeometryTools } from './geometry-tools.js';
import { createFurnitureFactory } from './furniture-factory.js';
import { createKeyboardShortcutHandler } from './keyboard-shortcuts.js';
import './style.css';
import { createKitchenBuilder } from './kitchen.js';
import { dictionaries } from './i18n.js';
import {
  ROOM, HALF_W, HALF_L, KITCHEN, KITCHEN_INNER_X, KITCHEN_RIGHT, KITCHEN_DOORS,
  KITCHEN_MOVABLES, KITCHEN_Z_OFFSET,
  SITE_CENTER_X, SITE_CENTER_Z, KITCHEN_WORLD_LEFT,
  KITCHEN_WORLD_TOP, ENTRY, startSeats, baseState
} from './config.js';

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('room-layout') || '{}');
    let savedSeats;
    if ([6, 7, 8, 9].includes(saved.layoutVersion) && Array.isArray(saved.seats)) {
      savedSeats = saved.seats;
    } else if (saved.layoutVersion === 5 && Array.isArray(saved.seats)) {
      savedSeats = saved.seats.map(seat => {
        const correctedSeat = startSeats.find(item => item.id === seat.id);
        return ['s2', 's4'].includes(seat.id) && correctedSeat
          ? { ...seat, x: correctedSeat.x, z: correctedSeat.z, side: correctedSeat.side }
          : seat;
      });
    } else {
      savedSeats = startSeats.map((seat, index) => ({
        ...seat,
        name: saved.seats?.[index]?.name || seat.name
      }));
    }
    const seats = savedSeats.map(seat => seat.name === 'Новый БИМщик' ? { ...seat, name: 'Олег' } : seat);
    if (seats.some((seat, index) => seat.name !== savedSeats[index].name)) {
      try {
        localStorage.setItem('room-layout', JSON.stringify({ ...saved, seats, layoutVersion: 9 }));
      } catch { /* Keep the migrated name in memory when storage is unavailable. */ }
    }
    if (saved.layoutVersion !== 9) {
      try {
        const cabinet = saved.layoutVersion >= 8
          ? saved.cabinet || baseState.cabinet
          : baseState.cabinet;
        localStorage.setItem('room-layout', JSON.stringify({
          ...baseState,
          ...saved,
          seats,
          cabinet,
          kitchenObjects: saved.layoutVersion === 9 ? saved.kitchenObjects || {} : {},
          layoutVersion: 9
        }));
      } catch { /* Keep the migrated layout in memory when storage is unavailable. */ }
    }
    const cabinet = saved.layoutVersion >= 8
      ? saved.cabinet || baseState.cabinet
      : baseState.cabinet;
    return {
      ...baseState,
      ...saved,
      seats,
      cabinet,
      kitchenObjects: saved.layoutVersion === 9 ? saved.kitchenObjects || {} : {},
      layoutVersion: 9
    };
  } catch { return structuredClone(baseState); }
}
let state = loadState();
const undoHistory = [];
const redoHistory = [];
const historyLimit = 100;
const serializeLayout = () => JSON.stringify({
  seats: state.seats,
  board: state.board,
  cabinet: state.cabinet,
  cart: state.cart,
  kitchenObjects: state.kitchenObjects || {},
  boardMarks: state.boardMarks || []
});
let lastLayoutSnapshot = serializeLayout();
let selectedKey = null;
let scene, camera, renderer, controls, pointerControls, raycaster, pointer, roomGroup;
let wallGroup, windowGroup, columnGroup, furnitureGroup, zoneGroup, collisionGroup, dimensionGroup;
let dragging = null;
let renderAfterPointer = false;
let hoveredKey = null;
let importedModel = null;
let importedModelUrls = [];
let importedModelName = '';
let blackHoleDisk;
let walkingMode = false;
let walkCeiling;
let kitchenCeiling;
let kitchenGroup;
const walkKeys = new Set();
const walkDirection = new THREE.Vector3();
let walkPreviousTime = 0;
let boardRoot;
let boardSurface;
let boardMarkerTray;
let boardDrawings;
let walkHeld = null;
let seatedAt = null;
let currentBoardStroke = null;
let currentBoardErase = false;
let boardEraseChanged = false;
let walkTouchLook = null;
let walkJoystickPointerId = null;
let mobileDrawHeld = false;
let hoverMaterialBackups = [];
let cameraMoveFrame = 0;
let targetCameraQuaternion = null;
const movable = new Map();
const obstacles = [];
const walkDoors = [];
const app = document.querySelector('#app');
const t = key => dictionaries[state.language][key];
const saveState = () => {
  const nextLayoutSnapshot = serializeLayout();
  if (nextLayoutSnapshot !== lastLayoutSnapshot) {
    undoHistory.push(lastLayoutSnapshot);
    if (undoHistory.length > historyLimit) undoHistory.shift();
    redoHistory.length = 0;
    lastLayoutSnapshot = nextLayoutSnapshot;
  }
  const persistentState = { ...state };
  delete persistentState.settingsOpen;
  localStorage.setItem('room-layout', JSON.stringify(persistentState));
};
const seatKey = id => `seat:${id}`;
const { mat, box, cylinder, addCable, addLine, disposeObject } = createGeometryTools();
const furnitureFactory = createFurnitureFactory({
  mat, box, cylinder, addCable,
  getState: () => state,
  getScene: () => scene,
  getFurnitureGroup: () => furnitureGroup,
  getImportedModel: () => importedModel,
  getMovable: () => movable,
  seatKey,
  translate: key => t(key),
  HALF_W
});


function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}
function getSeat() { return selectedKey?.startsWith('seat:') ? state.seats.find(seat => seat.id === selectedKey.slice(5)) : null; }
function getSelected() {
  if (selectedKey === 'board') return state.board;
  if (selectedKey === 'cabinet') return state.cabinet;
  if (selectedKey === 'cart') return state.cart;
  if (selectedKey?.startsWith('kitchen:')) {
    return state.kitchenObjects?.[selectedKey.slice('kitchen:'.length)] || null;
  }
  return getSeat();
}
function selectedAngle() {
  const angle = THREE.MathUtils.radToDeg(getSelected()?.rot || 0);
  const nearestInteger = Math.round(angle);
  return Math.abs(angle - nearestInteger) < .005 ? nearestInteger : Number(angle.toFixed(2));
}
function checkbox(id, label, checked) {
  return `<label class="check-control"><input id="${id}" type="checkbox" ${checked ? 'checked' : ''}><span class="switch"></span><span>${label}</span></label>`;
}
function renderSettings() {
  if (!state.settingsOpen) return '';
  return `<div class="modal-backdrop" id="settingsBackdrop"><section class="settings-dialog" role="dialog" aria-modal="true">
    <div class="dialog-head"><div><small>ROOMPLAN</small><h2>${t('settingsTitle')}</h2></div><button id="closeSettings" class="close-button">×</button></div>
    <div class="setting-block"><label>${t('appearance')}</label><div class="segmented">
      <button data-theme="light" class="${state.theme === 'light' ? 'active' : ''}"><i class="swatch light-swatch"></i>${t('light')}</button>
      <button data-theme="dark" class="${state.theme === 'dark' ? 'active' : ''}"><i class="swatch dark-swatch"></i>${t('dark')}</button>
    </div></div>
    <div class="setting-block"><label>${t('language')}</label><div class="segmented">
      <button data-language="ru" class="${state.language === 'ru' ? 'active' : ''}">${t('russian')}</button>
      <button data-language="en" class="${state.language === 'en' ? 'active' : ''}">${t('english')}</button>
    </div></div>
    <div class="setting-block hotkey-block"><label>${t('hotkeys')}</label>
      <div class="hotkey-list">
        <p><kbd>← ↑ → ↓</kbd><span>${t('hotkeyCamera')}</span></p>
        <p><kbd>Ctrl + ← / →</kbd><span>${t('hotkeyRotate')}</span></p>
        <p><kbd>Shift + ← ↑ → ↓</kbd><span>${t('hotkeyMove')}</span></p>
        <p><kbd>Delete</kbd><span>${t('hotkeyDelete')}</span></p>
        <p><kbd>+ / −</kbd><span>${t('hotkeyZoom')}</span></p>
        <p><kbd>Home</kbd><span>${t('hotkeyHome')}</span></p>
        <p><kbd>Ctrl + S</kbd><span>${t('hotkeySave')}</span></p>
        <p><kbd>Ctrl + Z</kbd><span>${t('hotkeyUndo')}</span></p>
        <p><kbd>Ctrl + Y</kbd><span>${t('hotkeyRedo')}</span></p>
        <p><kbd>Esc</kbd><span>${t('hotkeyEscape')}</span></p>
        <p><kbd>W A S D + mouse</kbd><span>${t('hotkeyWalk')}</span></p>
      </div>
    </div>
    <div class="dialog-foot"><span>${t('local')}</span><button id="settingsDone" class="tool-button primary-button">${t('close')}</button></div>
  </section></div>`;
}
function renderProperties() {
  const seat = getSeat();
  if (seat) return `<section class="object-properties">
    <div class="selected-card">
      <span class="object-avatar">▱</span>
      <div>
        <b>${escapeHtml(seat.name || t('empty'))}</b>
        <small>${t('seats').toUpperCase()} · ${String(state.seats.indexOf(seat) + 1).padStart(2, '0')}</small>
      </div>
    </div>
    <label class="field-label" for="objectName">${t('employee')}</label>
    <input class="text-input" id="objectName" value="${escapeHtml(seat.name)}" placeholder="${t('placeholder')}">
    <div class="section-label">${t('location')}</div>
    <div class="coordinates">
      <label>${t('x')}<input id="coordX" type="number" step="0.05" value="${seat.x.toFixed(2)}"></label>
      <label>${t('z')}<input id="coordZ" type="number" step="0.05" value="${seat.z.toFixed(2)}"></label>
    </div>
    <div class="property-row table-size"><span>${t('tableDims')}</span><b>0.60 × 1.20 ${t('m')}</b></div>
    <button id="deleteSeat" class="danger-button">⌫　${t('remove')}</button>
  </section>`;
  if (selectedKey === 'board') return `<section class="object-properties">
    <div class="selected-card">
      <span class="object-avatar board-avatar">▭</span>
      <div><b>${t('board')}</b><small>${t('movable')}</small></div>
    </div>
    <div class="section-label">${t('location')}</div>
    <div class="coordinates">
      <label>${t('x')}<input id="coordX" type="number" step="0.05" value="${state.board.x.toFixed(2)}"></label>
      <label>${t('z')}<input id="coordZ" type="number" step="0.05" value="${state.board.z.toFixed(2)}"></label>
    </div><div class="property-row"><span>${t('objectDims')}</span><b>1.20 × 0.20 ${t('m')}</b></div>
  </section>`;
  if (selectedKey === 'cabinet') return `<section class="object-properties">
    <div class="selected-card"><span class="object-avatar">▰</span>
      <div><b>${t('cabinet')}</b><small>${t('movable')}</small></div>
    </div>
    <div class="section-label">${t('location')}</div>
    <div class="coordinates">
      <label>${t('x')}<input id="coordX" type="number" step="0.05" value="${state.cabinet.x.toFixed(2)}"></label>
      <label>${t('z')}<input id="coordZ" type="number" step="0.05" value="${state.cabinet.z.toFixed(2)}"></label>
    </div><div class="property-row"><span>${t('objectDims')}</span><b>0.76 × 0.68 ${t('m')}</b></div>
  </section>`;
  if (selectedKey === 'cart') return `<section class="object-properties">
    <div class="selected-card"><span class="object-avatar">▰</span>
      <div><b>${t('cart')}</b><small>${t('movable')}</small></div>
    </div>
    <div class="section-label">${t('location')}</div>
    <div class="coordinates">
      <label>${t('x')}<input id="coordX" type="number" step="0.05" value="${state.cart.x.toFixed(2)}"></label>
      <label>${t('z')}<input id="coordZ" type="number" step="0.05" value="${state.cart.z.toFixed(2)}"></label>
    </div><div class="property-row"><span>${t('objectDims')}</span><b>0.72 × 0.92 ${t('m')}</b></div>
  </section>`;
  if (selectedKey?.startsWith('kitchen:')) {
    const item = movable.get(selectedKey);
    const label = kitchenMovableLabel(item);
    return `<section class="object-properties">
      <div class="selected-card"><span class="object-avatar">▰</span>
        <div><b>${escapeHtml(label)}</b><small>${t('movable')}</small></div>
      </div>
      <div class="section-label">${t('location')}</div>
      <div class="coordinates">
        <label>${t('x')}<input id="coordX" type="number" step="0.05" value="${item.data.x.toFixed(2)}"></label>
        <label>${t('z')}<input id="coordZ" type="number" step="0.05" value="${item.data.z.toFixed(2)}"></label>
      </div>
      <div class="property-row"><span>${t('objectDims')}</span>
        <b>${item.width.toFixed(2)} × ${item.depth.toFixed(2)} ${t('m')}</b></div>
    </section>`;
  }
  if (selectedKey === 'kitchen') {
    const kitchenArea = (KITCHEN.width * KITCHEN.length - KITCHEN.notchWidth * KITCHEN.pantryLength).toFixed(1);
    const pantryArea = (KITCHEN.notchWidth * KITCHEN.pantryLength).toFixed(1);
    const note = state.language === 'ru'
      ? `Г-образная площадь кухни ≈ ${kitchenArea} м², подсобка ≈ ${pantryArea} м². Размеры предварительные; обновите параметры KITCHEN после замеров.`
      : `L-shaped kitchen area ≈ ${kitchenArea} m², utility room ≈ ${pantryArea} m². Estimated; update KITCHEN after measuring.`;
    return `<div class="static-note">⌑<p>${note}</p></div>`;
  }
  if (['walls', 'windows', 'columns'].includes(selectedKey)) {
    const note = state.language === 'ru' ? 'Элемент помещения фиксирован.' : 'This room element is fixed in place.';
    return `<div class="static-note">⌑<p>${note}</p></div>`;
  }
  return `<div class="empty-selection"><b>⌖</b><span>${t('none')}</span></div>`;
}
function renderTree() {
  const seatItems = state.seats.map((seat, index) => treeItem(
    seatKey(seat.id), '▱', seat.name || t('empty'), String(index + 1).padStart(2, '0')
  )).join('');
  const kitchenItems = KITCHEN_MOVABLES.map(item => treeItem(
    `kitchen:${item.id}`,
    '▰',
    kitchenMovableLabel({ ...item, id: item.id })
  )).join('');
  return `<details open>
    <summary><i>⌄</i>▣　${t('room')}</summary>
    <details open class="tree-nested">
      <summary><i>⌄</i>◫　${t('shell')}</summary>
      ${treeItem('walls', '▤', t('walls'))}
      ${treeItem('windows', '▦', t('windows'))}
      ${treeItem('columns', '▰', t('columns'), '2')}
      ${treeItem('kitchen', '◫', t('kitchen'))}
      <details open class="tree-nested">
        <summary><i>⌄</i>▦　${t('kitchenFurniture')}<small>${KITCHEN_MOVABLES.length}</small></summary>
        ${kitchenItems}
      </details>
    </details>
    <details open class="tree-nested">
      <summary><i>⌄</i>▦　${t('furniture')}<small>${state.seats.length + 3}</small></summary>
      ${treeItem('board', '▭', t('board'))}${seatItems}${treeItem('cabinet', '▰', t('cabinet'))}${treeItem('cart', '▰', t('cart'))}
    </details>
  </details>`;
}
function treeItem(key, icon, label, badge = '') {
  return `<button class="tree-item ${selectedKey === key ? 'selected' : ''}" data-select="${key}">
    <i>${icon}</i><span>${escapeHtml(label)}</span>${badge ? `<small>${badge}</small>` : ''}
  </button>`;
}
function kitchenMovableLabel(item) {
  const label = t(item.nameKey);
  const tableNumber = item.id?.match(/^dining-table-(\d+)$/)?.[1];
  return tableNumber ? `${label} ${tableNumber}` : label;
}
function render() {
  document.documentElement.lang = state.language;
  document.body.dataset.theme = state.theme;
  const selected = getSelected();
  const selectedKitchenItem = movable.get(selectedKey);
  const selectedKitchenLabel = selectedKitchenItem?.kind === 'kitchen'
    ? kitchenMovableLabel(selectedKitchenItem)
    : null;
  app.innerHTML = `<header class="topbar">
    <div class="brand">
      <div class="brand-mark">R<span>·</span></div>
      <div><b>room<span>plan</span></b><small>${t('project')}</small></div>
    </div>
    <div class="breadcrumb"><span>${t('project')}</span><i>/</i><b>${t('office')}</b></div>
    <div class="top-actions">
      <span class="local-label"><i></i>${t('local')}</span>
      <button class="tool-button" id="openSettings">⚙　${t('settings')}</button>
      <button class="tool-button" id="resetPlan">↺　${t('reset')}</button>
      <button class="tool-button primary-button" id="savePlan">✓　${t('save')}</button>
    </div>
  </header>
  <section class="command-bar">
    <span class="command-title">${t('toolbar')}</span>
    <button class="tool-button primary-button add-button" id="addSeat">＋　${t('add')}</button>
    <button class="tool-button" id="openModel">⇧　${t('openModel')}</button>
    <input id="modelFile" type="file" multiple accept=".glb,.gltf,.obj,.stl,model/gltf-binary,model/gltf+json,model/obj,model/stl" hidden>
    ${importedModelName ? `<span class="imported-file-name" title="${escapeHtml(importedModelName)}">${escapeHtml(importedModelName)}<button id="removeModel" aria-label="${t('removeModel')}" title="${t('removeModel')}">×</button></span>` : ''}
    <i class="separator"></i>
    <div class="command-group">
      <span>${t('view')}</span>
      <button data-view="top">⌖ ${t('top')}</button>
      <button data-view="front">▤ ${t('front')}</button>
      <button data-view="orbit" class="active">◈ ${t('orbit')}</button>
      <button id="walkMode" class="tool-button walk-button" title="${t('walk')}" aria-label="${t('walk')}" aria-pressed="${walkingMode}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="2.3"/><path d="M11.4 8.1 8.2 12l2.6 2.2-.8 5.3m1.5-10.9 3.6 2.7 2.7.1m-7.1 1.3 3.3 2.8 1.4 4.8m-5.9-7.1-3.3 4.8m5.4-10.5-3.1.9-2.1 2.6"/></svg>
        <span>${t('walk')}</span>
      </button>
    </div>
    <i class="separator"></i>
    <div class="command-group rotate-group">
      <span>${t('rotate')}</span>
      <button id="rotateLeft" title="${t('rotateLeft')}" ${selected ? '' : 'disabled'}>↶</button>
      <input id="angle" type="number" step="15" value="${selectedAngle()}" aria-label="${t('rotate')}">
      <b>°</b><button id="rotateRight" title="${t('rotateRight')}" ${selected ? '' : 'disabled'}>↷</button>
    </div>
    <i class="separator"></i>
    <div class="toggles">
      ${checkbox('showWalls', t('wallsToggle'), state.showWalls)}
      ${checkbox('showDimensions', t('dimensions'), state.showDimensions)}
      ${checkbox('showCollisions', t('collisions'), state.showCollisions)}
      ${checkbox('showZones', t('zones'), state.showZones)}
    </div>
    <div class="toolbar-spacer"></div>
    <div class="room-chip">↔　${ROOM.width.toFixed(2)} × ${ROOM.length.toFixed(3)} ${t('m')}</div>
  </section>
  <div class="editor-layout">
    <aside class="project-sidebar">
      <div class="sidebar-title"><b>${t('office')}</b><span>•••</span></div>
      <div class="tree-heading">${t('hierarchy')}</div>
      <nav class="project-tree">${renderTree()}</nav>
      <div class="sidebar-footer"><i></i>${state.seats.length} ${t('desks')}</div>
    </aside>
    <button class="sidebar-resizer" aria-label="Resize project tree" title="Drag to resize"></button>
    <main class="viewport"><div id="scene" class="scene-host"></div>
      <div class="scene-title"><i></i><div><b>${t('room')}</b>
        <small>${ROOM.width.toFixed(2)} × ${ROOM.length.toFixed(3)} ${t('m')}</small>
      </div></div>
      <div class="scene-hint">${t('sceneKeys')}</div>
      <div class="walk-hint" id="walkHint">${t('walkHint')}</div>
      <div class="walk-reticle" aria-hidden="true"></div>
      <div class="walk-mobile-controls" id="walkMobileControls" aria-label="${escapeHtml(t('walk'))}">
        <div class="walk-joystick" id="walkJoystick" role="application" aria-label="${escapeHtml(t('walk'))}">
          <span class="walk-joystick-thumb"></span>
        </div>
        <div class="walk-mobile-actions">
          <button type="button" id="walkInteract" aria-label="${escapeHtml(t('walkInteract'))}" title="${escapeHtml(t('walkInteract'))}">E</button>
          <button type="button" id="walkDraw" aria-label="${escapeHtml(t('walkDraw'))}" title="${escapeHtml(t('walkDraw'))}">✎</button>
          <button type="button" id="walkRotate" aria-label="${escapeHtml(t('walkRotate'))}" title="${escapeHtml(t('walkRotate'))}">↻</button>
        </div>
      </div>
      <div class="zoom-controls">
        <button id="zoomIn">＋</button><button id="zoomOut">−</button><button id="homeView">⌂</button>
      </div>
      ${compass()}
    </main>
    <aside class="properties">
      <div class="properties-heading">
        <div><small>${t('properties')}</small>
          <h2>${selectedKitchenLabel ? escapeHtml(selectedKitchenLabel) : selectedKey === 'board' ? t('board') : selectedKey === 'cabinet' ? t('cabinet') : selectedKey === 'cart' ? t('cart') : selectedKey === 'kitchen' ? t('kitchen') : selected ? escapeHtml(selected.name || t('empty')) : t('selection')}</h2>
        </div>
        <span>${selectedKey === 'board' ? '▭' : selectedKey === 'cabinet' || selectedKey === 'cart' ? '▰' : selectedKey === 'kitchen' ? '◫' : selected ? '▱' : '⌖'}</span>
      </div>
      ${renderProperties()}
      <div class="panel-divider"></div>
      <div class="section-label">${t('roomDims')}</div>
      <div class="property-row"><span>${t('room')}</span>
        <b>${ROOM.width.toFixed(2)} × ${ROOM.length.toFixed(3)} ${t('m')}</b>
      </div>
      <div class="property-row"><span>${t('area')}</span><b>${(ROOM.width * ROOM.length).toFixed(1)} ${t('sqm')}</b></div>
      <div class="property-row"><span>${t('desks')}</span><b>${state.seats.length}</b></div>
      <div class="mini-plan-card">
        <b>${t('office')} <span>↗</span></b>
        <div class="mini-plan-frame"><div class="mini-plan">
          <i class="mini-window"></i><i class="mini-door"></i>${miniObstacleMarks()}${miniObjectMarks()}${miniSeatMarks()}
        </div></div>
      </div>
    </aside>
  </div>
  ${renderSettings()}`;
  bindUi();
  initScene();
}
function compass() {
  const faces = [
    ['top', 'face-top', 'TOP'], ['bottom', 'face-bottom', 'BOTTOM'],
    ['north', 'face-north', 'NORTH'], ['south', 'face-south', 'SOUTH'],
    ['west', 'face-west', 'WEST'], ['east', 'face-east', 'EAST']
  ];
  const corners = [];
  for (const vertical of ['top', 'bottom']) {
    for (const northSouth of ['north', 'south']) {
      for (const eastWest of ['west', 'east']) {
        corners.push(`<button class="cube-corner corner-${vertical}-${northSouth}-${eastWest}" data-compass="corner-${vertical}-${northSouth}-${eastWest}" aria-label="${vertical} ${northSouth} ${eastWest}"></button>`);
      }
    }
  }
  return `<div class="view-compass" aria-label="View cube">
    <div class="cube-stage"><div class="cube-orientation"><div class="view-cube">
      ${faces.map(([view, className, label]) => `<button class="cube-face ${className}" data-compass="${view}">${label}</button>`).join('')}
    </div>${corners.join('')}</div></div>
    <button class="compass-wcs" data-compass="orbit">${t('compassWcs')}⌄</button>
  </div>`;
}
function miniSeatMarks() {
  return state.seats.map(seat => {
    const key = seatKey(seat.id);
    const angle = seat.rot || 0;
    const centerX = seat.x + Math.cos(angle) * (seat.side || 1) * .28;
    const centerZ = seat.z - Math.sin(angle) * (seat.side || 1) * .28;
    const left = (centerX + HALF_W) / ROOM.width * 100;
    const top = (centerZ + HALF_L) / ROOM.length * 100;
    return `<i class="mini-desk ${selectedKey === key ? 'active' : ''}" title="${escapeHtml(seat.name || t('empty'))}" style="left:${left}%;top:${top}%;--rot:${-angle}rad;--w:${1.16 / ROOM.width * 100}%;--h:${1.2 / ROOM.length * 100}%"></i>`;
  }).join('');
}
function miniObstacleMarks() {
  return [[-.12, -2.75], [-.18, 2.18]].map(([x, z]) => {
    const left = (x + HALF_W) / ROOM.width * 100;
    const top = (z + HALF_L) / ROOM.length * 100;
    return `<i class="mini-column" style="left:${left}%;top:${top}%"></i>`;
  }).join('');
}
function miniObjectMarks() {
  const objects = [
    { key: 'board', data: state.board, width: 1.2, depth: .2, className: 'mini-board' },
    { key: 'cabinet', data: state.cabinet, width: .76, depth: .68, className: 'mini-cabinet' },
    { key: 'cart', data: state.cart, width: .72, depth: .92, className: 'mini-cart' }
  ];
  return objects.map(({ key, data, width, depth, className }) => {
    const left = (data.x + HALF_W) / ROOM.width * 100;
    const top = (data.z + HALF_L) / ROOM.length * 100;
    const active = selectedKey === key ? 'active' : '';
    const title = key.startsWith('seat:') ? state.seats.find(seat => seatKey(seat.id) === key)?.name
      : key === 'cabinet' ? t('cabinet') : key === 'cart' ? t('cart') : t('board');
    return `<i class="${className} ${active}" title="${escapeHtml(title || '')}" style="left:${left}%;top:${top}%;--rot:${-(data.rot || 0)}rad;--w:${width / ROOM.width * 100}%;--h:${depth / ROOM.length * 100}%"></i>`;
  }).join('');
}
function bindUi() {
  app.querySelector('#openSettings').onclick = () => { state.settingsOpen = true; render(); };
  app.querySelector('#openModel').onclick = () => app.querySelector('#modelFile').click();
  app.querySelector('#modelFile').onchange = event => {
    const file = event.target.files?.[0];
    if (file) loadLocalModel(file, [...event.target.files]);
    event.target.value = '';
  };
  app.querySelector('#removeModel')?.addEventListener('click', closeLocalModel);
  app.querySelector('#addSeat').onclick = () => {
    const id = `s${Date.now()}`;
    state.seats.push({ id, name: t('newSeat'), x: 0, z: 0, rot: 0, side: 1, zone: 'work' });
    selectedKey = seatKey(id); saveState(); render();
  };
  app.querySelector('#savePlan').onclick = event => {
    saveState(); event.currentTarget.textContent = `✓　${t('saved')}`;
    setTimeout(() => { if (event.currentTarget.isConnected) event.currentTarget.textContent = `✓　${t('save')}`; }, 1300);
  };
  app.querySelector('#resetPlan').onclick = () => {
    if (!confirm(t('resetConfirm'))) return;
    state.seats = structuredClone(startSeats); state.board = { x: 0, z: .45, rot: 0 };
    state.cabinet = structuredClone(baseState.cabinet);
    state.cart = { x: 1.85, z: -2.65, rot: -.18 };
    state.kitchenObjects = {};
    for (const item of movable.values()) {
      if (item.kind !== 'kitchen') continue;
      Object.assign(item.data, item.defaultTransform);
      state.kitchenObjects[item.id] = item.data;
      item.group.position.set(item.data.x, 0, item.data.z - KITCHEN_Z_OFFSET);
      item.group.rotation.y = item.data.rot || 0;
    }
    state.boardMarks = [];
    selectedKey = null; saveState(); render();
  };
  app.querySelectorAll('[data-view]').forEach(button => button.onclick = () => setView(button.dataset.view));
  app.querySelector('#rotateLeft').onclick = () => rotateSelected(-15);
  app.querySelector('#rotateRight').onclick = () => rotateSelected(15);
  app.querySelector('#angle').onchange = event => {
    const object = getSelected(); if (!object) return;
    object.rot = THREE.MathUtils.degToRad(Number(event.target.value) || 0);
    saveState(); render();
  };
  const toggles = {
    showWalls: 'showWalls', showDimensions: 'showDimensions',
    showCollisions: 'showCollisions', showZones: 'showZones'
  };
  for (const [id, key] of Object.entries(toggles)) {
    app.querySelector(`#${id}`).onchange = event => {
      state[key] = event.target.checked; saveState(); refreshLayers();
    };
  }
  app.querySelectorAll('[data-select]').forEach(button => button.onclick = () => {
    selectedKey = button.dataset.select;
    render();
    setHoveredObject(selectedKey);
  });
  app.querySelectorAll('[data-compass]').forEach(button => button.onclick = () => setView(button.dataset.compass));
  app.querySelector('#zoomIn').onclick = () => zoom(.84);
  app.querySelector('#zoomOut').onclick = () => zoom(1.18);
  app.querySelector('#homeView').onclick = () => setView('orbit');
  app.querySelector('#walkMode').onclick = toggleWalkMode;
  bindWalkMobileControls();
  bindSidebarResizer();

  const nameInput = app.querySelector('#objectName');
  if (nameInput) nameInput.onchange = event => {
    const seat = getSeat(); if (!seat) return;
    seat.name = event.target.value.trim() || t('empty'); saveState(); render();
  };
  for (const axis of ['X', 'Z']) {
    const input = app.querySelector(`#coord${axis}`);
    if (input) input.onchange = event => {
      const object = getSelected(); if (!object) return;
      object[axis.toLowerCase()] = Number(event.target.value) || 0;
      saveState(); render();
    };
  }
  const deleteButton = app.querySelector('#deleteSeat');
  if (deleteButton) deleteButton.onclick = removeSelectedWorkspace;
  const closeSettings = () => { state.settingsOpen = false; render(); };
  for (const id of ['closeSettings', 'settingsDone']) {
    const button = app.querySelector(`#${id}`); if (button) button.onclick = closeSettings;
  }
  const backdrop = app.querySelector('#settingsBackdrop');
  if (backdrop) backdrop.onclick = event => { if (event.target === backdrop) closeSettings(); };
  app.querySelectorAll('[data-theme]').forEach(button => button.onclick = () => {
    state.theme = button.dataset.theme; saveState(); render();
  });
  app.querySelectorAll('[data-language]').forEach(button => button.onclick = () => {
    state.language = button.dataset.language; saveState(); render();
  });
  window.onkeydown = createKeyboardShortcutHandler({
    getWalkingMode: () => walkingMode,
    exitWalkMode,
    getState: () => state,
    hasSelection: () => Boolean(selectedKey),
    clearSelection: () => { selectedKey = null; },
    render,
    app,
    undo: undoLayoutChange,
    redo: redoLayoutChange,
    getSelected,
    rotateSelected,
    moveSelected: moveSelectedBy,
    orbitCamera: orbitCameraBy,
    getSeat,
    removeWorkspace: removeSelectedWorkspace,
    zoom,
    setView
  });
}
function usesTouchWalkControls() {
  return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
}
function bindWalkMobileControls() {
  const joystick = app.querySelector('#walkJoystick');
  const thumb = joystick?.querySelector('.walk-joystick-thumb');
  if (joystick && thumb) {
    const updateJoystick = event => {
      if (event.pointerId !== walkJoystickPointerId) return;
      const rect = joystick.getBoundingClientRect();
      const radius = rect.width * .34;
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const length = Math.hypot(dx, dy);
      const scale = length > radius ? radius / length : 1;
      const x = dx * scale;
      const y = dy * scale;
      thumb.style.transform = `translate(${x}px, ${y}px)`;
      walkKeys.clear();
      if (y < -radius * .22) walkKeys.add('w');
      if (y > radius * .22) walkKeys.add('s');
      if (x < -radius * .22) walkKeys.add('a');
      if (x > radius * .22) walkKeys.add('d');
      event.preventDefault();
    };
    const releaseJoystick = event => {
      if (event.pointerId !== walkJoystickPointerId) return;
      walkJoystickPointerId = null;
      walkKeys.clear();
      thumb.style.transform = 'translate(0, 0)';
    };
    joystick.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' || walkJoystickPointerId !== null) return;
      walkJoystickPointerId = event.pointerId;
      joystick.setPointerCapture(event.pointerId);
      updateJoystick(event);
    });
    joystick.addEventListener('pointermove', updateJoystick);
    joystick.addEventListener('pointerup', releaseJoystick);
    joystick.addEventListener('pointercancel', releaseJoystick);
    joystick.addEventListener('lostpointercapture', releaseJoystick);
  }

  const interact = app.querySelector('#walkInteract');
  interact?.addEventListener('click', interactInWalkMode);

  const draw = app.querySelector('#walkDraw');
  const startDrawing = event => {
    if (!walkingMode || !['marker', 'eraser'].includes(walkHeld?.type)) return;
    event.preventDefault();
    mobileDrawHeld = true;
    pointer.set(0, 0);
    beginBoardStroke();
  };
  const stopDrawing = () => {
    if (!mobileDrawHeld) return;
    mobileDrawHeld = false;
    finishBoardStroke();
  };
  draw?.addEventListener('pointerdown', startDrawing);
  draw?.addEventListener('pointerdown', event => {
    if (mobileDrawHeld) draw.setPointerCapture(event.pointerId);
  });
  draw?.addEventListener('pointerup', stopDrawing);
  draw?.addEventListener('pointercancel', stopDrawing);
  draw?.addEventListener('lostpointercapture', stopDrawing);

  app.querySelector('#walkRotate')?.addEventListener('click', () => {
    if (walkHeld?.type !== 'movable') return;
    walkHeld.item.data.rot = (walkHeld.item.data.rot || 0) + Math.PI / 12;
    walkHeld.item.group.rotation.y = walkHeld.item.data.rot;
    updateHeldWalkObject();
  });
}
function rotateSelected(degrees) {
  const object = getSelected(); if (!object) return;
  object.rot = (object.rot || 0) + THREE.MathUtils.degToRad(degrees);
  const item = movable.get(selectedKey);
  if (item) item.group.rotation.y = object.rot;
  saveState(); render();
}
function removeSelectedWorkspace() {
  const seat = getSeat();
  if (!seat) return;
  state.seats = state.seats.filter(item => item.id !== seat.id);
  selectedKey = null;
  saveState();
  render();
}
function restoreLayoutSnapshot(snapshot) {
  const layout = JSON.parse(snapshot);
  state.seats = layout.seats;
  state.board = layout.board;
  state.cabinet = layout.cabinet;
  state.cart = layout.cart || { x: 1.85, z: -2.65, rot: -.18 };
  state.kitchenObjects = layout.kitchenObjects || {};
  for (const item of movable.values()) {
    if (item.kind !== 'kitchen') continue;
    item.data = state.kitchenObjects[item.id] || { ...item.defaultTransform };
    state.kitchenObjects[item.id] = item.data;
    item.group.position.set(item.data.x, 0, item.data.z - KITCHEN_Z_OFFSET);
    item.group.rotation.y = item.data.rot || 0;
  }
  state.boardMarks = layout.boardMarks || [];
  lastLayoutSnapshot = snapshot;
  if (selectedKey?.startsWith('seat:') && !state.seats.some(seat => seatKey(seat.id) === selectedKey)) {
    selectedKey = null;
  }
  saveState();
  render();
}
function undoLayoutChange() {
  if (!undoHistory.length) return;
  redoHistory.push(lastLayoutSnapshot);
  restoreLayoutSnapshot(undoHistory.pop());
}
function redoLayoutChange() {
  if (!redoHistory.length) return;
  undoHistory.push(lastLayoutSnapshot);
  restoreLayoutSnapshot(redoHistory.pop());
}
function moveSelectedBy(deltaX, deltaZ) {
  const object = getSelected();
  if (!object) return;
  const item = movable.get(selectedKey);
  if (item?.kind === 'kitchen') {
    const rotation = object.rot || 0;
    const halfX = (Math.abs(Math.cos(rotation)) * item.width + Math.abs(Math.sin(rotation)) * item.depth) / 2;
    const halfZ = (Math.abs(Math.sin(rotation)) * item.width + Math.abs(Math.cos(rotation)) * item.depth) / 2;
    object.x = THREE.MathUtils.clamp(object.x + deltaX, KITCHEN_WORLD_LEFT + halfX, KITCHEN_RIGHT - halfX);
    object.z = THREE.MathUtils.clamp(object.z + deltaZ, -HALF_L + halfZ, KITCHEN_WORLD_TOP - halfZ);
    item.group.position.set(object.x, 0, object.z - KITCHEN_Z_OFFSET);
    saveState(); render();
    return;
  }
  const [marginX, marginZ] = selectedKey === 'cabinet' ? [.38, .34]
    : selectedKey === 'board' ? [.6, .1] : selectedKey === 'cart' ? [.42, .52] : [.7, .6];
  object.x = THREE.MathUtils.clamp(object.x + deltaX, -HALF_W + marginX, HALF_W - marginX);
  object.z = THREE.MathUtils.clamp(object.z + deltaZ, -HALF_L + marginZ, HALF_L - marginZ);
  saveState();
  render();
}
function toggleWalkMode() {
  if (!pointerControls || !camera || importedModel) return;
  if (walkingMode) {
    exitWalkMode();
    return;
  }

  walkKeys.clear();
  walkHeld = null;
  seatedAt = null;
  pointer.set(0, 0);
  dragging = null;
  renderAfterPointer = false;
  camera.rotation.order = 'YXZ';
  camera.position.set(ENTRY.centerX, 1.62, -HALF_L + .72);
  camera.rotation.set(0, 0, 0, 'YXZ');
  controls.enabled = false;
  walkingMode = true;
  updateWalkToggle(true);
  if (usesTouchWalkControls()) {
    activateWalkFallback();
    return;
  }
  try {
    const lockAttempt = renderer.domElement.requestPointerLock?.();
    if (lockAttempt?.catch) lockAttempt.catch(activateWalkFallback);
  } catch (error) {
    console.warn('First-person pointer lock is unavailable:', error);
    activateWalkFallback();
  }
}
function activateWalkFallback() {
  if (walkingMode && !pointerControls?.isLocked) onWalkLock();
}
function exitWalkMode() {
  if (!walkingMode) return;
  if (currentBoardStroke) finishBoardStroke();
  if (walkHeld?.type === 'marker') returnMarkerToTray();
  if (walkHeld?.type === 'eraser') returnBoardEraserToTray();
  if (walkHeld?.type === 'movable') {
    walkHeld = null;
    saveState();
    updateMiniPlan();
    updateCollisions();
    updateDimensions();
  }
  if (seatedAt) {
    camera.position.y = 1.62;
    seatedAt = null;
  }
  if (pointerControls?.isLocked) pointerControls.unlock();
  else onWalkUnlock();
}
function updateWalkToggle(active) {
  const button = app.querySelector('#walkMode');
  button?.classList.toggle('active', active);
  button?.setAttribute('aria-pressed', String(active));
}
function onWalkLock() {
  walkingMode = true;
  walkPreviousTime = performance.now();
  walkCeiling.visible = true;
  if (kitchenCeiling) kitchenCeiling.visible = true;
  document.body.classList.add('walking-mode');
  document.body.classList.toggle('touch-walk-controls', usesTouchWalkControls());
  updateWalkToggle(true);
  app.querySelector('#walkHint')?.classList.add('visible');
  updateWalkHintText();
}
function onWalkUnlock() {
  const wasWalking = walkingMode;
  walkingMode = false;
  walkKeys.clear();
  walkTouchLook = null;
  walkJoystickPointerId = null;
  mobileDrawHeld = false;
  app.querySelector('#walkJoystick .walk-joystick-thumb')?.style.setProperty('transform', 'translate(0, 0)');
  if (walkCeiling) walkCeiling.visible = false;
  if (kitchenCeiling) kitchenCeiling.visible = false;
  document.body.classList.remove('walking-mode');
  document.body.classList.remove('touch-walk-controls');
  updateWalkToggle(false);
  app.querySelector('#walkHint')?.classList.remove('visible');
  if (!wasWalking || !controls || !camera) return;

  const direction = camera.getWorldDirection(new THREE.Vector3());
  controls.target.copy(camera.position).addScaledVector(direction, 2.5);
  controls.target.y = .25;
  controls.enabled = true;
  controls.update();
}
function handleWalkKeyDown(event) {
  if (!walkingMode) return;
  const key = keyFromCode(event.code);
  if (['w', 'a', 's', 'd'].includes(key)) {
    walkKeys.add(key);
    event.preventDefault();
    return;
  }
  if (event.code === 'KeyE' && !event.repeat) {
    event.preventDefault();
    interactInWalkMode();
  }
  if (event.code === 'KeyR' && walkHeld?.type === 'movable') {
    event.preventDefault();
    walkHeld.item.data.rot = (walkHeld.item.data.rot || 0) + Math.PI / 12;
    walkHeld.item.group.rotation.y = walkHeld.item.data.rot;
    updateHeldWalkObject();
  }
}
function handleWalkKeyUp(event) {
  walkKeys.delete(keyFromCode(event.code));
}
function keyFromCode(code) {
  return code.startsWith('Key') ? code.slice(3).toLowerCase() : code;
}
function setWalkPointer(event) {
  if (!renderer || !pointer) return;
  if (pointerControls?.isLocked) {
    pointer.set(0, 0);
    return;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1);
}
function findWalkTarget() {
  if (!raycaster || !pointer) return null;
  if (pointerControls?.isLocked || usesTouchWalkControls()) pointer.set(0, 0);
  raycaster.setFromCamera(pointer, camera);
  const roots = [...movable.values()].map(item => item.group);
  roots.push(...walkDoors.map(door => door.group));
  const hit = raycaster.intersectObjects(roots, true).find(intersection => intersection.distance <= 2.8);
  if (!hit) return null;
  let target = hit.object;
  while (target) {
    if (target.userData.walkInteraction) {
      return { type: target.userData.walkInteraction, object: target, door: target.userData.walkDoor, intersection: hit };
    }
    if (target.userData.moveKey) {
      return { type: 'movable', key: target.userData.moveKey, object: target, intersection: hit };
    }
    target = target.parent;
  }
  return null;
}
function interactInWalkMode() {
  if (currentBoardStroke) finishBoardStroke();
  if (seatedAt) {
    standFromWalkChair();
    return;
  }
  if (walkHeld?.type === 'marker') {
    returnMarkerToTray();
    return;
  }
  if (walkHeld?.type === 'eraser') {
    returnBoardEraserToTray();
    return;
  }
  if (walkHeld?.type === 'movable') {
    walkHeld = null;
    updateWalkHintText();
    saveState();
    updateMiniPlan();
    updateCollisions();
    updateDimensions();
    return;
  }

  const target = findWalkTarget();
  if (!target) return;
  if (target.type === 'chair') {
    sitInWalkChair(target.object);
    return;
  }
  if (target.type === 'door') {
    toggleWalkDoor(target.door);
    return;
  }
  if (target.type === 'marker') {
    pickUpBoardMarker(target.object);
    return;
  }
  if (target.type === 'eraser') {
    pickUpBoardEraser(target.object);
    return;
  }
  if (target.type === 'movable') {
    pickUpWalkObject(target.key);
  }
}
function toggleWalkDoor(door) {
  if (!door) return;
  const closing = door.targetRotation !== door.closedRotation;
  if (closing) {
    const candidate = doorRect(door, door.closedRotation);
    const dx = camera.position.x - candidate.x;
    const dz = camera.position.z - candidate.z;
    const cosine = Math.cos(candidate.rotation);
    const sine = Math.sin(candidate.rotation);
    const localX = cosine * dx - sine * dz;
    const localZ = sine * dx + cosine * dz;
    if (Math.abs(localX) < candidate.width / 2 + .35 && Math.abs(localZ) < candidate.depth / 2 + .35) return;
  }
  door.targetRotation = closing ? door.closedRotation : door.openRotation;
  updateWalkHintText();
}
function doorRect(door, rotation = door.group.rotation.y) {
  const centerOffset = door.width / 2 * (door.direction || 1);
  return {
    x: door.hingeX + Math.cos(rotation) * centerOffset,
    z: door.hingeZ - Math.sin(rotation) * centerOffset,
    width: door.width,
    depth: .075,
    rotation
  };
}
function updateWalkDoors(delta) {
  for (const door of walkDoors) {
    const difference = door.targetRotation - door.group.rotation.y;
    if (Math.abs(difference) < .002) door.group.rotation.y = door.targetRotation;
    else door.group.rotation.y += difference * Math.min(1, delta * 7.5);
  }
}
function updateWalkHintText() {
  const hint = app.querySelector('#walkHint');
  if (!hint) return;
  const mobile = usesTouchWalkControls();
  const messages = state.language === 'ru'
    ? { marker: mobile ? 'Джойстик — ходить · веди сцену пальцем для обзора · ✎ удерживать — рисовать · E — вернуть маркер' : 'Маркер в руке · ЛКМ по доске — рисовать · E — вернуть', eraser: mobile ? 'Джойстик — ходить · ✎ удерживать — стирать · E — вернуть стиратель' : 'Стиратель в руке · ЛКМ по доске — стирать · E — вернуть', object: mobile ? 'Джойстик — двигать предмет · ↻ — повернуть · E — поставить' : 'Объект перед тобой · WASD — переместить · R — повернуть · E — поставить', seated: 'Ты сидишь · E — встать', normal: mobile ? 'Джойстик — ходить · веди сцену пальцем для обзора · E — взаимодействовать' : dictionaries.ru.walkHint }
    : { marker: mobile ? 'Joystick moves · drag the scene to look · hold ✎ to draw · E returns marker' : 'Marker in hand · left mouse on board to draw · E — return', eraser: mobile ? 'Joystick moves · hold ✎ to erase · E returns eraser' : 'Eraser in hand · left mouse on board to erase · E — return', object: mobile ? 'Joystick moves object · ↻ rotates · E places it' : 'Object in front · WASD — move · R — rotate · E — place', seated: 'Seated · E — stand up', normal: mobile ? 'Joystick moves · drag the scene to look · E interacts' : dictionaries.en.walkHint };
  hint.textContent = seatedAt ? messages.seated
    : walkHeld?.type === 'marker' ? messages.marker
      : walkHeld?.type === 'eraser' ? messages.eraser
      : walkHeld?.type === 'movable' ? messages.object : messages.normal;
  const drawButton = app.querySelector('#walkDraw');
  if (drawButton) drawButton.disabled = !['marker', 'eraser'].includes(walkHeld?.type);
  const rotateButton = app.querySelector('#walkRotate');
  if (rotateButton) rotateButton.disabled = walkHeld?.type !== 'movable';
}
function pickUpBoardMarker(marker) {
  walkHeld = { type: 'marker', object: marker };
  boardMarkerTray.remove(marker);
  camera.add(marker);
  marker.position.set(.2, -.16, -.42);
  marker.rotation.set(0, 0, Math.PI / 2);
  updateWalkHintText();
}
function returnMarkerToTray() {
  const marker = walkHeld?.object;
  if (!marker || !boardMarkerTray) return;
  camera.remove(marker);
  boardMarkerTray.add(marker);
  marker.position.copy(marker.userData.homePosition);
  marker.rotation.set(0, 0, 0);
  walkHeld = null;
  updateWalkHintText();
}
function pickUpBoardEraser(eraser) {
  walkHeld = { type: 'eraser', object: eraser };
  boardMarkerTray.remove(eraser);
  camera.add(eraser);
  eraser.position.set(.2, -.16, -.42);
  eraser.rotation.set(0, 0, 0);
  updateWalkHintText();
}
function returnBoardEraserToTray() {
  const eraser = walkHeld?.object;
  if (!eraser || !boardMarkerTray) return;
  camera.remove(eraser);
  boardMarkerTray.add(eraser);
  eraser.position.copy(eraser.userData.homePosition);
  eraser.rotation.set(0, 0, 0);
  walkHeld = null;
  updateWalkHintText();
}
function pickUpWalkObject(key) {
  const item = movable.get(key);
  if (!item) return;
  walkHeld = { type: 'movable', key, item };
  selectedKey = key;
  updateWalkHintText();
  updateHeldWalkObject();
}
function walkPlacementIsClear(item, x, z) {
  const candidate = rectFor({ ...item, data: { ...item.data, x, z } });
  const footprintCorners = corners(candidate);
  const insideOffice = footprintCorners.every(point =>
    Math.abs(point.x) <= HALF_W - .03 && Math.abs(point.z) <= HALF_L - .03
  );
  const insideKitchen = footprintCorners.every(point =>
    point.x >= KITCHEN_WORLD_LEFT + .03 && point.x <= KITCHEN_RIGHT - .03
      && point.z >= -HALF_L + .03 && point.z <= KITCHEN_WORLD_TOP - .03
  );
  if (item.kind === 'seat' ? !insideOffice : !insideOffice && !insideKitchen) return false;
  if (obstacles.some(obstacle => overlaps(candidate, { ...obstacle, rotation: obstacle.rot || 0 }))) return false;
  for (const [key, other] of movable) {
    if (key === walkHeld?.key) continue;
    if (overlaps(candidate, rectFor(other))) return false;
  }
  return true;
}
function updateHeldWalkObject() {
  if (walkHeld?.type !== 'movable') return;
  const item = walkHeld.item;
  const forward = camera.getWorldDirection(new THREE.Vector3());
  forward.y = 0;
  forward.normalize();
  const x = camera.position.x + forward.x * .95;
  const z = camera.position.z + forward.z * .95;
  if (!walkPlacementIsClear(item, x, z)) return;
  item.data.x = x;
  item.data.z = z;
  item.group.position.set(x, 0, z - (item.kind === 'kitchen' ? KITCHEN_Z_OFFSET : 0));
}
function sitInWalkChair(chair) {
  seatedAt = { chair, position: camera.position.clone(), rotation: camera.rotation.clone() };
  const chairPosition = chair.getWorldPosition(new THREE.Vector3());
  const side = chair.userData.side || 1;
  camera.position.set(chairPosition.x + side * .05, 1.05, chairPosition.z);
  camera.rotation.set(-.035, side * Math.PI / 2, 0, 'YXZ');
  walkKeys.clear();
  updateWalkHintText();
}
function standFromWalkChair() {
  if (!seatedAt) return;
  camera.position.copy(seatedAt.position);
  camera.position.y = 1.62;
  camera.rotation.copy(seatedAt.rotation);
  seatedAt = null;
  updateWalkHintText();
}
function beginBoardStroke() {
  if (!['marker', 'eraser'].includes(walkHeld?.type) || !boardSurface || !boardRoot) return;
  if (usesTouchWalkControls()) pointer.set(0, 0);
  if (walkHeld.type === 'eraser') {
    currentBoardErase = true;
    boardEraseChanged = false;
    updateBoardStroke();
    return;
  }
  if (pointerControls?.isLocked) pointer.set(0, 0);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(boardSurface, false)[0];
  if (!hit || hit.distance > 4) return;
  boardRoot.updateMatrixWorld(true);
  const local = boardRoot.worldToLocal(hit.point.clone());
  const points = [[THREE.MathUtils.clamp(local.x, -.55, .55), THREE.MathUtils.clamp(local.y, .99, 1.75)]];
  const mark = { color: walkHeld.object.userData.markerColor, points };
  state.boardMarks.push(mark);
  currentBoardStroke = { mark, mesh: null };
}
function updateBoardStroke() {
  if ((!currentBoardStroke && !currentBoardErase) || !boardSurface || !boardRoot) return;
  if (pointerControls?.isLocked || (usesTouchWalkControls() && mobileDrawHeld)) pointer.set(0, 0);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(boardSurface, false)[0];
  if (!hit || hit.distance > 4) return;
  boardRoot.updateMatrixWorld(true);
  const local = boardRoot.worldToLocal(hit.point.clone());
  if (currentBoardErase) {
    const previousCount = state.boardMarks.length;
    state.boardMarks = state.boardMarks.filter(mark =>
      !mark.points.some(([x, y]) => Math.hypot(local.x - x, local.y - y) < .065)
    );
    if (state.boardMarks.length !== previousCount) {
      boardEraseChanged = true;
      boardDrawings.children.slice().forEach(disposeObject);
      boardDrawings.clear();
      state.boardMarks.forEach(mark => createBoardStrokeMesh(boardDrawings, mark.points, mark.color));
    }
    return;
  }
  if (local.x < -.555 || local.x > .555 || local.y < .99 || local.y > 1.75) return;
  const points = currentBoardStroke.mark.points;
  const previous = points[points.length - 1];
  if (Math.hypot(local.x - previous[0], local.y - previous[1]) < .008) return;
  points.push([local.x, local.y]);
  if (currentBoardStroke.mesh) {
    boardDrawings.remove(currentBoardStroke.mesh);
    currentBoardStroke.mesh.geometry.dispose();
    currentBoardStroke.mesh.material.dispose();
  }
  currentBoardStroke.mesh = createBoardStrokeMesh(boardDrawings, points, currentBoardStroke.mark.color);
}
function finishBoardStroke() {
  if (currentBoardErase) {
    if (boardEraseChanged) saveState();
    currentBoardErase = false;
    boardEraseChanged = false;
    return;
  }
  if (!currentBoardStroke) return;
  if (currentBoardStroke.mark.points.length < 2) {
    state.boardMarks.pop();
    if (currentBoardStroke.mesh) {
      boardDrawings.remove(currentBoardStroke.mesh);
      currentBoardStroke.mesh.geometry.dispose();
      currentBoardStroke.mesh.material.dispose();
    }
  } else {
    saveState();
  }
  currentBoardStroke = null;
}
function walkPointBlocked(x, z) {
  const radius = .22;
  const inOffice = x >= -HALF_W + radius && x <= HALF_W - radius
    && z >= -HALF_L + radius && z <= HALF_L - radius;
  const inKitchen = x >= KITCHEN_WORLD_LEFT + radius && x <= KITCHEN_RIGHT - radius
    && z >= -HALF_L + radius && z <= KITCHEN_WORLD_TOP - radius;
  // The corridor begins at the office entrance and continues past the pantry to the kitchen door.
  const inCorridor = x >= -HALF_W + radius && x <= KITCHEN_RIGHT - radius
    && z >= -HALF_L - 1.8 + radius && z <= -HALF_L + radius;
  if (!inOffice && !inKitchen && !inCorridor) return true;
  const crossesConnectingDoorLine = (camera.position.z > -HALF_L && z <= -HALF_L)
    || (camera.position.z <= -HALF_L && z > -HALF_L);
  const kitchenDoorways = [
    KITCHEN_DOORS.pantry,
    { center: KITCHEN_DOORS.kitchen.center, width: KITCHEN_DOORS.kitchen.width }
  ];
  const officeDoor = Math.abs(x - ENTRY.centerX) <= ENTRY.width / 2 - radius;
  const kitchenDoor = kitchenDoorways.some(door => Math.abs(x - door.center) <= door.width / 2 - radius);
  if (crossesConnectingDoorLine && !officeDoor && !kitchenDoor) return true;
  const intersects = rect => {
    const dx = x - rect.x, dz = z - rect.z;
    const cosine = Math.cos(rect.rotation || 0), sine = Math.sin(rect.rotation || 0);
    const localX = cosine * dx - sine * dz;
    const localZ = sine * dx + cosine * dz;
    return Math.abs(localX) < rect.width / 2 + radius && Math.abs(localZ) < rect.depth / 2 + radius;
  };
  if (obstacles.some(obstacle => intersects({ ...obstacle, rotation: obstacle.rot || 0 }))) return true;
  if (walkDoors.some(door => intersects(doorRect(door)))) return true;
  return [...movable.entries()].some(([key, item]) => key !== walkHeld?.key && intersects(rectFor(item)));
}
function updateWalkMovement(now) {
  if (!walkingMode) return;
  if (seatedAt) return;
  const delta = Math.min((now - walkPreviousTime) / 1000, .05);
  walkPreviousTime = now;
  const forwardInput = Number(walkKeys.has('w')) - Number(walkKeys.has('s'));
  const rightInput = Number(walkKeys.has('d')) - Number(walkKeys.has('a'));
  if (forwardInput || rightInput) {
    const forward = camera.getWorldDirection(walkDirection);
    forward.y = 0;
    forward.normalize();
    const right = forward.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    const movement = forward.multiplyScalar(forwardInput).add(right.multiplyScalar(rightInput))
      .normalize().multiplyScalar(2.4 * delta);
    const nextX = camera.position.x + movement.x;
    const nextZ = camera.position.z + movement.z;
    if (!walkPointBlocked(nextX, camera.position.z)) camera.position.x = nextX;
    if (!walkPointBlocked(camera.position.x, nextZ)) camera.position.z = nextZ;
  }
  updateWalkDoors(delta);
  updateHeldWalkObject();
  if (mobileDrawHeld) updateBoardStroke();
}
function updateWalkTouchLook(event) {
  if (!walkTouchLook || event.pointerId !== walkTouchLook.pointerId) return;
  const deltaX = event.clientX - walkTouchLook.x;
  const deltaY = event.clientY - walkTouchLook.y;
  walkTouchLook.x = event.clientX;
  walkTouchLook.y = event.clientY;
  camera.rotation.order = 'YXZ';
  camera.rotation.y -= deltaX * .006;
  camera.rotation.x = THREE.MathUtils.clamp(
    camera.rotation.x - deltaY * .006,
    -Math.PI / 2 + .2,
    Math.PI / 2 - .2
  );
  camera.rotation.z = 0;
  pointer.set(0, 0);
}
function handleWalkMouseMove(event) {
  if (!walkingMode) return;
  if (pointerControls?.isLocked) {
    pointer.set(0, 0);
    updateBoardStroke();
    return;
  }
  camera.rotation.order = 'YXZ';
  camera.rotation.y -= event.movementX * .0045;
  camera.rotation.x = THREE.MathUtils.clamp(
    camera.rotation.x - event.movementY * .0045,
    -Math.PI / 2 + .2,
    Math.PI / 2 - .2
  );
  camera.rotation.z = 0;
  setWalkPointer(event);
  updateBoardStroke();
}
function orbitCameraBy(deltaTheta, deltaPhi) {
  if (!camera || !controls) return;
  const target = controls.target.clone();
  const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
  spherical.theta += deltaTheta;
  spherical.phi = THREE.MathUtils.clamp(spherical.phi + deltaPhi, .12, Math.PI - .12);
  const destination = new THREE.Vector3().setFromSpherical(spherical).add(target);
  const origin = camera.position.clone();
  const started = performance.now();
  const duration = 180;
  cancelAnimationFrame(cameraMoveFrame);
  controls.enabled = false;
  const animateOrbit = now => {
    const progress = Math.min((now - started) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    camera.position.lerpVectors(origin, destination, eased);
    camera.lookAt(target);
    syncViewCube();
    if (progress < 1) {
      cameraMoveFrame = requestAnimationFrame(animateOrbit);
      return;
    }
    controls.enabled = true;
    controls.update();
  };
  cameraMoveFrame = requestAnimationFrame(animateOrbit);
}

function initScene() {
  const host = document.querySelector('#scene'); if (!host) return;
  if (!renderer) createScene(host);
  else { host.appendChild(renderer.domElement); rebuildMovables(); resizeScene(); }
  refreshLayers(); updateDimensions(); updateCollisions();
}
async function loadLocalModel(file, selectedFiles = [file]) {
  try {
    const result = await parseLocalModel(file, selectedFiles);
    closeLocalModel(false);
    importedModelUrls = result.objectUrls;
    const { object, size, largestSide } = result;
    scene.add(object);
    importedModel = object;
    importedModelName = file.name;
    roomGroup.visible = false;
    movable.forEach(item => { item.group.visible = false; });
    const target = new THREE.Vector3(0, Math.min(size.y * .25, 1.2), 0);
    controls.target.copy(target);
    const distance = Math.max(5, Math.min(18, largestSide * 2.4));
    camera.position.set(distance * .55, distance * .9, distance * .7).add(target);
    controls.update();
    render();
  } catch (error) {
    console.error('Could not load selected 3D file:', error);
    alert(`${t('modelError')}: ${file.name}\n\n${state.language === 'ru' ? 'Поддерживаются GLB, GLTF, OBJ и STL. Для GLTF вместе с файлом модели выберите также связанные файлы.' : 'Supported formats are GLB, GLTF, OBJ, and STL. For GLTF, also select the model’s linked resource files.'}`);
  }
}
function closeLocalModel(rerender = true) {
  if (importedModel) {
    importedModel.parent?.remove(importedModel);
    disposeObject(importedModel);
    importedModel = null;
  }
  if (roomGroup) roomGroup.visible = true;
  movable.forEach(item => { item.group.visible = true; });
  importedModelName = '';
  importedModelUrls.forEach(URL.revokeObjectURL);
  importedModelUrls = [];
  if (rerender) render();
}
function createScene(host) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(state.theme === 'dark' ? 0x20211f : 0xe9eaeb);
  camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, .1, 100);
  camera.position.set(SITE_CENTER_X + 8.8, 16.2, SITE_CENTER_Z + 10.8);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  host.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(SITE_CENTER_X, .2, SITE_CENTER_Z); controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * .48; controls.minDistance = 4; controls.maxDistance = 38;
  pointerControls = new PointerLockControls(camera, renderer.domElement);
  pointerControls.pointerSpeed = 1.2;
  pointerControls.addEventListener('lock', onWalkLock);
  pointerControls.addEventListener('unlock', onWalkUnlock);
  document.addEventListener('pointerlockerror', activateWalkFallback);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x77716a, 2.15));
  const keyLight = new THREE.DirectionalLight(0xfff1d1, 3.2);
  keyLight.position.set(-5, 12, 7); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -20;
  keyLight.shadow.camera.right = 20;
  keyLight.shadow.camera.top = 20;
  keyLight.shadow.camera.bottom = -20;
  keyLight.shadow.camera.near = .5;
  keyLight.shadow.camera.far = 60;
  keyLight.shadow.camera.updateProjectionMatrix();
  keyLight.shadow.bias = -.00025;
  keyLight.shadow.normalBias = .025;
  keyLight.shadow.radius = 2;
  scene.add(keyLight);
  const fill = new THREE.DirectionalLight(0xffffff, 1.1);
  fill.position.set(5, 8, -4); scene.add(fill);
  roomGroup = new THREE.Group();
  roomGroup.name = 'Office scene';
  scene.add(roomGroup);
  buildRoom(); rebuildMovables();
  raycaster = new THREE.Raycaster(); pointer = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointermove', pointerMove);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  renderer.domElement.addEventListener('pointerleave', event => {
    if (!dragging) setHoveredObject(null);
    if (event.pointerType !== 'touch') pointerUp(event);
  });
  window.addEventListener('keydown', handleWalkKeyDown);
  window.addEventListener('keyup', handleWalkKeyUp);
  window.addEventListener('blur', () => walkKeys.clear());
  document.addEventListener('mousemove', handleWalkMouseMove);
  window.addEventListener('resize', resizeScene); animate();
}
function buildRoom() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.length), mat(0x777a7d, .96, { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.04; floor.receiveShadow = true; roomGroup.add(floor);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width - .2, ROOM.length - .2),
    new THREE.MeshStandardMaterial({ color: 0x777a7d, roughness: 1, metalness: 0 }));
  carpet.rotation.x = -Math.PI / 2; carpet.position.y = -.01; carpet.receiveShadow = true; roomGroup.add(carpet);
  walkDoors.length = 0;
  buildConnectingCorridor();
  wallGroup = new THREE.Group(); wallGroup.name = 'Walls'; roomGroup.add(wallGroup);
  windowGroup = new THREE.Group(); windowGroup.name = 'Windows'; roomGroup.add(windowGroup);
  columnGroup = new THREE.Group(); columnGroup.name = 'Columns'; roomGroup.add(columnGroup);
  furnitureGroup = new THREE.Group(); furnitureGroup.name = 'Fixed furniture'; roomGroup.add(furnitureGroup);
  zoneGroup = new THREE.Group(); roomGroup.add(zoneGroup);
  collisionGroup = new THREE.Group(); roomGroup.add(collisionGroup);
  obstacles.length = 0;
  const walls = mat(0xe4e1d9), trim = mat(0x34383a), base = mat(0x34383a);
  const doorLeft = ENTRY.centerX - ENTRY.width / 2;
  const doorRight = ENTRY.centerX + ENTRY.width / 2;
  const leftPier = doorLeft + HALF_W;
  const rightPier = HALF_W - doorRight;

  // The office is a separate room; the corridor connects it to the kitchen.
  box(wallGroup, .16, ROOM.wallHeight, ROOM.length, walls, -HALF_W - .08, ROOM.wallHeight / 2, 0);
  box(wallGroup, .16, ROOM.wallHeight, ROOM.length, walls, HALF_W + .08, ROOM.wallHeight / 2, 0);

  // Entrance end: an open doorway near the column at the opposite end.
  box(wallGroup, leftPier, ROOM.wallHeight, .16, walls,
    (-HALF_W + doorLeft) / 2, ROOM.wallHeight / 2, -HALF_L - .08);
  box(wallGroup, rightPier, ROOM.wallHeight, .16, walls,
    (doorRight + HALF_W) / 2, ROOM.wallHeight / 2, -HALF_L - .08);
  box(wallGroup, ENTRY.width, ROOM.wallHeight - ENTRY.height, .16, walls,
    ENTRY.centerX, (ROOM.wallHeight + ENTRY.height) / 2, -HALF_L - .08);
  box(wallGroup, .07, ENTRY.height, .09, trim, doorLeft, ENTRY.height / 2, -HALF_L - .025);
  box(wallGroup, .07, ENTRY.height, .09, trim, doorRight, ENTRY.height / 2, -HALF_L - .025);
  box(wallGroup, ENTRY.width + .08, .09, .09, trim, ENTRY.centerX, ENTRY.height, -HALF_L - .025);
  // Hinged leaf swings outward into the corridor (negative Z).
  buildDoorLeaf(doorLeft, -HALF_L - .025, 1.22);

  // Window end: low sill, clear glazing, and a continuous lintel.
  box(wallGroup, .38, ROOM.wallHeight, .16, walls, -HALF_W + .19, ROOM.wallHeight / 2, HALF_L + .08);
  box(wallGroup, .38, ROOM.wallHeight, .16, walls, HALF_W - .19, ROOM.wallHeight / 2, HALF_L + .08);
  box(wallGroup, 5, .84, .16, walls, 0, .42, HALF_L + .08);
  box(wallGroup, 5, .34, .16, walls, 0, 2.63, HALF_L + .08);

  box(wallGroup, ROOM.length, .09, .12, base, -HALF_W + .02, .045, 0).rotation.y = Math.PI / 2;
  box(wallGroup, ROOM.length, .09, .12, base, HALF_W - .02, .045, 0).rotation.y = Math.PI / 2;
  box(wallGroup, leftPier, .09, .12, base, (-HALF_W + doorLeft) / 2, .045, -HALF_L - .01);
  box(wallGroup, rightPier, .09, .12, base, (doorRight + HALF_W) / 2, .045, -HALF_L - .01);
  box(wallGroup, 5, .09, .12, base, 0, .045, HALF_L + .01);

  buildWindows(); buildColumns(); buildZoneOverlay(); buildYuraWallShelf(); buildArchitecturalDetails();
  buildPowerOutlets();
  const kitchenBuilder = createKitchenBuilder({
    roomGroup, wallGroup, windowGroup, columnGroup, furnitureGroup, obstacles,
    mat,
    box,
    cylinder,
    addCable,
    getKitchenObjectData(id, defaults) {
      state.kitchenObjects ||= {};
      state.kitchenObjects[id] ||= { ...defaults };
      return state.kitchenObjects[id];
    },
    registerMovable(key, item) {
      movable.set(key, item);
    },
    registerWalkDoor(door) {
      door.group.userData.walkInteraction = 'door';
      door.group.userData.walkDoor = door;
      walkDoors.push(door);
    }
  });
  ({ group: kitchenGroup, ceiling: kitchenCeiling } = kitchenBuilder.build());
  windowGroup.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
  });
}
function buildConnectingCorridor() {
  const corridorLeft = -HALF_W;
  const width = KITCHEN_RIGHT - corridorLeft;
  const depth = 1.8;
  const centerX = (corridorLeft + KITCHEN_RIGHT) / 2;
  const centerZ = -HALF_L - depth / 2;
  const base = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat(0x55595b, .98));
  base.rotation.x = -Math.PI / 2;
  base.position.set(centerX, -.04, centerZ);
  base.receiveShadow = true;
  roomGroup.add(base);

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(width - .08, depth - .08),
    new THREE.MeshStandardMaterial({ color: 0x686b6d, roughness: 1 }));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(centerX, -.008, centerZ);
  carpet.receiveShadow = true;
  roomGroup.add(carpet);
}
function buildPowerOutlets() {
  const plateMaterial = mat(0xd9dad5, .72);
  const socketMaterial = mat(0x252b2d, .48);
  const indicatorMaterial = mat(0xe6b833, .3, { emissive: 0x9c6412, emissiveIntensity: .3 });
  const groups = new Map();
  for (const seat of startSeats) {
    const wallSide = seat.x < 0 ? -1 : 1;
    const rowKey = `${wallSide}:${seat.z}`;
    if (groups.has(rowKey)) continue;
    groups.set(rowKey, { wallSide, z: seat.z });
  }

  for (const { wallSide, z } of groups.values()) {
    const plate = new THREE.Group();
    plate.position.set(wallSide * (HALF_W - .035), .19, z);
    plate.rotation.y = wallSide < 0 ? Math.PI / 2 : -Math.PI / 2;
    roomGroup.add(plate);
    box(plate, .19, .17, .025, plateMaterial, 0, 0, 0);
    for (const offset of [-.045, .045]) {
      const socket = new THREE.Mesh(new THREE.CylinderGeometry(.033, .033, .012, 20), socketMaterial);
      socket.rotation.z = Math.PI / 2;
      socket.position.set(offset, 0, .016);
      plate.add(socket);
      for (const pinOffset of [-.012, .012]) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(.003, .003, .014, 8), mat(0xb9b9ae, .42, { metalness: .35 }));
        pin.rotation.z = Math.PI / 2;
        pin.position.set(offset + pinOffset, 0, .024);
        plate.add(pin);
      }
    }
    box(plate, .018, .018, .009, indicatorMaterial, 0, .055, .018);
  }
}
function buildDoorLeaf(hingeX, z, rotation = 1.05) {
  const leaf = new THREE.Group();
  leaf.position.set(hingeX, 0, z);
  leaf.rotation.y = rotation;
  const frame = mat(0x4d5755, .35, { metalness: .18 });
  const glass = mat(0x9bc9c7, .16, { transparent: true, opacity: .42, side: THREE.DoubleSide });
  box(leaf, ENTRY.width - .1, ENTRY.height - .12, .055, frame,
    (ENTRY.width - .1) / 2, (ENTRY.height - .12) / 2, 0);
  box(leaf, ENTRY.width - .2, ENTRY.height - .38, .018, glass,
    (ENTRY.width - .1) / 2, (ENTRY.height - .12) / 2, .038);
  box(leaf, .035, .12, .035, mat(0xd4b04d, .3, { metalness: .55 }), ENTRY.width - .24, 1.02, .065);
  wallGroup.add(leaf);
  const door = {
    group: leaf,
    hingeX,
    hingeZ: z,
    width: ENTRY.width - .1,
    closedRotation: 0,
    openRotation: rotation,
    targetRotation: rotation
  };
  leaf.userData.walkInteraction = 'door';
  leaf.userData.walkDoor = door;
  walkDoors.push(door);
}
function buildWindows() {
  const glass = mat(0x9bc9c7, .14, {
    transparent: true, opacity: .34, metalness: .1, side: THREE.DoubleSide, depthWrite: false
  });
  const frame = mat(0x424e4d, .3, { metalness: .28 });

  // Four framed panes on the short end beside Bogdan, Ilya and Nikita's desks.
  const glassStart = -2.4;
  const glassSpan = 4.8;
  const glassBay = glassSpan / 4;
  for (let index = 0; index < 4; index++) {
    const x = glassStart + glassBay * (index + .5);
    box(windowGroup, glassBay - .04, 1.62, .025, glass, x, 1.65, HALF_L - .11);
  }
  for (let index = 0; index <= 4; index++) {
    const x = glassStart + glassBay * index;
    box(windowGroup, .055, 1.72, .055, frame, x, 1.65, HALF_L - .045);
  }
  for (const y of [.84, .92, 2.38, 2.46]) {
    box(windowGroup, glassSpan, .055, .055, frame,
      glassStart + glassSpan / 2, y, HALF_L - .07);
  }
}
function buildColumns() {
  for (const [x, z] of [[-.12, -2.75], [-.18, 2.18]]) {
    const column = new THREE.Group(); column.position.set(x, 0, z); columnGroup.add(column);
    box(column, .38, 2.72, .42, mat(0x292c2e, .9), 0, 1.36, 0);
    box(column, .46, .1, .5, mat(0x252729), 0, .05, 0);
    box(column, .46, .08, .5, mat(0x383b3d), 0, 2.72, 0);
    for (const y of [.72, 1.43, 2.14]) {
      box(column, .006, .008, .424, mat(0x484b4d), -.194, y, 0);
      box(column, .006, .008, .424, mat(0x484b4d), .194, y, 0);
    }
    obstacles.push({ x, z, width: .46, depth: .5, rot: 0 });
  }
}
function buildArchitecturalDetails() {
  const concrete = mat(0xaaa18f, .96);
  const charcoal = mat(0x202426, .9);
  const seam = mat(0x797568, .92);
  for (const side of [-1, 1]) {
    const x = side * (HALF_W - .008);
    const wallRuns = [[-HALF_L + .09, HALF_L - .09]];
    for (const [start, end] of wallRuns) {
      box(wallGroup, .015, 2.02, end - start, concrete, x, 1.16, (start + end) / 2);
    }
    box(wallGroup, .018, .64, ROOM.length - .18, charcoal, x, 2.48, 0);
    for (let index = 0; index < 7; index++) {
      const z = -HALF_L + .18 + index * 1.32;
      box(wallGroup, .019, 2.02, .012, seam, x, 1.16, z);
    }
  }

  // Dark upper wall band around the entrance and glazing, matching the photographed finish.
  box(wallGroup, ROOM.width - .28, .62, .018, charcoal, 0, 2.49, -HALF_L + .085);
  box(wallGroup, ROOM.width - .4, .32, .018, charcoal, 0, 2.63, HALF_L - .075);

  const sidelightFrame = mat(0x292f31, .34, { metalness: .22 });
  const sidelightGlass = mat(0xc6d6d1, .2, { transparent: true, opacity: .58, side: THREE.DoubleSide });
  const sidelightX = ENTRY.centerX + ENTRY.width / 2 + .2;
  const insideDoorZ = -HALF_L + .11;
  box(wallGroup, .27, 2.02, .055, sidelightFrame, sidelightX, 1.05, insideDoorZ);
  box(wallGroup, .21, 1.9, .012, sidelightGlass, sidelightX, 1.05, insideDoorZ + .035);
  box(wallGroup, .018, 2.0, .065, sidelightFrame, sidelightX - .145, 1.05, insideDoorZ);
  box(wallGroup, .018, 2.0, .065, sidelightFrame, sidelightX + .145, 1.05, insideDoorZ);

  // Electrical enclosure, surface conduit, and switch beside the entrance.
  const enclosure = mat(0xd0d0c8, .62);
  box(wallGroup, .34, .5, .11, enclosure, sidelightX + .46, 1.68, insideDoorZ + .08);
  box(wallGroup, .23, .36, .012, mat(0xb7bab3), sidelightX + .46, 1.68, insideDoorZ + .142);
  box(wallGroup, .018, .72, .018, charcoal, sidelightX + .24, 1.18, insideDoorZ + .07);
  box(wallGroup, .11, .12, .035, mat(0xe3e0d6), sidelightX + .46, .83, insideDoorZ + .085);
  box(wallGroup, .035, .035, .012, mat(0x70b98a, .25, { emissive: 0x1c5530, emissiveIntensity: .45 }),
    sidelightX + .46, 1.84, insideDoorZ + .15);

  // The ceiling stays out of the planning view and appears while walking in first person.
  walkCeiling = new THREE.Group();
  walkCeiling.name = 'Ceiling, lights and ventilation';
  walkCeiling.visible = false;
  roomGroup.add(walkCeiling);

  const beam = mat(0x101314, .76, { metalness: .24 });
  for (const x of [-1.65, 0, 1.65]) {
    box(walkCeiling, .08, .08, ROOM.length, beam, x, ROOM.wallHeight - .12, 0);
  }
  const lampHousing = mat(0x343a3c, .48, { metalness: .28 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd98d, emissiveIntensity: 1.3, roughness: .3 });
  const lampPositions = [-1.2, 1.2, 3.6];
  for (const rowX of [-1.53, 1.53]) {
    for (const z of lampPositions) {
      box(walkCeiling, .96, .075, .12, lampHousing, rowX, ROOM.wallHeight - .17, z);
      box(walkCeiling, .82, .018, .075, lamp, rowX, ROOM.wallHeight - .211, z);
    }
  }

  // A small wall speaker and access panel echo the fixtures visible in the photo.
  const speaker = mat(0xe3e1d9, .68);
  box(wallGroup, .22, .3, .12, speaker, -HALF_W + .09, 2.37, -.8);
  box(wallGroup, .13, .055, .012, mat(0x5c6260), -HALF_W + .09, 2.37, -.73);
}
function buildZoneOverlay() {
  const work = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width - .16, ROOM.length - .16),
  new THREE.MeshBasicMaterial({ color: 0xe6b82e, transparent: true, opacity: .085, side: THREE.DoubleSide, depthWrite: false }));
  work.rotation.x = -Math.PI / 2; work.position.set(0, .006, 0); zoneGroup.add(work);
}
function buildYuraWallShelf() {
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'Yura wall shelf';
  roomGroup.add(shelfGroup);
  const yura = startSeats.find(seat => seat.id === 's3');
  const shelfDepth = .47;
  const shelfLength = 1.38;
  const wallX = -HALF_W;
  const shelfTop = 1.82;
  const shelfZ = yura.z;
  const shelfX = wallX + shelfDepth / 2;
  const wood = mat(0x70533c, .63);
  const woodEdge = mat(0x9a744f, .54);
  const bracketMetal = mat(0x454947, .34, { metalness: .48 });

  // The shelf projects from the long wall above the left-hand workstation row.
  box(shelfGroup, shelfDepth, .055, shelfLength, wood, shelfX, shelfTop - .028, shelfZ);
  box(shelfGroup, shelfDepth, .018, .035, woodEdge, shelfX, shelfTop - .064, shelfZ - shelfLength / 2 + .018);
  box(shelfGroup, shelfDepth, .018, .035, woodEdge, shelfX, shelfTop - .064, shelfZ + shelfLength / 2 - .018);

  for (const supportZ of [shelfZ - .49, shelfZ + .49]) {
    box(shelfGroup, .035, .26, .035, bracketMetal, wallX + .025, shelfTop - .17, supportZ);
    box(shelfGroup, shelfDepth - .06, .035, .035, bracketMetal,
      wallX + (shelfDepth - .06) / 2, shelfTop - .17, supportZ);
    const braceLength = shelfDepth - .12;
    const brace = box(shelfGroup, braceLength, .026, .026, bracketMetal,
      wallX + braceLength / 2, shelfTop - .235, supportZ);
    brace.rotation.z = .29;
    const screw = cylinder(shelfGroup, .012, .012, .012, woodEdge, wallX + .045, shelfTop - .13, supportZ, 12);
    screw.rotation.z = Math.PI / 2;
  }

  makePottedCactus(shelfGroup, shelfX - .055, shelfTop, shelfZ + .43);
  makeBlackHole(shelfGroup, shelfX + .07, shelfTop + .10, shelfZ - .36);
}
function makePottedCactus(parent, x, shelfTop, z) {
  const plant = new THREE.Group();
  plant.position.set(x, shelfTop, z);
  parent.add(plant);

  const terracotta = mat(0xb9633d, .54);
  const terracottaRim = mat(0xe09362, .42);
  const soil = mat(0x332b24, 1);
  const cactusGreen = mat(0x2e7547, .78);
  const cactusLight = mat(0x4d9860, .72);
  const spine = mat(0xf2dfb5, .72);

  cylinder(plant, .064, .048, .09, terracotta, 0, .045, 0, 24);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.061, .006, 8, 32), terracottaRim);
  rim.position.y = .087;
  plant.add(rim);
  cylinder(plant, .055, .055, .009, soil, 0, .088, 0, 24);

  cylinder(plant, .034, .042, .15, cactusGreen, 0, .167, 0, 20);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(.034, 20, 14), cactusGreen);
  crown.position.set(0, .242, 0);
  plant.add(crown);

  for (const direction of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(direction * .03, .15, 0);
    arm.rotation.z = -direction * .38;
    cylinder(arm, .018, .02, .065, cactusLight, 0, .032, 0, 12);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.018, 12, 10), cactusLight);
    tip.position.y = .066;
    arm.add(tip);
    cylinder(arm, .012, .012, .043, cactusLight, direction * .014, .078, 0, 10);
    const armTip = new THREE.Mesh(new THREE.SphereGeometry(.012, 12, 10), cactusLight);
    armTip.position.set(direction * .014, .1, 0);
    arm.add(armTip);
    plant.add(arm);
  }

  for (let row = 0; row < 4; row++) {
    const y = .12 + row * .034;
    const around = row % 2 ? 5 : 4;
    for (let index = 0; index < around; index++) {
      const angle = index / around * Math.PI * 2 + row * .17;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.0032, 6, 5), spine);
      dot.position.set(Math.cos(angle) * .039, y, Math.sin(angle) * .039);
      plant.add(dot);
    }
  }
}
function makeBlackHole(parent, x, shelfTop, z) {
  const accretionDiskRadius = .38;
  const feature = new THREE.Group();
  feature.position.set(x, shelfTop, z);
  parent.add(feature);

  const eventHorizon = new THREE.Mesh(
    new THREE.SphereGeometry(.111, 56, 40),
    new THREE.MeshBasicMaterial({ color: 0x020108, toneMapped: false })
  );
  eventHorizon.position.y = .014;
  feature.add(eventHorizon);

  const photonRing = new THREE.Mesh(
    new THREE.TorusGeometry(.117, .006, 10, 112),
    new THREE.MeshBasicMaterial({ color: 0xffdfa7, toneMapped: false })
  );
  photonRing.rotation.x = Math.PI / 2;
  photonRing.position.y = .016;
  feature.add(photonRing);

  const lensingArc = new THREE.Mesh(
    new THREE.TorusGeometry(.132, .0022, 8, 112, Math.PI * .72),
    new THREE.MeshBasicMaterial({
      color: 0x9ea9ff, transparent: true, opacity: .7, toneMapped: false,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  lensingArc.rotation.y = -.24;
  lensingArc.position.y = .02;
  feature.add(lensingArc);

  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createRadialGradient(256, 256, 30, 256, 256, 256);
  gradient.addColorStop(0, 'rgba(5, 2, 14, 0)');
  gradient.addColorStop(.27, 'rgba(8, 4, 20, 0)');
  gradient.addColorStop(.295, 'rgba(82, 74, 185, .28)');
  gradient.addColorStop(.31, 'rgba(159, 183, 255, .9)');
  gradient.addColorStop(.33, 'rgba(255, 250, 226, 1)');
  gradient.addColorStop(.35, 'rgba(255, 207, 126, .98)');
  gradient.addColorStop(.4, 'rgba(245, 112, 47, .9)');
  gradient.addColorStop(.52, 'rgba(173, 44, 30, .64)');
  gradient.addColorStop(.76, 'rgba(79, 20, 38, .32)');
  gradient.addColorStop(1, 'rgba(20, 6, 28, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  // Uneven, Doppler-brightened filaments keep the disc from looking like a flat ring.
  context.save();
  context.translate(256, 256);
  for (let index = 0; index < 44; index++) {
    const angle = index * 2.399963;
    const radius = 80 + (index % 13) * 11.2;
    const arcLength = .08 + (index % 5) * .035;
    const brightSide = Math.cos(angle - .45) > .52;
    const hue = brightSide ? '255, 226, 178' : '255, 105, 48';
    context.beginPath();
    context.arc(0, 0, radius, angle, angle + arcLength);
    context.strokeStyle = `rgba(${hue}, ${brightSide ? .66 : .38})`;
    context.lineWidth = 1.2 + (index % 4) * .55;
    context.shadowColor = brightSide ? '#fff0ce' : '#ff652d';
    context.shadowBlur = brightSide ? 9 : 5;
    context.stroke();
  }
  context.restore();

  const brightLobe = context.createRadialGradient(385, 132, 2, 385, 132, 72);
  brightLobe.addColorStop(0, 'rgba(255, 245, 219, .54)');
  brightLobe.addColorStop(.42, 'rgba(255, 170, 91, .23)');
  brightLobe.addColorStop(1, 'rgba(255, 91, 45, 0)');
  context.fillStyle = brightLobe;
  context.fillRect(313, 60, 144, 144);

  const accretionTexture = new THREE.CanvasTexture(textureCanvas);
  accretionTexture.colorSpace = THREE.SRGBColorSpace;

  blackHoleDisk = new THREE.Group();
  blackHoleDisk.position.y = .014;
  feature.add(blackHoleDisk);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(accretionDiskRadius, 160),
    new THREE.MeshBasicMaterial({
      map: accretionTexture, transparent: true, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = -.001;
  blackHoleDisk.add(disc);

  const arcColors = [0xffcf7d, 0xff7a3b, 0xffe6c6, 0x91a9ff];
  const arcs = [
    { radius: .118, angle: .78, phase: .25 },
    { radius: .17, angle: .52, phase: 2.2 },
    { radius: .23, angle: .7, phase: 4.5 },
    { radius: .29, angle: .44, phase: 1.25 },
    { radius: .35, angle: .37, phase: 3.5 }
  ];
  arcs.forEach((arc, index) => {
    const segment = new THREE.Mesh(
      new THREE.TorusGeometry(arc.radius, index === 0 ? .0035 : .0022, 7, 72, arc.angle),
      new THREE.MeshBasicMaterial({
        color: arcColors[index], transparent: true, opacity: index === 0 ? .82 : .56,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
      })
    );
    segment.rotation.x = Math.PI / 2;
    segment.rotation.z = arc.phase;
    segment.position.y = index % 2 ? .003 : -.002;
    blackHoleDisk.add(segment);
  });
}
function makeWorkstation(seat) { return furnitureFactory.makeWorkstation(seat); }
function makeBoard() {
  const board = furnitureFactory.makeBoard();
  boardRoot = furnitureFactory.getBoardRoot();
  boardSurface = furnitureFactory.getBoardSurface();
  boardMarkerTray = furnitureFactory.getBoardMarkerTray();
  boardDrawings = furnitureFactory.getBoardDrawings();
  return board;
}
function createBoardStrokeMesh(parent, points, color) {
  return furnitureFactory.createBoardStrokeMesh(parent, points, color);
}
function makeCabinet() { return furnitureFactory.makeCabinet(); }
function makeCart() { return furnitureFactory.makeCart(); }
function rebuildMovables() {
  clearObjectHighlight();
  for (const [key, item] of movable) {
    if (item.kind === 'kitchen') {
      item.data = state.kitchenObjects[item.id] || item.data;
      state.kitchenObjects[item.id] = item.data;
      item.group.position.set(item.data.x, 0, item.data.z - KITCHEN_Z_OFFSET);
      item.group.rotation.y = item.data.rot || 0;
      continue;
    }
    item.group.parent?.remove(item.group);
    disposeObject(item.group);
    movable.delete(key);
  }
  makeBoard();
  makeCabinet();
  makeCart();
  state.seats.forEach(makeWorkstation);
  if (selectedKey && movable.has(selectedKey)) setHoveredObject(selectedKey);
}
function makeDimensionLabel(text) {
  const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 96;
  const context = canvas.getContext('2d'); context.fillStyle = '#fffdf5'; context.roundRect(4, 4, 376, 88, 20); context.fill();
  context.strokeStyle = '#d8b24a'; context.lineWidth = 3; context.stroke();
  context.fillStyle = '#72520b'; context.font = 'bold 40px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(text, 192, 48);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(.76, .19, 1); return sprite;
}
function getFootprint(item) {
  if (item.footprint) return item.footprint;

  item.group.updateMatrixWorld(true);
  const inverseRoot = item.group.matrixWorld.clone().invert();
  const relativeBounds = new THREE.Box3();
  const relativeMatrix = new THREE.Matrix4();
  const point = new THREE.Vector3();

  item.group.traverse(object => {
    if (!object.isMesh || object.userData.excludeFromFootprint || !object.geometry) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    if (!object.geometry.boundingBox) return;

    relativeMatrix.multiplyMatrices(inverseRoot, object.matrixWorld);
    const { min, max } = object.geometry.boundingBox;
    for (const x of [min.x, max.x]) {
      for (const y of [min.y, max.y]) {
        for (const z of [min.z, max.z]) {
          relativeBounds.expandByPoint(point.set(x, y, z).applyMatrix4(relativeMatrix));
        }
      }
    }
  });

  if (relativeBounds.isEmpty()) {
    item.footprint = {
      width: item.width,
      depth: item.depth,
      localX: item.localX || 0,
      localZ: item.localZ || 0
    };
    return item.footprint;
  }

  item.footprint = {
    width: relativeBounds.max.x - relativeBounds.min.x,
    depth: relativeBounds.max.z - relativeBounds.min.z,
    localX: (relativeBounds.min.x + relativeBounds.max.x) / 2,
    localZ: (relativeBounds.min.z + relativeBounds.max.z) / 2
  };
  return item.footprint;
}
function updateDimensions() {
  if (dimensionGroup?.parent) dimensionGroup.parent.remove(dimensionGroup);
  if (dimensionGroup) disposeObject(dimensionGroup);
  dimensionGroup = new THREE.Group();
  if (!state.showDimensions || !selectedKey || !movable.has(selectedKey)) return;
  const item = movable.get(selectedKey), footprint = getFootprint(item);
  const { width, depth, localX, localZ } = footprint;
  const left = localX - width / 2, right = localX + width / 2;
  const near = localZ + depth / 2, far = localZ - depth / 2, offset = .26;
  const y = .045, color = 0xb58b18;
  addLine(dimensionGroup, [new THREE.Vector3(left, y, near), new THREE.Vector3(right, y, near)], color);
  addLine(dimensionGroup, [new THREE.Vector3(left, y, near), new THREE.Vector3(left, y, near + offset)], color);
  addLine(dimensionGroup, [new THREE.Vector3(right, y, near), new THREE.Vector3(right, y, near + offset)], color);
  addLine(dimensionGroup, [new THREE.Vector3(right + offset, y, far), new THREE.Vector3(right + offset, y, near)], color);
  addLine(dimensionGroup, [new THREE.Vector3(right, y, far), new THREE.Vector3(right + offset, y, far)], color);
  addLine(dimensionGroup, [new THREE.Vector3(right, y, near), new THREE.Vector3(right + offset, y, near)], color);
  const wLabel = makeDimensionLabel(`${width.toFixed(2)} ${t('m')}`);
  wLabel.position.set(localX, .11, near + offset + .08); dimensionGroup.add(wLabel);
  const dLabel = makeDimensionLabel(`${depth.toFixed(2)} ${t('m')}`);
  dLabel.position.set(right + offset + .11, .11, localZ); dimensionGroup.add(dLabel);
  movable.get(selectedKey).group.add(dimensionGroup);
}
function rectFor(item) {
  const footprint = getFootprint(item);
  const rotation = item.data.rot || 0, cos = Math.cos(rotation), sin = Math.sin(rotation);
  return {
    x: item.data.x + cos * footprint.localX + sin * footprint.localZ,
    z: item.data.z - sin * footprint.localX + cos * footprint.localZ,
    width: footprint.width, depth: footprint.depth, rotation
  };
}
function corners(rect) {
  const cos = Math.cos(rect.rotation), sin = Math.sin(rect.rotation);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => ({
    x: rect.x + cos * sx * rect.width / 2 + sin * sz * rect.depth / 2,
    z: rect.z - sin * sx * rect.width / 2 + cos * sz * rect.depth / 2
  }));
}
function overlaps(a, b) {
  for (const angle of [a.rotation, a.rotation + Math.PI / 2, b.rotation, b.rotation + Math.PI / 2]) {
    const axis = { x: Math.cos(angle), z: Math.sin(angle) };
    const project = rect => corners(rect).map(point => point.x * axis.x + point.z * axis.z);
    const pa = project(a), pb = project(b);
    if (Math.max(...pa) <= Math.min(...pb) + .015 || Math.max(...pb) <= Math.min(...pa) + .015) return false;
  }
  return true;
}
function outOfBounds(rect, item) {
  if (item.kind === 'kitchen') {
    return corners(rect).some(point =>
      point.x < KITCHEN_WORLD_LEFT - .025 || point.x > KITCHEN_RIGHT + .025
        || point.z < -HALF_L - .025 || point.z > KITCHEN_WORLD_TOP + .025
    );
  }
  return corners(rect).some(point => Math.abs(point.x) > HALF_W + .025 || Math.abs(point.z) > HALF_L + .025);
}
function collisionKey(item) {
  return item.kind === 'seat' ? seatKey(item.data.id) : item.key || item.kind;
}
function drawFootprint(parent, rect, color, opacity = .09) {
  const pts = corners(rect).map(point => new THREE.Vector3(point.x, .03, point.z));
  pts.push(pts[0]); addLine(parent, pts, color, .85);
  const shape = new THREE.Shape();
  const points = corners(rect); shape.moveTo(points[0].x, points[0].z);
  points.slice(1).forEach(point => shape.lineTo(point.x, point.z)); shape.closePath();
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false
  }));
  fill.rotation.x = -Math.PI / 2; fill.position.y = .025; parent.add(fill);
}
function updateCollisions() {
  if (!collisionGroup) return;
  collisionGroup.children.forEach(disposeObject);
  collisionGroup.clear(); if (!state.showCollisions) return;
  const items = [...movable.values()].map(item => ({ item, rect: rectFor(item) }));
  const conflicted = new Set();
  items.forEach(({ item, rect }) => {
    if (outOfBounds(rect, item)) conflicted.add(collisionKey(item));
  });
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    if (!overlaps(items[i].rect, items[j].rect)) continue;
    conflicted.add(collisionKey(items[i].item));
    conflicted.add(collisionKey(items[j].item));
  }
  const conflictedObstacles = new Set();
  obstacles.forEach((obstacle, obstacleIndex) => {
    const obstacleRect = { ...obstacle, rotation: obstacle.rot || 0 };
    items.forEach(({ item, rect }) => {
      if (!overlaps(rect, obstacleRect)) return;
      conflicted.add(collisionKey(item));
      conflictedObstacles.add(obstacleIndex);
    });
  });
  items.forEach(({ item, rect }) => {
    const key = collisionKey(item);
    const color = conflicted.has(key) ? 0xd84d3d : 0xe0ac24;
    drawFootprint(collisionGroup, rect, color, conflicted.has(key) ? .16 : .07);
  });
  obstacles.forEach((obstacle, index) => {
    const color = conflictedObstacles.has(index) ? 0xd84d3d : 0x8e8b81;
    drawFootprint(collisionGroup, { ...obstacle, rotation: obstacle.rot || 0 }, color,
      conflictedObstacles.has(index) ? .16 : .05);
  });
}
function refreshLayers() {
  if (!scene) return;
  wallGroup.visible = state.showWalls;
  windowGroup.visible = state.showWalls;
  zoneGroup.visible = state.showZones;
  scene.background.set(state.theme === 'dark' ? 0x20211f : 0xe9eaeb);
  updateDimensions(); updateCollisions(); updateMiniPlan();
}
function setView(view) {
  if (walkingMode) exitWalkMode();
  controls.enabled = true;
  cancelAnimationFrame(cameraMoveFrame);
  const target = new THREE.Vector3(SITE_CENTER_X, .2, SITE_CENTER_Z);
  const offset = camera.position.clone().sub(controls.target);
  const distance = offset.length();
  const directions = {
    top: new THREE.Vector3(0, 1, .001), bottom: new THREE.Vector3(0, -1, .001),
    north: new THREE.Vector3(0, .42, -1), south: new THREE.Vector3(0, .42, 1),
    east: new THREE.Vector3(1, .42, 0), west: new THREE.Vector3(-1, .42, 0),
    front: new THREE.Vector3(0, .42, 1), orbit: new THREE.Vector3(8.8, 16.2, 10.8)
  };
  const corner = view.match(/^corner-(top|bottom)-(north|south)-(west|east)$/);
  if (corner) {
    directions[view] = new THREE.Vector3(
      corner[3] === 'east' ? 1 : -1,
      corner[1] === 'top' ? 1 : -1,
      corner[2] === 'south' ? 1 : -1
    );
  }
  const destination = (directions[view] || directions.orbit).clone().normalize().multiplyScalar(distance).add(target);
  const origin = camera.position.clone();
  const originQuaternion = camera.quaternion.clone();
  const destinationCamera = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
  destinationCamera.position.copy(destination);
  destinationCamera.lookAt(target);
  targetCameraQuaternion = destinationCamera.quaternion.clone();
  controls.target.copy(target);
  const started = performance.now();
  const duration = 900;
  const animateCamera = now => {
    const progress = Math.min((now - started) / duration, 1);
    const eased = progress < .5 ? 8 * progress ** 4 : 1 - ((-2 * progress + 2) ** 4) / 2;
    camera.position.lerpVectors(origin, destination, eased);
    camera.quaternion.slerpQuaternions(originQuaternion, targetCameraQuaternion, eased);
    controls.update();
    syncViewCube();
    if (progress < 1) cameraMoveFrame = requestAnimationFrame(animateCamera);
  };
  cameraMoveFrame = requestAnimationFrame(animateCamera);
  app.querySelectorAll('[data-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.view === (view === 'top' ? 'top' : view === 'front' ? 'front' : 'orbit'));
  });
}
function syncViewCube() {
  const cube = app.querySelector('.cube-orientation');
  if (!cube || !camera || !controls) return;
  const inverseCamera = camera.quaternion.clone().invert();
  const matrix = new THREE.Matrix4().makeRotationFromQuaternion(inverseCamera);
  cube.style.transform = `matrix3d(${matrix.elements.join(',')})`;
}
function zoom(factor) {
  camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);
}
function floorPoint(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), point);
  return point;
}
function pointerDown(event) {
  if (walkingMode) {
    event.preventDefault();
    if (event.pointerType === 'touch') {
      walkTouchLook = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
      return;
    }
    if (event.button === 0) {
      setWalkPointer(event);
      beginBoardStroke();
    }
    return;
  }
  if (event.button !== 0) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const roots = [...movable.values()].map(item => item.group);
  const hit = raycaster.intersectObjects(roots, true)[0];
  if (!hit) {
    selectedKey = null;
    renderAfterPointer = true;
    setHoveredObject(null);
    return;
  }
  let root = hit.object;
  while (root && !root.userData.moveKey) root = root.parent;
  if (!root) return;
  selectedKey = root.userData.moveKey;
  const item = movable.get(selectedKey), point = floorPoint(event);
  dragging = { key: selectedKey, dx: item.data.x - point.x, dz: item.data.z - point.z, moved: false };
  renderAfterPointer = true;
  renderer.domElement.style.cursor = 'grabbing';
  controls.enabled = false;
  setHoveredObject(selectedKey);
}
function pointerMove(event) {
  if (walkingMode) {
    if (event.pointerType === 'touch') {
      updateWalkTouchLook(event);
      if (mobileDrawHeld) updateBoardStroke();
      return;
    }
    setWalkPointer(event);
    updateBoardStroke();
    return;
  }
  if (!dragging) {
    updateHoveredObject(event);
    return;
  }
  const point = floorPoint(event), item = movable.get(dragging.key);
  if (!item) return;
  if (item.kind === 'kitchen') {
    const rotation = item.data.rot || 0;
    const cosine = Math.abs(Math.cos(rotation));
    const sine = Math.abs(Math.sin(rotation));
    const halfX = (cosine * item.width + sine * item.depth) / 2;
    const halfZ = (sine * item.width + cosine * item.depth) / 2;
    item.data.x = THREE.MathUtils.clamp(
      point.x + dragging.dx,
      KITCHEN_WORLD_LEFT + halfX,
      KITCHEN_RIGHT - halfX
    );
    item.data.z = THREE.MathUtils.clamp(
      point.z + dragging.dz,
      -HALF_L + halfZ,
      KITCHEN_WORLD_TOP - halfZ
    );
    item.group.position.set(item.data.x, 0, item.data.z - KITCHEN_Z_OFFSET);
  } else {
    const limitX = HALF_W - (item.kind === 'seat' ? .7 : item.kind === 'cabinet' ? .38 : item.kind === 'cart' ? .42 : .6);
    const limitZ = HALF_L - (item.kind === 'seat' ? .6 : item.kind === 'cabinet' ? .34 : item.kind === 'cart' ? .52 : .1);
    item.data.x = THREE.MathUtils.clamp(point.x + dragging.dx, -limitX, limitX);
    item.data.z = THREE.MathUtils.clamp(point.z + dragging.dz, -limitZ, limitZ);
    item.group.position.set(item.data.x, 0, item.data.z);
  }
  dragging.moved = true;
  updateDimensions(); updateCollisions(); updateMiniPlan();
}
function pointerUp(event) {
  if (walkingMode) {
    if (event?.pointerType === 'touch') {
      if (walkTouchLook?.pointerId === event.pointerId) walkTouchLook = null;
      return;
    }
    finishBoardStroke();
    return;
  }
  if (dragging?.moved) saveState();
  if (!dragging && !renderAfterPointer) return;
  dragging = null;
  controls.enabled = true;
  renderer.domElement.style.cursor = hoveredKey ? 'pointer' : 'grab';
  if (renderAfterPointer) {
    renderAfterPointer = false;
    render();
    setHoveredObject(selectedKey);
  }
}
function updateHoveredObject(event) {
  if (!renderer || !raycaster || !pointer) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const roots = [...movable.values()].map(item => item.group);
  const hit = raycaster.intersectObjects(roots, true)[0];
  let root = hit?.object;
  while (root && !root.userData.moveKey) root = root.parent;
  const key = root?.userData.moveKey || null;
  setHoveredObject(key);
  renderer.domElement.style.cursor = key ? 'pointer' : 'grab';
}
function setHoveredObject(key) {
  const effectiveKey = key || selectedKey;
  if (hoveredKey === effectiveKey) return;
  clearObjectHighlight();
  hoveredKey = effectiveKey;
  const item = effectiveKey ? movable.get(effectiveKey) : null;
  const target = item?.group || (effectiveKey === 'kitchen' ? kitchenGroup : null);
  if (!target) return;
  target.traverse(mesh => {
    if (!mesh.isMesh || !mesh.material) return;
    const original = mesh.material;
    const highlighted = (Array.isArray(original) ? original : [original]).map(material => {
      const clone = material.clone();
      if (clone.emissive) {
        clone.emissive.set(0xe5af20);
        clone.emissiveIntensity = .72;
      }
      if (clone.color) clone.color.lerp(new THREE.Color(0xffd84d), .18);
      return clone;
    });
    mesh.material = Array.isArray(original) ? highlighted : highlighted[0];
    hoverMaterialBackups.push({ mesh, original, highlighted });
  });
}
function clearObjectHighlight() {
  hoverMaterialBackups.forEach(({ mesh, original, highlighted }) => {
    mesh.material = original;
    (Array.isArray(highlighted) ? highlighted : [highlighted]).forEach(material => material.dispose());
  });
  hoverMaterialBackups = [];
  hoveredKey = null;
}
function updateMiniPlan() {
  const plan = app.querySelector('.mini-plan'); if (!plan) return;
  plan.innerHTML = `<i class="mini-window"></i><i class="mini-door"></i>${miniObstacleMarks()}${miniObjectMarks()}${miniSeatMarks()}`;
}
function bindSidebarResizer() {
  const layout = app.querySelector('.editor-layout');
  const resizer = app.querySelector('.sidebar-resizer');
  if (!layout || !resizer) return;
  let pointerId = null;
  resizer.onpointerdown = event => {
    if (event.button !== 0) return;
    pointerId = event.pointerId;
    resizer.setPointerCapture(pointerId);
    document.body.classList.add('resizing-sidebar');
    event.preventDefault();
  };
  resizer.onpointermove = event => {
    if (pointerId !== event.pointerId) return;
    const bounds = layout.getBoundingClientRect();
    const maxWidth = Math.max(190, Math.min(560, bounds.width - 500));
    const width = THREE.MathUtils.clamp(event.clientX - bounds.left, 190, maxWidth);
    layout.style.setProperty('--sidebar-width', `${width}px`);
    resizeScene();
  };
  const finishResize = event => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    document.body.classList.remove('resizing-sidebar');
    localStorage.setItem('room-sidebar-width', layout.style.getPropertyValue('--sidebar-width'));
  };
  resizer.onpointerup = finishResize;
  resizer.onpointercancel = finishResize;
  const savedWidth = localStorage.getItem('room-sidebar-width');
  if (savedWidth) layout.style.setProperty('--sidebar-width', savedWidth);
}
function resizeScene() {
  const host = document.querySelector('#scene'); if (!host || !renderer) return;
  camera.aspect = host.clientWidth / host.clientHeight;
  camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight);
}
function animate() {
  requestAnimationFrame(animate);
  updateWalkMovement(performance.now());
  if (blackHoleDisk) blackHoleDisk.rotation.y += .006;
  if (!walkingMode) {
    controls.update();
    syncViewCube();
  }
  renderer.render(scene, camera);
}

render();
