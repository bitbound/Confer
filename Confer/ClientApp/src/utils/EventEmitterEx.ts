import { EventEmitter } from "events";

export class EventEmitterEx<T> extends EventEmitter {
    subscribe(listener: (args: T) => void): EventEmitter {
        this.on("", listener);
        return this;
    }
    publish(value: T) {
        this.emit("", value);
    }
    unsubscribe(listener: (args: T) => void) {
        this.off("", listener);
    }
}
