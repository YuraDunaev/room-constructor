/** Creates the app's keyboard command handler from editor actions. */
export function createKeyboardShortcutHandler(actions) {
  const {
    getWalkingMode, exitWalkMode, getState, hasSelection, clearSelection, render, app,
    undo, redo, getSelected, rotateSelected, moveSelected, orbitCamera,
    getSeat, removeWorkspace, zoom, setView
  } = actions;

  return function handleKeyboardShortcuts(event) {
    const { code } = event;
    if (code === 'Escape') {
      if (getWalkingMode()) return exitWalkMode();
      const state = getState();
      if (state.settingsOpen) {
        state.settingsOpen = false;
        return render();
      }
      if (hasSelection()) {
        clearSelection();
        render();
      }
      return;
    }
    if (getWalkingMode()) return;
    if (getState().settingsOpen || event.altKey || event.metaKey) return;
    if (event.target instanceof HTMLElement && event.target.matches('input, textarea, select, [contenteditable="true"]')) return;

    if (event.ctrlKey && code === 'KeyS') {
      event.preventDefault();
      app.querySelector('#savePlan')?.click();
      return;
    }
    if (event.ctrlKey && !event.shiftKey && code === 'KeyZ') {
      event.preventDefault();
      undo();
      return;
    }
    if (event.ctrlKey && code === 'KeyY') {
      event.preventDefault();
      redo();
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
      moveSelected(...movement);
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(code)) {
      event.preventDefault();
      const orbit = {
        ArrowLeft: [.18, 0], ArrowRight: [-.18, 0],
        ArrowUp: [0, -.12], ArrowDown: [0, .12]
      }[code];
      orbitCamera(...orbit);
      return;
    }
    if (code === 'Delete' && getSeat()) {
      event.preventDefault();
      removeWorkspace();
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
  };
}
