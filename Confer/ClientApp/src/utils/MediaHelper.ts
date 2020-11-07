export async function enumerateAudioInputs(): Promise<MediaDeviceInfo[]> {
  try{
    await navigator.mediaDevices.getUserMedia({
      audio: true
    });
  }
  catch {
    console.warn("Failed to get user audio while enumerating.");
  }
  
  var devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(x => x.kind == "audioinput");;
}

export async function enumerateAudioOuputs(): Promise<MediaDeviceInfo[]> {
  try {
    await navigator.mediaDevices.getUserMedia({
      audio: true
    });
  }
  catch {
    console.warn("Failed to get user audio while enumerating.");
  }
  var devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(x => x.kind == "audiooutput");;
}

export async function enumerateVideoInputs(): Promise<MediaDeviceInfo[]> {
  try {
    await navigator.mediaDevices.getUserMedia({
      video: true
    });
  }
  catch {
    console.warn("Failed to get user video while enumerating.");
  }
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