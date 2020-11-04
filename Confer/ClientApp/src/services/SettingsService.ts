import { Settings } from "../interfaces/Settings";

const settingsKey = "Confer_Settings";

const defaultSettings = () => {
    var defaults = {
        defaultAudioInput: "",
        defaultVideoInput: "",
        displayName: getRandomUser()
    };
    localStorage.setItem(settingsKey, JSON.stringify(defaults));
    return defaults;
}

const getRandomUser = () => {
    var user = "User-";
    for (var i = 0; i < 10; i++) {
        user += String(Math.floor(Math.random() * 9));
    }
    return user;
}

export function getSettings(): Settings {
    try {
        var settingsJson = localStorage.getItem(settingsKey);
        return JSON.parse(String(settingsJson)) || defaultSettings();
    }
    catch {
        return defaultSettings();
    }
}

export function saveSettings(settings: Settings) {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
}