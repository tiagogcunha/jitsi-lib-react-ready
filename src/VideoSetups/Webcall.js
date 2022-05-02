import React from "react";
import "../assets/App.css";
import { LocalTracks } from "./Lib/LocalTracks";
import _ from "lodash";
import { RemoteTrack } from "./Lib/RemoteTrack";
import { LocalSpeaker } from "./Lib/LocalSpeaker";
import { v4 as uuidv4 } from "uuid";


export class Webcall extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      serverURL: "beta.meet.jit.si",
      roomId: "telimed",
      selectedSpeakerDeviceId: "",
      defaultMicId: "",
      defaultVideoId: "",
      defaultSpeakerId: "",
      deviceList: [],
      status: "closed",
      lastError: "",
      remoteTrackIds: [],
      loaded: false,
      activeRoomId: null,
      constraints: {
        audio: true,
        video: true
      }
    };
    window.jit = {};
    window.jit.remoteTracks = [];
    window.jit.activeConnection = null;
    window.jit.activeRoom = null;
  }


  async componentDidMount() {

    try {
      const stream = await navigator.mediaDevices.getUserMedia(this.state.constraints);
      this.handleGetDevicesSuccess(stream);
      this.onConnect();
    } catch (e) {
      this.handleGetDevicesError(e);
    }

  }

  componentDidUpdate() {}

  handleErrorMsg = (msg, error) => {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined') {
      console.error(error);
    }
  }

  handleGetDevicesError = (error) => {
    if (error.name === 'OverconstrainedError') {
      const v = this.state.constraints.video;
      this.handleErrorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
    } else if (error.name === 'NotAllowedError') {
      this.handleErrorMsg('Permissions have not been granted to use your camera and ' +
        'microphone, you need to allow the page access to your devices in ' +
        'order for the demo to work.');
    }
    this.handleErrorMsg(`getUserMedia error: ${error.name}`, error);
  }

  handleGetDevicesSuccess = (stream) => {
    //const videoTracks = stream.getVideoTracks();
    //const audioTracks = stream.getAudioTracks();
    window.stream = stream; // make variable available to browser console
    this.handleObtainDevices()

  }
  
  handleObtainDevices = () => {

    window.JitsiMeetJS.mediaDevices.enumerateDevices((devices) => {
      let newDeviceList = [];
      for (let device of devices) {

        // if (device.deviceId !== 'default' && device.deviceId !== 'communications') {
        newDeviceList.push({
          name: device.label,
          id: device.deviceId,
          type: device.kind,
        });
        // }
      }
      let micId =
        (_.find(newDeviceList, { type: "audioinput" }) || {}).id || "none";
      let videoId =
        (_.find(newDeviceList, { type: "videoinput" }) || {}).id || "none";
      let speakerId =
        (_.find(newDeviceList, { type: "audiooutput" }) || {}).id || "none";
      this.setState({
        deviceList: newDeviceList,
        defaultMicId: micId,
        defaultVideoId: videoId,
        defaultSpeakerId: speakerId,
        loaded: true,
      });
    });

  }

  onSpeakerChanged = (newSpeaker) => {
    this.setState({
      selectedSpeakerDeviceId: newSpeaker.id,
    });
  };

  onServerChanged = (event) => {
    this.setState({
      serverURL: event.target.value,
    });
  };

  onRoomChanged = (event) => {
    this.setState({
      roomId: event.target.value,
    });
  };

  onRoomTrackAdded = (track) => {
    if (track.isLocal() === true) {
      return;
    }
    let newTrackId = track.getId();
    console.warn(`Track Added: ${newTrackId}`);
    let matchTrack = _.find(this.remoteTracks, { id: newTrackId });
    if (matchTrack) {
      return;
    }
    let trackInfo = {
      id: newTrackId,
      participantId: track.getParticipantId(),
      type: track.getType(),
      track: track,
    };
    window.jit.remoteTracks.push(trackInfo);
    this.setState({
      remoteTrackIds: _.map(window.jit.remoteTracks, (rt) => {
        return { id: rt.id, participantId: rt.participantId };
      }),
    });
  };

  onRoomTrackRemoved = (track) => {
    if (track.isLocal() === true) {
      return;
    }
    let trackId = track.getId();
    window.jit.remoteTracks = _.reject(window.jit.remoteTracks, {
      id: trackId,
    });
    this.setState({
      remoteTrackIds: _.map(window.jit.remoteTracks, (rt) => {
        return { id: rt.id, participantId: rt.participantId };
      }),
    });
  };

  onConnectionSuccess = () => {
    const { roomId } = this.state;
    try {
      window.jit.activeRoom = window.jit.activeConnection.initJitsiConference(
        roomId,
        {
          openBridgeChannel: true,
        }
      );
      window.jit.activeRoom.addEventListener(
        window.JitsiMeetJS.events.conference.TRACK_ADDED,
        this.onRoomTrackAdded
      );
      window.jit.activeRoom.addEventListener(
        window.JitsiMeetJS.events.conference.TRACK_REMOVED,
        this.onRoomTrackRemoved
      );
      // this.activeRoom.on(
      //     JitsiMeetJS.events.conference.CONFERENCE_JOINED,
      //     onConferenceJoined);
      //     this.activeRoom.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
      //     console.warn('user join');
      //     remoteTracks[id] = [];
      // });
      // this.activeRoom.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
      // this.activeRoom.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
      //     console.warn(`${track.getType()} - ${track.isMuted()}`);
      // });
      // this.activeRoom.on(
      //     JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
      //     (userID, displayName) => console.warn(`${userID} - ${displayName}`));
      //     this.activeRoom.on(
      //     JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
      //     (userID, audioLevel) => console.warn(`${userID} - ${audioLevel}`));
      //     this.activeRoom.on(
      //     JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
      //     () => console.warn(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
      window.jit.activeRoom.join();
      this.setState({
        status: "open",
        lastError: "",
        activeRoomId: uuidv4(),
        connected: true,
      });
    } catch (error) {
      this.setState({
        status: "closed",
        lastError: error.message,
      });
    }
  };

  onConnectionFailed = (a, b, c, d) => {
    this.setState({
      status: "closed",
      lastError: a,
      activeRoomId: null,
    });
  };

  onConnectionDisconnect = () => {
    window.jit.activeConnection.removeEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess
    );
    window.jit.activeConnection.removeEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
      this.onConnectionFailed
    );
    window.jit.activeConnection.removeEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      this.onConnectionDisconnect
    );
    window.jit.activeRoom.removeEventListener(
      window.JitsiMeetJS.events.conference.TRACK_ADDED,
      this.onRoomTrackAdded
    );
    window.jit.activeRoom.removeEventListener(
      window.JitsiMeetJS.events.conference.TRACK_REMOVED,
      this.onRoomTrackRemoved
    );
  };

  onConnect = () => {
    const { roomId, serverURL } = this.state;
    this.setState({
      status: "Joining...",
    });
    window.jit.activeConnection = new window.JitsiMeetJS.JitsiConnection(
      null,
      null,
      {
        hosts: {
          domain: serverURL,
          muc: `conference.${serverURL}`, // FIXME: use XEP-0030
        },
        bosh: "//infinitoo.io/http-bind",
        serviceUrl: `wss://${serverURL}/xmpp-websocket?room=${roomId}`,
        clientNode: `https://${serverURL}`,
      }
    );

    window.jit.activeConnection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess
    );
    window.jit.activeConnection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
      this.onConnectionFailed
    );
    window.jit.activeConnection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      this.onConnectionDisconnect
    );
    window.jit.activeConnection.connect();
  };

  onDisconnect = () => {
    if (window.jit.activeRoom) {
      this.setState({
        status: "Leaving...",
      });
      try {
        window.jit.activeRoom.leave().then(() => {
          if (window.jit.activeConnection) {
            window.jit.activeConnection.disconnect();
          }
          this.setState({
            status: "closed",
            remoteTracks: [],
            activeRoomId: null,
          });
        });
      } catch (error) {
        this.setState({
          status: "closed",
          lastError: error.message,
        });
      }
    }
  };

  renderRemoteTracks = (trackGroups = {}, selectedSpeakerDeviceId) => {
    let ret = [];

    let participantIds = _.keys(trackGroups);

    if (participantIds.length === 0) {
      return null;
    }
    for (let participantId of participantIds) {
      ret.push(
        <div key={participantId} className="B_Body_Block">
          <RemoteTrack
            trackIds={trackGroups[participantId]}
            selectedSpeakerDeviceId={selectedSpeakerDeviceId}
          />
        </div>
      );
    }

    return ret;
  };

  render() {
    const {
      selectedSpeakerDeviceId,
      serverURL,
      roomId,
      //status,
      //lastError,
      defaultMicId,
      defaultVideoId,
      defaultSpeakerId,
      deviceList,
      //loaded = false,
      connected = false,
      remoteTrackIds = [],
      activeRoomId,
    } = this.state;

    if (connected === false) {
      return (
        <div className="App">
          <div className="AppLoading">
            <h3>Connecting to {serverURL}, room {roomId}...</h3>
          </div>
        </div>
      );
    }

    let remoteTrackGroups = _.groupBy(remoteTrackIds, (rt) => {
      return rt.participantId;
    });

    return (
      <div className="App">



        <div className="TR">
          <div className="TR_Header">
             <LocalSpeaker deviceList={deviceList} key='LocalSpeaker' defaultSpeakerId={defaultSpeakerId} onSpeakerChanged={this.onSpeakerChanged} />  
              <p>Connected to {serverURL}, room {roomId}</p>
          </div>
          <div className="TR_Body">
            <div className="TR_Body_Block">
              <LocalTracks activeRoomId={activeRoomId} deviceList={deviceList} defaultMicId={defaultMicId} defaultVideoId={defaultVideoId} key='localTracks' />{" "}
            </div>
          </div>
        </div>
        <div className="B">
          <div className="B_Header">
            <h3>Them</h3>
          </div>
          <div className="B_Body">
            {this.renderRemoteTracks(remoteTrackGroups, selectedSpeakerDeviceId)} 
          </div>
        </div>
      </div>
    );
  }
}
