import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import './style.css';

const ROOM = { width: 5.76, length: 8.395, wallHeight: 2.8 };
const HALF_W = ROOM.width / 2;
const HALF_L = ROOM.length / 2;
const ENTRY = { width: 1.25, centerX: 1.25, height: 2.2 };
const dictionaries = {
  ru: {
    office: 'План офиса', project: 'Проект помещения', hierarchy: 'СТРУКТУРА ПРОЕКТА',
    room: 'Помещение', shell: 'Конструкции', walls: 'Стены', windows: 'Окна', columns: 'Колонны',
    furniture: 'Мебель', seats: 'Рабочие места', board: 'Интерактивная доска', cabinet: 'Шкаф', cart: 'Тележка с сервером',
    toolbar: 'УПРАВЛЕНИЕ СЦЕНОЙ', add: 'Добавить место', save: 'Сохранить', reset: 'Сбросить',
    openModel: 'Открыть 3D-файл', removeModel: 'Закрыть файл', modelLoaded: 'Файл загружен', modelError: 'Не удалось открыть этот файл',
    view: 'Вид', top: 'Сверху', front: 'Спереди', orbit: '3D', rotate: 'Поворот',
    walk: 'Прогулка от первого лица', walkHint: 'W A S D — движение · мышь — осмотр · Esc — выйти',
    wallsToggle: 'Стены и окна', dimensions: 'Габариты', collisions: 'Коллизии', zones: 'Рабочая зона',
    workZone: 'Рабочая зона', settings: 'Настройки', properties: 'СВОЙСТВА',
    selection: 'Выбранный объект', none: 'Выберите объект в дереве или сцене', employee: 'Сотрудник',
    placeholder: 'Имя сотрудника', location: 'Расположение', x: 'X', z: 'Z', remove: 'Удалить место',
    area: 'Площадь', desks: 'Мест', empty: 'Свободное место', settingsTitle: 'Настройки приложения',
    appearance: 'Оформление', light: 'Светлая', dark: 'Тёмная', language: 'Язык', russian: 'Русский',
    english: 'English', close: 'Закрыть', saved: 'План сохранён', movable: 'ПОДВИЖНЫЙ ОБЪЕКТ',
    resetConfirm: 'Вернуть начальное расположение по чертежу?', local: 'Сохранение в этом браузере',
    roomDims: 'Размер помещения', totalArea: 'Общая площадь', objectDims: 'Габариты объекта', tableDims: 'Стол',
    newSeat: 'Новое место', rotateLeft: 'Повернуть влево', rotateRight: 'Повернуть вправо',
    compassTop: 'ВЕРХ', compassWcs: 'МСК', hotkeys: 'Горячие клавиши',
    hotkeyCamera: 'Повернуть камеру', hotkeyRotate: 'Поворот выбранного объекта на 15°',
    hotkeyMove: 'Перемещение выбранного объекта на 10 см', hotkeyDelete: 'Удалить выбранное рабочее место',
    hotkeyZoom: 'Приблизить или отдалить', hotkeyHome: 'Вернуть 3D-вид',
    hotkeySave: 'Сохранить план', hotkeyUndo: 'Отменить последнее изменение объектов',
    hotkeyRedo: 'Повторить отменённое изменение', hotkeyEscape: 'Закрыть настройки',
    hotkeyWalk: 'Ходить по сцене и осматриваться',
    sceneKeys: '← ↑ → ↓ камера · Ctrl+←/→ поворот · Shift+стрелки сдвиг · Del удалить',
    m: 'м', sqm: 'м²'
  },
  en: {
    office: 'Office plan', project: 'Room project', hierarchy: 'PROJECT TREE', room: 'Room', shell: 'Building shell',
    walls: 'Walls', windows: 'Windows', columns: 'Columns', furniture: 'Furniture', seats: 'Workspaces',
    board: 'Interactive board', cabinet: 'Cabinet', cart: 'Server trolley', toolbar: 'SCENE CONTROLS', add: 'Add workspace',
    openModel: 'Open 3D file', removeModel: 'Close file', modelLoaded: 'File loaded', modelError: 'Could not open this file',
    save: 'Save', reset: 'Reset', view: 'View', top: 'Top', front: 'Front', orbit: '3D', rotate: 'Rotate',
    walk: 'First-person walk', walkHint: 'W A S D — move · mouse — look · Esc — exit',
    wallsToggle: 'Walls and windows', dimensions: 'Dimensions', collisions: 'Collisions', zones: 'Work area',
    workZone: 'Work area', settings: 'Settings', properties: 'PROPERTIES',
    selection: 'Selected object', none: 'Select an object in the tree or scene', employee: 'Employee',
    placeholder: 'Employee name', location: 'Position', x: 'X', z: 'Z', remove: 'Remove workspace',
    area: 'Area', desks: 'Workspaces', empty: 'Available', settingsTitle: 'App settings', appearance: 'Appearance',
    light: 'Light', dark: 'Dark', language: 'Language', russian: 'Русский', english: 'English', close: 'Close',
    saved: 'Layout saved', movable: 'MOVABLE OBJECT', resetConfirm: 'Restore the original layout from the blueprint?',
    local: 'Saved in this browser', roomDims: 'Room dimensions', totalArea: 'Total area', objectDims: 'Object dimensions', tableDims: 'Desk',
    newSeat: 'New workspace', rotateLeft: 'Rotate left', rotateRight: 'Rotate right', compassTop: 'TOP',
    compassWcs: 'WCS', hotkeys: 'Keyboard shortcuts', hotkeyCamera: 'Orbit the camera',
    hotkeyRotate: 'Rotate selected object by 15°', hotkeyMove: 'Move selected object by 10 cm',
    hotkeyDelete: 'Delete selected workspace', hotkeyZoom: 'Zoom in or out', hotkeyHome: 'Return to 3D view',
    hotkeySave: 'Save the plan', hotkeyUndo: 'Undo the last object change',
    hotkeyRedo: 'Redo the undone change', hotkeyEscape: 'Close settings',
    hotkeyWalk: 'Walk around and look through the scene',
    sceneKeys: 'Arrows: orbit · Ctrl+←/→: rotate · Shift+arrows: move · Del: remove',
    m: 'm', sqm: 'm²'
  }
};
const startSeats = [
  { id: 's1', name: 'Сергей', x: -1.53, z: -1.1975, rot: 0, side: -1 },
  { id: 's2', name: 'Олег', x: 1.53, z: -1.1975, rot: 0, side: 1 },
  { id: 's3', name: 'Юра', x: -1.53, z: 1.2025, rot: 0, side: -1 },
  { id: 's4', name: 'Юля', x: 1.53, z: 1.2025, rot: 0, side: 1 },
  { id: 's5', name: 'Богдан', x: -1.53, z: 3.6025, rot: 0, side: -1 },
  { id: 's6', name: 'Никита', x: -.93, z: 3.6025, rot: 0, side: 1 },
  { id: 's7', name: 'Илья', x: .93, z: 3.6025, rot: 0, side: -1 },
  { id: 's8', name: 'Даша', x: 1.53, z: 3.6025, rot: 0, side: 1 }
].map(seat => ({ ...seat, zone: 'work' }));
const baseState = {
  seats: startSeats, board: { x: 0, z: .45, rot: 0 }, cabinet: { x: -.28, z: 1.63, rot: 0 },
  cart: { x: 1.85, z: -2.65, rot: -.18 }, language: 'ru', theme: 'light',
  showWalls: true, showDimensions: false, showCollisions: false, showZones: false, layoutVersion: 4
};
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('room-layout') || '{}');
    const savedSeats = saved.layoutVersion === 4 && Array.isArray(saved.seats)
      ? saved.seats
      : startSeats.map((seat, index) => ({ ...seat, name: saved.seats?.[index]?.name || seat.name }));
    const seats = savedSeats.map(seat => seat.name === 'Новый БИМщик' ? { ...seat, name: 'Олег' } : seat);
    if (seats.some((seat, index) => seat.name !== savedSeats[index].name)) {
      try {
        localStorage.setItem('room-layout', JSON.stringify({ ...saved, seats, layoutVersion: 4 }));
      } catch { /* Keep the migrated name in memory when storage is unavailable. */ }
    }
    return { ...baseState, ...saved, seats, layoutVersion: 4 };
  } catch { return structuredClone(baseState); }
}
let state = loadState();
const undoHistory = [];
const redoHistory = [];
const historyLimit = 100;
const serializeLayout = () => JSON.stringify({ seats: state.seats, board: state.board, cabinet: state.cabinet, cart: state.cart });
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
const walkKeys = new Set();
const walkDirection = new THREE.Vector3();
let walkPreviousTime = 0;
let hoverMaterialBackups = [];
let cameraMoveFrame = 0;
let targetCameraQuaternion = null;
const movable = new Map();
const obstacles = [];
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
  return `<details open>
    <summary><i>⌄</i>▣　${t('room')}</summary>
    <details open class="tree-nested">
      <summary><i>⌄</i>◫　${t('shell')}</summary>
      ${treeItem('walls', '▤', t('walls'))}
      ${treeItem('windows', '▦', t('windows'))}
      ${treeItem('columns', '▰', t('columns'), '2')}
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
function render() {
  document.documentElement.lang = state.language;
  document.body.dataset.theme = state.theme;
  const selected = getSelected();
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
      <div class="zoom-controls">
        <button id="zoomIn">＋</button><button id="zoomOut">−</button><button id="homeView">⌂</button>
      </div>
      ${compass()}
    </main>
    <aside class="properties">
      <div class="properties-heading">
        <div><small>${t('properties')}</small>
          <h2>${selectedKey === 'board' ? t('board') : selectedKey === 'cabinet' ? t('cabinet') : selectedKey === 'cart' ? t('cart') : selected ? escapeHtml(selected.name || t('empty')) : t('selection')}</h2>
        </div>
        <span>${selectedKey === 'board' ? '▭' : selectedKey === 'cabinet' || selectedKey === 'cart' ? '▰' : selected ? '▱' : '⌖'}</span>
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
    state.cabinet = { x: -.28, z: 1.63, rot: 0 };
    state.cart = { x: 1.85, z: -2.65, rot: -.18 };
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
  window.onkeydown = handleKeyboardShortcuts;
}
function rotateSelected(degrees) {
  const object = getSelected(); if (!object) return;
  object.rot = (object.rot || 0) + THREE.MathUtils.degToRad(degrees);
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
  dragging = null;
  renderAfterPointer = false;
  camera.rotation.order = 'YXZ';
  camera.position.set(ENTRY.centerX, 1.62, -HALF_L + .72);
  camera.rotation.set(0, Math.PI, 0, 'YXZ');
  controls.enabled = false;
  walkingMode = true;
  updateWalkToggle(true);
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
  document.body.classList.add('walking-mode');
  updateWalkToggle(true);
  app.querySelector('#walkHint')?.classList.add('visible');
}
function onWalkUnlock() {
  const wasWalking = walkingMode;
  walkingMode = false;
  walkKeys.clear();
  if (walkCeiling) walkCeiling.visible = false;
  document.body.classList.remove('walking-mode');
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
  if (!['w', 'a', 's', 'd'].includes(key)) return;
  walkKeys.add(key);
  event.preventDefault();
}
function handleWalkKeyUp(event) {
  walkKeys.delete(keyFromCode(event.code));
}
function keyFromCode(code) {
  return code.startsWith('Key') ? code.slice(3).toLowerCase() : code;
}
function walkPointBlocked(x, z) {
  const radius = .22;
  if (x < -HALF_W + radius || x > HALF_W - radius || z < -HALF_L + radius || z > HALF_L - radius) return true;
  const intersects = rect => {
    const dx = x - rect.x, dz = z - rect.z;
    const cosine = Math.cos(rect.rotation || 0), sine = Math.sin(rect.rotation || 0);
    const localX = cosine * dx - sine * dz;
    const localZ = sine * dx + cosine * dz;
    return Math.abs(localX) < rect.width / 2 + radius && Math.abs(localZ) < rect.depth / 2 + radius;
  };
  if (obstacles.some(obstacle => intersects({ ...obstacle, rotation: obstacle.rot || 0 }))) return true;
  return [...movable.values()].some(item => intersects(rectFor(item)));
}
function updateWalkMovement(now) {
  if (!walkingMode) return;
  const delta = Math.min((now - walkPreviousTime) / 1000, .05);
  walkPreviousTime = now;
  const forwardInput = Number(walkKeys.has('w')) - Number(walkKeys.has('s'));
  const rightInput = Number(walkKeys.has('d')) - Number(walkKeys.has('a'));
  if (!forwardInput && !rightInput) return;

  const forward = camera.getWorldDirection(walkDirection);
  forward.y = 0; forward.normalize();
  const right = forward.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
  const movement = forward.multiplyScalar(forwardInput).add(right.multiplyScalar(rightInput)).normalize().multiplyScalar(2.4 * delta);
  const nextX = camera.position.x + movement.x;
  const nextZ = camera.position.z + movement.z;
  if (!walkPointBlocked(nextX, camera.position.z)) camera.position.x = nextX;
  if (!walkPointBlocked(camera.position.x, nextZ)) camera.position.z = nextZ;
}
function handleWalkMouseMove(event) {
  if (!walkingMode || pointerControls?.isLocked) return;
  camera.rotation.order = 'YXZ';
  camera.rotation.y -= event.movementX * .0045;
  camera.rotation.x = THREE.MathUtils.clamp(
    camera.rotation.x - event.movementY * .0045,
    -Math.PI / 2 + .2,
    Math.PI / 2 - .2
  );
  camera.rotation.z = 0;
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
function handleKeyboardShortcuts(event) {
  const code = event.code;
  if (code === 'Escape') {
    if (walkingMode) {
      exitWalkMode();
      return;
    }
    if (state.settingsOpen) {
      state.settingsOpen = false;
      render();
      return;
    }
    if (selectedKey) {
      selectedKey = null;
      render();
    }
    return;
  }
  if (walkingMode) return;
  if (state.settingsOpen || event.altKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && event.target.matches('input, textarea, select, [contenteditable="true"]')) return;

  if (event.ctrlKey && code === 'KeyS') {
    event.preventDefault();
    app.querySelector('#savePlan')?.click();
    return;
  }
  if (event.ctrlKey && !event.shiftKey && code === 'KeyZ') {
    event.preventDefault();
    undoLayoutChange();
    return;
  }
  if (event.ctrlKey && code === 'KeyY') {
    event.preventDefault();
    redoLayoutChange();
    return;
  }
  if (event.ctrlKey && ['ArrowLeft', 'ArrowRight'].includes(code)) {
    if (!getSelected()) return;
    event.preventDefault();
    rotateSelected(code === 'ArrowLeft' ? -15 : 15);
    return;
  }
  if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(code)) {
    if (!getSelected()) return;
    event.preventDefault();
    const step = .1;
    const movement = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0],
      ArrowUp: [0, -step], ArrowDown: [0, step]
    }[code];
    moveSelectedBy(...movement);
    return;
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(code)) {
    event.preventDefault();
    const orbit = {
      ArrowLeft: [.18, 0], ArrowRight: [-.18, 0],
      ArrowUp: [0, -.12], ArrowDown: [0, .12]
    }[code];
    orbitCameraBy(...orbit);
    return;
  }
  if (code === 'Delete' && getSeat()) {
    event.preventDefault();
    removeSelectedWorkspace();
    return;
  }
  if ((code === 'Equal' && event.shiftKey) || code === 'NumpadAdd') {
    event.preventDefault();
    zoom(.84);
    return;
  }
  if (code === 'Minus' || code === 'NumpadSubtract') {
    event.preventDefault();
    zoom(1.18);
    return;
  }
  if (code === 'Home') {
    event.preventDefault();
    setView('orbit');
  }
}

function mat(color, roughness = .72, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, ...extra });
}
function box(parent, width, height, depth, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function cylinder(parent, top, bottom, height, material, x, y, z, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function addCable(parent, points, material, radius = .006) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 7, false), material);
  cable.castShadow = true;
  parent.add(cable);
  return cable;
}
function addLine(parent, points, color = 0x514f49, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({
    color, transparent: opacity < 1, opacity, depthTest: false
  }));
  parent.add(mesh); return mesh;
}

function initScene() {
  const host = document.querySelector('#scene'); if (!host) return;
  if (!renderer) createScene(host);
  else { host.appendChild(renderer.domElement); rebuildMovables(); resizeScene(); }
  refreshLayers(); updateDimensions(); updateCollisions();
}
async function loadLocalModel(file, selectedFiles = [file]) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const nextModelUrls = [];
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
        nextModelUrls.push(objectUrl);
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

    closeLocalModel(false);
    importedModelUrls = nextModelUrls;
    object.name = file.name;
    object.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => { material.side = THREE.DoubleSide; });
        }
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
    nextModelUrls.forEach(URL.revokeObjectURL);
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
  camera.position.set(8.8, 16.2, 10.8);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  host.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, .2, 0); controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * .48; controls.minDistance = 4; controls.maxDistance = 25;
  pointerControls = new PointerLockControls(camera, renderer.domElement);
  pointerControls.pointerSpeed = 1.2;
  pointerControls.addEventListener('lock', onWalkLock);
  pointerControls.addEventListener('unlock', onWalkUnlock);
  document.addEventListener('pointerlockerror', activateWalkFallback);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x77716a, 2.15));
  const keyLight = new THREE.DirectionalLight(0xfff1d1, 3.2);
  keyLight.position.set(-5, 12, 7); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048); scene.add(keyLight);
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
  renderer.domElement.addEventListener('pointerleave', () => {
    if (!dragging) setHoveredObject(null);
    pointerUp();
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

  // The long walls are solid. The entrance and windows are on opposite short walls.
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
  // The leaf swings across the doorway into the room (positive Z).
  buildDoorLeaf(doorLeft, -HALF_L - .025, -1.22);

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
}
function buildWindows() {
  const glass = mat(0x9bc9c7, .14, {
    transparent: true, opacity: .34, metalness: .1, side: THREE.DoubleSide
  });
  const frame = mat(0x424e4d, .3, { metalness: .28 });

  // Four framed panes on the short end beside Bogdan, Ilya and Nikita's desks.
  const glassStart = -2.5;
  const glassSpan = 5;
  const glassBay = glassSpan / 4;
  for (let index = 0; index < 4; index++) {
    const x = glassStart + glassBay * (index + .5);
    box(windowGroup, glassBay - .04, 1.62, .045, glass, x, 1.65, HALF_L - .015);
  }
  for (let index = 0; index <= 4; index++) {
    const x = glassStart + glassBay * index;
    box(windowGroup, .055, 1.72, .085, frame, x, 1.65, HALF_L - .015);
  }
  for (const y of [.84, .92, 2.38, 2.46]) {
    box(windowGroup, glassSpan, .055, .085, frame, 0, y, HALF_L - .015);
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
    box(wallGroup, .015, 2.02, ROOM.length - .18, concrete, x, 1.16, 0);
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
function makeChair(parent, side) {
  const chair = new THREE.Group(); chair.position.set(side * .62, 0, 0);
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
  root.userData.moveKey = seatKey(seat.id); root.visible = !importedModel; scene.add(root);
  const desktop = mat(0xf3efe5, .4), legs = mat(0x555855, .54);
  box(root, .6, .075, 1.2, desktop, 0, .77, 0);
  for (const x of [-.26, .26]) for (const z of [-.55, .55]) box(root, .035, .74, .035, legs, x, .37, z);
  box(root, .34, .045, .1, legs, 0, .53, -.43);
  makeDeskEquipment(root, seat.side || 1);
  makeChair(root, seat.side || 1); addNameLabel(root, seat.name);
  movable.set(seatKey(seat.id), { group: root, data: seat, kind: 'seat', width: 1.16, depth: 1.2, localX: (seat.side || 1) * .28, localZ: 0 });
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
function disposeObject(object) {
  object.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(material => {
      if (material.map) material.map.dispose();
      material.dispose();
    });
  });
}
function makeBoard() {
  const board = new THREE.Group(); board.position.set(state.board.x, 0, state.board.z); board.rotation.y = state.board.rot || 0;
  board.userData.moveKey = 'board';
  const frame = mat(0x535b59, .34, { metalness: .22 });
  box(board, 1.2, .86, .065, frame, 0, 1.37, 0);
  box(board, 1.11, .77, .018, mat(0xf8f5ec, .25), 0, 1.37, .042);
  box(board, .07, 1.23, .07, frame, -.43, .62, 0);
  box(board, .07, 1.23, .07, frame, .43, .62, 0);
  box(board, .9, .07, .42, frame, 0, .055, 0);
  box(board, .55, .045, .07, frame, 0, .48, 0);
  board.visible = !importedModel;
  scene.add(board);
  movable.set('board', { group: board, data: state.board, kind: 'board', width: 1.2, depth: .2, localX: 0, localZ: 0 });
}
function makeCabinet() {
  const cabinet = new THREE.Group();
  cabinet.position.set(state.cabinet.x, 0, state.cabinet.z);
  cabinet.rotation.y = state.cabinet.rot;
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

  furnitureGroup.add(cabinet);
  movable.set('cabinet', { group: cabinet, data: state.cabinet, kind: 'cabinet', width: .76, depth: .68, localX: 0, localZ: 0 });
}
function makeCart() {
  const cart = new THREE.Group();
  cart.name = t('cart');
  cart.position.set(state.cart.x, 0, state.cart.z);
  cart.rotation.y = state.cart.rot || 0;
  cart.userData.moveKey = 'cart';
  cart.visible = !importedModel;

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
  scene.add(cart);
  movable.set('cart', { group: cart, data: state.cart, kind: 'cart', width: .72, depth: .92, localX: 0, localZ: 0 });
}
function rebuildMovables() {
  clearObjectHighlight();
  for (const item of movable.values()) {
    item.group.parent?.remove(item.group);
    disposeObject(item.group);
  }
  movable.clear();
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
function updateDimensions() {
  if (dimensionGroup?.parent) dimensionGroup.parent.remove(dimensionGroup);
  if (dimensionGroup) disposeObject(dimensionGroup);
  dimensionGroup = new THREE.Group();
  if (!state.showDimensions || !selectedKey || !movable.has(selectedKey)) return;
  const item = movable.get(selectedKey), width = item.width, depth = item.depth;
  const left = item.localX - width / 2, right = item.localX + width / 2;
  const near = item.localZ + depth / 2, far = item.localZ - depth / 2, offset = .26;
  const y = .045, color = 0xb58b18;
  addLine(dimensionGroup, [new THREE.Vector3(left, y, near), new THREE.Vector3(right, y, near)], color);
  addLine(dimensionGroup, [new THREE.Vector3(left, y, near), new THREE.Vector3(left, y, near + offset)], color);
  addLine(dimensionGroup, [new THREE.Vector3(right, y, near), new THREE.Vector3(right, y, near + offset)], color);
  addLine(dimensionGroup, [new THREE.Vector3(right + offset, y, far), new THREE.Vector3(right + offset, y, near)], color);
  addLine(dimensionGroup, [new THREE.Vector3(right, y, far), new THREE.Vector3(right + offset, y, far)], color);
  addLine(dimensionGroup, [new THREE.Vector3(right, y, near), new THREE.Vector3(right + offset, y, near)], color);
  const wLabel = makeDimensionLabel(`${width.toFixed(2)} ${t('m')}`);
  wLabel.position.set(item.localX, .11, near + offset + .08); dimensionGroup.add(wLabel);
  const dLabel = makeDimensionLabel(`${depth.toFixed(2)} ${t('m')}`);
  dLabel.position.set(right + offset + .11, .11, item.localZ); dimensionGroup.add(dLabel);
  movable.get(selectedKey).group.add(dimensionGroup);
}
function rectFor(item) {
  const rotation = item.data.rot || 0, cos = Math.cos(rotation), sin = Math.sin(rotation);
  return {
    x: item.data.x + cos * item.localX + sin * item.localZ,
    z: item.data.z - sin * item.localX + cos * item.localZ,
    width: item.width, depth: item.depth, rotation
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
function outOfBounds(rect) {
  return corners(rect).some(point => Math.abs(point.x) > HALF_W + .025 || Math.abs(point.z) > HALF_L + .025);
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
    if (outOfBounds(rect)) conflicted.add(item.kind === 'seat' ? seatKey(item.data.id) : item.kind);
  });
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    if (!overlaps(items[i].rect, items[j].rect)) continue;
    conflicted.add(items[i].item.kind === 'seat' ? seatKey(items[i].item.data.id) : items[i].item.kind);
    conflicted.add(items[j].item.kind === 'seat' ? seatKey(items[j].item.data.id) : items[j].item.kind);
  }
  const conflictedObstacles = new Set();
  obstacles.forEach((obstacle, obstacleIndex) => {
    const obstacleRect = { ...obstacle, rotation: obstacle.rot || 0 };
    items.forEach(({ item, rect }) => {
      if (!overlaps(rect, obstacleRect)) return;
      conflicted.add(item.kind === 'seat' ? seatKey(item.data.id) : item.kind);
      conflictedObstacles.add(obstacleIndex);
    });
  });
  items.forEach(({ item, rect }) => {
    const key = item.kind === 'seat' ? seatKey(item.data.id) : item.kind;
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
  const target = new THREE.Vector3(0, .2, 0);
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
  if (walkingMode) return;
  if (!dragging) {
    updateHoveredObject(event);
    return;
  }
  const point = floorPoint(event), item = movable.get(dragging.key);
  if (!item) return;
  const limitX = HALF_W - (item.kind === 'seat' ? .7 : item.kind === 'cabinet' ? .38 : item.kind === 'cart' ? .42 : .6);
  const limitZ = HALF_L - (item.kind === 'seat' ? .6 : item.kind === 'cabinet' ? .34 : item.kind === 'cart' ? .52 : .1);
  item.data.x = THREE.MathUtils.clamp(point.x + dragging.dx, -limitX, limitX);
  item.data.z = THREE.MathUtils.clamp(point.z + dragging.dz, -limitZ, limitZ);
  item.group.position.set(item.data.x, 0, item.data.z);
  dragging.moved = true;
  updateDimensions(); updateCollisions(); updateMiniPlan();
}
function pointerUp() {
  if (walkingMode) return;
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
  if (!item) return;
  item.group.traverse(mesh => {
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
