import { reactive, readonly } from "vue";

interface ShellActions {
  openCommandPalette: () => void;
  openHotkeysCheatsheet: () => void;
  openMusicSearch: () => void;
}

const _state = reactive<ShellActions>({
  openCommandPalette: () => {
    window.dispatchEvent(new CustomEvent("louvorja:open-command-palette"));
  },
  openHotkeysCheatsheet: () => {
    window.dispatchEvent(new CustomEvent("louvorja:open-hotkeys"));
  },
  openMusicSearch: () => {
    window.dispatchEvent(new CustomEvent("louvorja:open-music-search"));
  },
});

export function registerShell(actions: Partial<ShellActions>): void {
  Object.assign(_state, actions);
}

export function useShell(): Readonly<ShellActions> {
  return readonly(_state);
}
