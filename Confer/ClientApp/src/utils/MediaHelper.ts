export async function enumerateAudioInputs(): Promise<MediaDeviceInfo[]> {
  try {
    var tempStraem = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    var devices = await navigator.mediaDevices.enumerateDevices();

    // Tracks must be stopped to avoid errors when
    // attempting to get the media device again.
    tempStraem.getTracks().forEach(x => {
      x.stop();
    });
    
    return devices.filter(x => x.kind == "audioinput");
  }
  catch {
    console.warn("Failed to get user audio while enumerating.");
    return [];
  }
}

export async function enumerateAudioOuputs(): Promise<MediaDeviceInfo[]> {
  var tempStream;
  try {
    tempStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
  }
  catch {
    console.warn("Failed to get user audio while enumerating.");
  }

  try { 
    var devices = await navigator.mediaDevices.enumerateDevices();
    tempStream?.getTracks().forEach(x => {
      x.stop();
    });
    return devices.filter(x => x.kind == "audiooutput");
  }
  catch {
    console.warn("Failed to get user audio while enumerating.");
    return [];
  }
}

export async function enumerateVideoInputs(): Promise<MediaDeviceInfo[]> {
  var tempStream;
  try {
    tempStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
  }
  catch {
    console.warn("Failed to get user video while enumerating.");
  }
  
  try {
    var devices = await navigator.mediaDevices.enumerateDevices();
    tempStream?.getTracks().forEach(x => {
      x.stop();
    })
    return devices.filter(x => x.kind == "videoinput");;
  }
  catch {
    console.warn("Failed to get user video while enumerating.");
    return [];
  }

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