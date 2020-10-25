import React, { Component } from 'react';
import {
  Col,
  Form,
  FormGroup,
  Label,
  Row
} from 'reactstrap';
import { getSettings, saveSettings } from '../services/SettingsService';
import { If } from './If';

interface SettingsProps {

}

interface SettingsState {
  videoInputs: MediaDeviceInfo[];
  audioInputs: MediaDeviceInfo[];
  selectedVideoInput?: string;
  selectedAudioInput?: string;
  videoTracks?: MediaStreamTrack[];
  audioTrack?: MediaStreamTrack[];
}

export class SettingsComp extends Component<SettingsProps, SettingsState> {
  static displayName = SettingsComp.name;

  constructor(props: SettingsProps) {
    super(props);
    this.state = {
      audioInputs: [],
      videoInputs: []
    }
  }

  componentDidMount() {
    const settings = getSettings();

    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
      .then(stream => {
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            let cameras = devices.filter(x => x.kind == "videoinput");
            let mics = devices.filter(x => x.kind == "audioinput");
            this.setState({
              audioInputs: mics,
              videoInputs: cameras
            });

            let selectedVideo = cameras.find(x =>
              x.deviceId == settings.defaultVideoInput) || cameras[0];

            if (selectedVideo) {
              this.setState({
                selectedVideoInput: selectedVideo.deviceId,
              })
              this.loadVideoDevice(selectedVideo.deviceId);
            }

            let selectedAudio = mics.find(x =>
              x.deviceId == settings.defaultAudioInput) || mics[0];

            if (selectedAudio) {
              this.setState({
                selectedAudioInput: selectedAudio.deviceId,
              })
              this.loadAudioDevice(selectedAudio.deviceId);
            }
          })
          .catch(reason => {
            console.error(reason);
            alert("Failed to get media devices.  Make sure this site has permission.");
          });
      })
      .catch(error => {
        console.error(error);
        alert("Failed to get media devices.");
      })
  }

  loadAudioDevice(deviceId: string) {
    navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: {
          exact: deviceId
        }
      },
      video: false
    }).then(audioStream => {
      this.setState({
        audioTrack: audioStream.getAudioTracks()
      })
    }).catch(error => {
      console.error(error);
      alert("Failed to get audio stream.");
    })
  }

  loadVideoDevice(deviceId: string) {
    navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: {
          exact: deviceId
        }
      },
      audio: false
    }).then(videoStream => {
      this.setState({
        videoTracks: videoStream.getVideoTracks()
      })
    }).catch(error => {
      console.error(error);
      alert("Failed to get video stream.");
    })
  }

  render() {
    return (
      <Row>
        <Col sm={12} md={10} lg={8} xl={6}>
          <Form>
            <h3>Default Devices</h3>
            <FormGroup>
              <Label>Camera</Label>
              <select
                className={"form-control"}
                defaultValue={this.state.selectedVideoInput}
                onChange={ev => {
                  this.loadVideoDevice(ev.target.value);
                  const settings = getSettings();
                  saveSettings({
                    defaultVideoInput: ev.target.value,
                    defaultAudioInput: settings.defaultAudioInput
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

            <If condition={() => !!this.state.videoTracks}>
              <div>
                <video
                  style={{width: "100%"}}
                  ref={ref => {
                    if (ref) {
                      if (this.state.videoTracks) {
                        ref.srcObject = new MediaStream(this.state.videoTracks);
                      }
                    }
                  }}
                  onLoadedMetadata={e => {
                    (e.target as HTMLVideoElement).play();
                  }} />
              </div>
            </If>

            <FormGroup>
              <Label>Microphones</Label>
              <select
                className={"form-control"}
                defaultValue={this.state.selectedAudioInput}
                onChange={ev => {
                  this.loadAudioDevice(ev.target.value);
                  const settings = getSettings();
                  saveSettings({
                    defaultAudioInput: ev.target.value,
                    defaultVideoInput: settings.defaultAudioInput
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
          </Form>
        </Col>
      </Row>
    );
  }
}
