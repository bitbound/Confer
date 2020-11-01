export async function enumerateAudioDevices(): Promise<MediaDeviceInfo[]> {
  await navigator.mediaDevices.getUserMedia({
    audio: true
  });

  var devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(x => x.kind == "audioinput");;
}

export async function enumerateVideoDevices(): Promise<MediaDeviceInfo[]> {
  await navigator.mediaDevices.getUserMedia({
    video: true
  });

  var devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(x => x.kind == "videoinput");;
}

export function loadAudioDevice(deviceId: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: {
        exact: deviceId
      }
    },
    video: false
  });
}

export function loadVideoDevice(deviceId: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: {
        exact: deviceId
      }
    },
    audio: false
  });
}