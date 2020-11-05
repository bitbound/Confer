import React, { Component } from 'react';
import {
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Progress,
  Row
} from 'reactstrap';
import { getSettings, saveSettings } from '../services/SettingsService';
import { 
  enumerateAudioInputs, 
  enumerateVideoInputs, 
  loadAudioDevice, 
  loadVideoDevice,
   enumerateAudioOuputs 
} from '../utils/MediaHelper';
import { If } from './If';

interface SettingsProps {

}

interface SettingsState {
  videoInputs: MediaDeviceInfo[];
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  selectedVideoInput?: string;
  selectedAudioInput?: string;
  selectedAudioOutput?: string;
  videoStream?: MediaStream;
  audioStream?: MediaStream;
  displayName?: string;
  audioContext?: AudioContext;
  audioProcessor?: ScriptProcessorNode;
  audioStreamSource?: MediaStreamAudioSourceNode;
}

export class SettingsComp extends Component<SettingsProps, SettingsState> {
  static displayName = SettingsComp.name;

  private audioLevelProgress: React.RefObject<HTMLProgressElement>;

  constructor(props: SettingsProps) {
    super(props);
    const settings = getSettings();
    this.state = {
      audioInputs: [],
      audioOutputs: [],
      videoInputs: [],
      displayName: settings.displayName
    }
    this.audioLevelProgress = React.createRef();
  }

  async componentDidMount() {
    await this.initVideoInputs();
    await this.initAudioInputs();
    await this.initAudioOutputs();
  }

  async initAudioInputs() {
    try {
      const settings = getSettings();

      let mics = await enumerateAudioInputs();
      this.setState({
        audioInputs: mics
      });

      let selectedAudio = mics.find(x =>
        x.deviceId == settings.defaultAudioInput &&
        mics.some(mic => mic.deviceId == x.deviceId)) || mics[0];

      if (selectedAudio) {
        this.loadSelectedAudioDevice(selectedAudio.deviceId);
      }
    }
    catch (ex) {
      console.error(ex);
      alert("Failed to initialize audio devices.");
    }
  }

  async initAudioOutputs() {
    try {
      const settings = getSettings();

      let speakers = await enumerateAudioOuputs();
      this.setState({
        audioOutputs: speakers
      });

      let selectedOutput = speakers.find(x =>
        x.deviceId == settings.defaultAudioOutput &&
        speakers.some(speaker => speaker.deviceId == x.deviceId)) || speakers[0];

      if (selectedOutput) {
        this.setState({
          selectedAudioOutput: selectedOutput.deviceId
        })
      }
    }
    catch (ex) {
      console.error(ex);
      alert("Failed to initialize audio devices.");
    }
  }

  async initVideoInputs() {
    try {
      const settings = getSettings();

      let cameras = await enumerateVideoInputs();
      this.setState({
        videoInputs: cameras
      });

      let selectedVideo = cameras.find(x =>
        x.deviceId == settings.defaultVideoInput &&
        cameras.some(cam => cam.deviceId == x.deviceId)) || cameras[0];

      if (selectedVideo) {
        this.loadSelectedVideoDevice(selectedVideo.deviceId);
      }
    }
    catch (ex) {
      console.error(ex);
      alert("Failed to initialize video devices.");
    }
  }

  loadSelectedAudioDevice(deviceId: string) {
    loadAudioDevice(deviceId).then(audioStream => {
      let audioContext = new AudioContext();
      let scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
      scriptProcessor.addEventListener("audioprocess", ev => {
        if (this.audioLevelProgress.current) {
          const input = ev.inputBuffer.getChannelData(0);
          let sum = 0.0;
          for (var i = 0; i < input.length; ++i) {
            sum += input[i] * input[i];
          }
          let audioLevel = Math.sqrt(sum / input.length);
          this.audioLevelProgress.current.value = audioLevel * 2;
        }
      });

      let streamSource = audioContext.createMediaStreamSource(audioStream);
      streamSource.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      this.setState({
        selectedAudioInput: deviceId,
        audioStream: audioStream,
        audioContext: audioContext,
        audioProcessor: scriptProcessor,
        audioStreamSource: streamSource
      });

    }).catch(error => {
      console.error(error);
      alert("Failed to get audio stream.");
    })
  }

  loadSelectedVideoDevice(deviceId: string) {
    loadVideoDevice(deviceId).then(videoStream => {
      this.setState({
        selectedVideoInput: deviceId,
        videoStream: videoStream
      })
    }).catch(reason => {
      console.error(reason);
      alert("Failed to get video stream.");
    })
  }

  render() {
    return (
      <Row>
        <Col sm={12} md={10} lg={8} xl={6}>
          <h3>General</h3>
          <FormGroup>
            <Label>Display Name</Label>
            <Input
              type="text"
              defaultValue={this.state.displayName}
              onChange={ev => {
                const settings = getSettings();
                saveSettings({
                  defaultAudioInput: settings.defaultAudioInput,
                  defaultVideoInput: settings.defaultVideoInput,
                  defaultAudioOutput: settings.defaultAudioOutput,
                  displayName: ev.target.value
                })
              }} />
          </FormGroup>
          <h3>Default Devices</h3>
          <FormGroup>
            <Label>Camera</Label>
            <select
              className={"form-control"}
              value={this.state.selectedVideoInput}
              onChange={ev => {
                this.loadSelectedVideoDevice(ev.target.value);
                const settings = getSettings();
                console.log("Saving default cam ID ", ev.target.value);
                saveSettings({
                  defaultVideoInput: ev.target.value,
                  defaultAudioInput: settings.defaultAudioInput,
                  displayName: settings.displayName,
                  defaultAudioOutput: settings.defaultAudioOutput,
                })
              }}>
              {this.state.videoInputs.map(x => (
                <option
                  key={x.deviceId}
                  value={x.deviceId}>

                  {x.label}
                </option>
              ))}
            </select>
          </FormGroup>

          <If condition={!!this.state.videoStream}>
            <div>
              <video
                style={{ width: "100%" }}
                ref={ref => {
                  if (ref) {
                    if (ref && this.state.videoStream && ref.srcObject != this.state.videoStream) {
                      ref.srcObject = this.state.videoStream;
                    }
                  }
                }}
                onLoadedMetadata={e => {
                  (e.target as HTMLVideoElement).play();
                }} />
            </div>
          </If>

          <FormGroup>
            <Label>Microphone</Label>
            <select
              className={"form-control"}
              value={this.state.selectedAudioInput}
              onChange={ev => {
                this.loadSelectedAudioDevice(ev.target.value);
                const settings = getSettings();
                console.log("Saving default mic ID ", ev.target.value);
                saveSettings({
                  defaultAudioInput: ev.target.value,
                  defaultVideoInput: settings.defaultVideoInput,
                  displayName: settings.displayName,
                  defaultAudioOutput: settings.defaultAudioOutput,
                })
              }}>
              {this.state.audioInputs.map(x => (
                <option
                  key={x.deviceId}
                  value={x.deviceId}>

                  {x.label}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup>
            <progress
              ref={this.audioLevelProgress}
              value={0}
              style={{
                height: "25px",
                width: "100%"
              }}
            />
          </FormGroup>

          <FormGroup>
            <Label>Speaker</Label>
            <select
              className={"form-control"}
              value={this.state.selectedAudioOutput}
              onChange={ev => {
                const settings = getSettings();
                this.setState({
                  selectedAudioOutput: ev.target.value
                });
                console.log("Saving default speaker ID ", ev.target.value);
                saveSettings({
                  defaultAudioOutput: ev.target.value,
                  defaultVideoInput: settings.defaultVideoInput,
                  displayName: settings.displayName,
                  defaultAudioInput: settings.defaultAudioInput,
                })
              }}>
              {this.state.audioOutputs.map(x => (
                <option
                  key={x.deviceId}
                  value={x.deviceId}>

                  {x.label}
                </option>
              ))}
            </select>
          </FormGroup>
        </Col>
      </Row>
    );
  }
}
