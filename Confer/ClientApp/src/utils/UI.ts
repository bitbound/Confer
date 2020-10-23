export enum WindowSize {
    Small,
    Medium,
    Large
}

export function getWindowSize() : WindowSize {
    if (matchMedia("(max-width: 576px)").matches){
        return WindowSize.Small;
    }
    if (matchMedia("(max-width: 768px)").matches) {
        return WindowSize.Medium;
    }
    if (matchMedia("(max-width: 992px").matches) {

    }
    return WindowSize.Large;
}