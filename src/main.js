import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
    furniture: 'Мебель', seats: 'Рабочие места', board: 'Интерактивная доска', cabinet: 'Шкаф',
    toolbar: 'УПРАВЛЕНИЕ СЦЕНОЙ', add: 'Добавить место', save: 'Сохранить', reset: 'Сбросить',
    openModel: 'Открыть 3D-файл', removeModel: 'Закрыть файл', modelLoaded: 'Файл загружен', modelError: 'Не удалось открыть этот файл',
    view: 'Вид', top: 'Сверху', front: 'Спереди', orbit: '3D', rotate: 'Поворот',
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
    sceneKeys: '← ↑ → ↓ камера · Ctrl+←/→ поворот · Shift+стрелки сдвиг · Del удалить',
    m: 'м', sqm: 'м²'
  },
  en: {
    office: 'Office plan', project: 'Room project', hierarchy: 'PROJECT TREE', room: 'Room', shell: 'Building shell',
    walls: 'Walls', windows: 'Windows', columns: 'Columns', furniture: 'Furniture', seats: 'Workspaces',
    board: 'Interactive board', cabinet: 'Cabinet', toolbar: 'SCENE CONTROLS', add: 'Add workspace',
    openModel: 'Open 3D file', removeModel: 'Close file', modelLoaded: 'File loaded', modelError: 'Could not open this file',
    save: 'Save', reset: 'Reset', view: 'View', top: 'Top', front: 'Front', orbit: '3D', rotate: 'Rotate',
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
    sceneKeys: 'Arrows: orbit · Ctrl+←/→: rotate · Shift+arrows: move · Del: remove',
    m: 'm', sqm: 'm²'
  }
};
const startSeats = [
  { id: 's1', name: 'Сергей', x: -1.53, z: -1.1975, rot: 0, side: -1 },
  { id: 's2', name: 'Новый БИМщик', x: 1.53, z: -1.1975, rot: 0, side: 1 },
  { id: 's3', name: 'Юра', x: -1.53, z: 1.2025, rot: 0, side: -1 },
  { id: 's4', name: 'Юля', x: 1.53, z: 1.2025, rot: 0, side: 1 },
  { id: 's5', name: 'Богдан', x: -1.53, z: 3.6025, rot: 0, side: -1 },
  { id: 's6', name: 'Никита', x: -.93, z: 3.6025, rot: 0, side: 1 },
  { id: 's7', name: 'Илья', x: .93, z: 3.6025, rot: 0, side: -1 },
  { id: 's8', name: 'Даша', x: 1.53, z: 3.6025, rot: 0, side: 1 }
].map(seat => ({ ...seat, zone: 'work' }));
const baseState = {
  seats: startSeats, board: { x: 0, z: .45, rot: 0 }, cabinet: { x: -.28, z: 1.63, rot: 0 }, language: 'ru', theme: 'light',
  showWalls: true, showDimensions: false, showCollisions: false, showZones: false, layoutVersion: 4
};
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('room-layout') || '{}');
    const seats = saved.layoutVersion === 4 && Array.isArray(saved.seats)
      ? saved.seats
      : startSeats.map((seat, index) => ({ ...seat, name: saved.seats?.[index]?.name || seat.name }));
    return { ...baseState, ...saved, seats, layoutVersion: 4 };
  } catch { return structuredClone(baseState); }
}
let state = loadState();
const undoHistory = [];
const redoHistory = [];
const historyLimit = 100;
const serializeLayout = () => JSON.stringify({ seats: state.seats, board: state.board, cabinet: state.cabinet });
let lastLayoutSnapshot = serializeLayout();
let selectedKey = null;
let scene, camera, renderer, controls, raycaster, pointer;
let wallGroup, windowGroup, columnGroup, furnitureGroup, zoneGroup, collisionGroup, dimensionGroup;
let dragging = null;
let renderAfterPointer = false;
let hoveredKey = null;
let importedModel = null;
let importedModelUrls = [];
let importedModelName = '';
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
      <summary><i>⌄</i>▦　${t('furniture')}<small>${state.seats.length + 2}</small></summary>
      ${treeItem('board', '▭', t('board'))}${seatItems}${treeItem('cabinet', '▰', t('cabinet'))}
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
      <div class="zoom-controls">
        <button id="zoomIn">＋</button><button id="zoomOut">−</button><button id="homeView">⌂</button>
      </div>
      ${compass()}
    </main>
    <aside class="properties">
      <div class="properties-heading">
        <div><small>${t('properties')}</small>
          <h2>${selectedKey === 'board' ? t('board') : selectedKey === 'cabinet' ? t('cabinet') : selected ? escapeHtml(selected.name || t('empty')) : t('selection')}</h2>
        </div>
        <span>${selectedKey === 'board' ? '▭' : selectedKey === 'cabinet' ? '▰' : selected ? '▱' : '⌖'}</span>
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
    { key: 'cabinet', data: state.cabinet, width: .76, depth: .68, className: 'mini-cabinet' }
  ];
  return objects.map(({ key, data, width, depth, className }) => {
    const left = (data.x + HALF_W) / ROOM.width * 100;
    const top = (data.z + HALF_L) / ROOM.length * 100;
    const active = selectedKey === key ? 'active' : '';
    const title = key.startsWith('seat:') ? state.seats.find(seat => seatKey(seat.id) === key)?.name : key === 'cabinet' ? t('cabinet') : t('board');
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
  const [marginX, marginZ] = selectedKey === 'cabinet' ? [.38, .34] : selectedKey === 'board' ? [.6, .1] : [.7, .6];
  object.x = THREE.MathUtils.clamp(object.x + deltaX, -HALF_W + marginX, HALF_W - marginX);
  object.z = THREE.MathUtils.clamp(object.z + deltaZ, -HALF_L + marginZ, HALF_L - marginZ);
  saveState();
  render();
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
  if (event.key === 'Escape') {
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
  if (state.settingsOpen || event.altKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && event.target.matches('input, textarea, select, [contenteditable="true"]')) return;

  if (event.ctrlKey && event.key.toLowerCase() === 's') {
    event.preventDefault();
    app.querySelector('#savePlan')?.click();
    return;
  }
  if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    undoLayoutChange();
    return;
  }
  if (event.ctrlKey && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redoLayoutChange();
    return;
  }
  if (event.ctrlKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    if (!getSelected()) return;
    event.preventDefault();
    rotateSelected(event.key === 'ArrowLeft' ? -15 : 15);
    return;
  }
  if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    if (!getSelected()) return;
    event.preventDefault();
    const step = .1;
    const movement = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0],
      ArrowUp: [0, -step], ArrowDown: [0, step]
    }[event.key];
    moveSelectedBy(...movement);
    return;
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const orbit = {
      ArrowLeft: [.18, 0], ArrowRight: [-.18, 0],
      ArrowUp: [0, -.12], ArrowDown: [0, .12]
    }[event.key];
    orbitCameraBy(...orbit);
    return;
  }
  if (event.key === 'Delete' && getSeat()) {
    event.preventDefault();
    removeSelectedWorkspace();
    return;
  }
  if (event.key === '+' || event.code === 'NumpadAdd') {
    event.preventDefault();
    zoom(.84);
    return;
  }
  if (event.key === '-' || event.code === 'NumpadSubtract') {
    event.preventDefault();
    zoom(1.18);
    return;
  }
  if (event.key === 'Home') {
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
  scene.add(new THREE.HemisphereLight(0xffffff, 0x77716a, 2.15));
  const keyLight = new THREE.DirectionalLight(0xfff1d1, 3.2);
  keyLight.position.set(-5, 12, 7); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048); scene.add(keyLight);
  const fill = new THREE.DirectionalLight(0xffffff, 1.1);
  fill.position.set(5, 8, -4); scene.add(fill);
  buildRoom(); rebuildMovables();
  raycaster = new THREE.Raycaster(); pointer = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointermove', pointerMove);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  renderer.domElement.addEventListener('pointerleave', () => {
    if (!dragging) setHoveredObject(null);
    pointerUp();
  });
  window.addEventListener('resize', resizeScene); animate();
}
function buildRoom() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.length), mat(0x777a7d, .96, { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.04; floor.receiveShadow = true; scene.add(floor);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width - .2, ROOM.length - .2),
    new THREE.MeshStandardMaterial({ color: 0x777a7d, roughness: 1, metalness: 0 }));
  carpet.rotation.x = -Math.PI / 2; carpet.position.y = -.01; carpet.receiveShadow = true; scene.add(carpet);
  wallGroup = new THREE.Group(); wallGroup.name = 'Walls'; scene.add(wallGroup);
  windowGroup = new THREE.Group(); windowGroup.name = 'Windows'; scene.add(windowGroup);
  columnGroup = new THREE.Group(); columnGroup.name = 'Columns'; scene.add(columnGroup);
  furnitureGroup = new THREE.Group(); furnitureGroup.name = 'Fixed furniture'; scene.add(furnitureGroup);
  zoneGroup = new THREE.Group(); scene.add(zoneGroup);
  collisionGroup = new THREE.Group(); scene.add(collisionGroup);
  obstacles.length = 0;
  const walls = mat(0xe4e1d9), trim = mat(0x79756d), base = mat(0xbab6ad);
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
  buildDoorLeaf(doorLeft, -HALF_L - .025, -1.05);

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

  buildWindows(); buildColumns(); buildZoneOverlay();
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
    box(column, .38, 2.72, .42, mat(0x565653), 0, 1.36, 0);
    box(column, .46, .1, .5, mat(0x77756e), 0, .05, 0);
    box(column, .46, .08, .5, mat(0x908d85), 0, 2.72, 0);
    obstacles.push({ x, z, width: .46, depth: .5, rot: 0 });
  }
}
function buildZoneOverlay() {
  const work = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width - .16, ROOM.length - .16),
  new THREE.MeshBasicMaterial({ color: 0xe6b82e, transparent: true, opacity: .085, side: THREE.DoubleSide, depthWrite: false }));
  work.rotation.x = -Math.PI / 2; work.position.set(0, .006, 0); zoneGroup.add(work);
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
  root.userData.moveKey = seatKey(seat.id); scene.add(root);
  const desktop = mat(0xf3efe5, .4), legs = mat(0x555855, .54);
  box(root, .6, .075, 1.2, desktop, 0, .77, 0);
  for (const x of [-.26, .26]) for (const z of [-.55, .55]) box(root, .035, .74, .035, legs, x, .37, z);
  box(root, .34, .045, .1, legs, 0, .53, -.43);
  makeChair(root, seat.side || 1); addNameLabel(root, seat.name);
  movable.set(seatKey(seat.id), { group: root, data: seat, kind: 'seat', width: 1.16, depth: 1.2, localX: (seat.side || 1) * .28, localZ: 0 });
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
  scene.add(board);
  movable.set('board', { group: board, data: state.board, kind: 'board', width: 1.2, depth: .2, localX: 0, localZ: 0 });
}
function makeCabinet() {
  const cabinet = new THREE.Group();
  cabinet.position.set(state.cabinet.x, 0, state.cabinet.z);
  cabinet.rotation.y = state.cabinet.rot;
  cabinet.userData.moveKey = 'cabinet';
  box(cabinet, .72, 1.08, .64, mat(0x555653), 0, .54, 0);
  box(cabinet, .76, .055, .68, mat(0x77766f), 0, 1.08, 0);
  box(cabinet, .035, .82, .012, mat(0x96948d), .21, .53, .326);
  furnitureGroup.add(cabinet);
  movable.set('cabinet', { group: cabinet, data: state.cabinet, kind: 'cabinet', width: .76, depth: .68, localX: 0, localZ: 0 });
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
  if (!dragging) {
    updateHoveredObject(event);
    return;
  }
  const point = floorPoint(event), item = movable.get(dragging.key);
  if (!item) return;
  const limitX = HALF_W - (item.kind === 'seat' ? .7 : item.kind === 'cabinet' ? .38 : .6);
  const limitZ = HALF_L - (item.kind === 'seat' ? .6 : item.kind === 'cabinet' ? .34 : .1);
  item.data.x = THREE.MathUtils.clamp(point.x + dragging.dx, -limitX, limitX);
  item.data.z = THREE.MathUtils.clamp(point.z + dragging.dz, -limitZ, limitZ);
  item.group.position.set(item.data.x, 0, item.data.z);
  dragging.moved = true;
  updateDimensions(); updateCollisions(); updateMiniPlan();
}
function pointerUp() {
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
  controls.update(); syncViewCube(); renderer.render(scene, camera);
}

render();
