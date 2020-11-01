import { Settings } from "../interfaces/Settings";

const settingsKey = "Confer_Settings";

const defaultSettings = {
    defaultAudioInput: "",
    defaultVideoInput: "",
    displayName: ""
}

export function getSettings(): Settings {
    try {
        var settingsJson = localStorage.getItem(settingsKey);
        return JSON.parse(String(settingsJson)) || defaultSettings;
    }
    catch {
        return defaultSettings;
    }
}

export function saveSettings(settings: Settings) {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
}