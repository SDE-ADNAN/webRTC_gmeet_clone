import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socketIO from 'socket.io-client';
import { Button, Grid, Typography } from "@mui/material";
import { CentralizedCard } from "./CentralizedCard";
import { Video } from "./Video";

let pc = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
});

let addedTracks = false;

export function MeetingPage() {
  const [socket, setSocket] = useState(null);
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [videoStream, setVideoStream] = useState();
  const [remoteVideoStream, setRemoteVideoStream] = useState();

  const params = useParams();
  const roomId = params.roomId;

  useEffect(() => {
    const s = socketIO.connect("http://localhost:3001");
    

    s.on("connect", () => {
      setSocket(s);
      s.emit("join", {
        roomId,
      });

      window.navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true
        })
        .then(async (stream) => {
          setVideoStream(stream);
          const videoTracks = stream.getVideoTracks()[0];
          const audioTracks = stream.getAudioTracks()[0];

          pc.addTransceiver(videoTracks, { streams: [stream] });
          pc.addTransceiver(audioTracks, { streams: [stream] });
        });

      s.on("localDescription", async ({ description }) => {
        console.log({ description });
        pc.setRemoteDescription(description);

        pc.ontrack = (e) => {
          setRemoteVideoStream(new MediaStream([e.track]));
        };

        s.on("iceCandidate", ({ candidate }) => {
          pc.addIceCandidate(candidate);
        });

        pc.onicecandidate = ({ candidate }) => {
          s.emit("iceCandidateReply", { candidate });
        };

        await pc.setLocalDescription(await pc.createAnswer());
        s.emit("remoteDescription", { description: pc.localDescription });
      });

      s.on("remoteDescription", async ({ description }) => {
        // Receiving video -
        console.log({ description });
        pc.setRemoteDescription(description);
        pc.ontrack = (e) => {
          setRemoteVideoStream(new MediaStream([e.track]));
        };

        s.on("iceCandidate", ({ candidate }) => {
          pc.addIceCandidate(candidate);
        });

        pc.onicecandidate = ({ candidate }) => {
          s.emit("iceCandidateReply", { candidate });
        };

     
        //s.emit("remoteDescription", { description: pc.localDescription });
      });
    });
  }, []);

  if (!videoStream) {
    return <div>Loading...</div>;
  }

  if (!meetingJoined) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <CentralizedCard>
          <div>
            <Typography textAlign={"center"} variant="h5">
              Hi welcome to meeting {roomId}.
            </Typography>
          </div>
          <br /><br />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              onClick={async () => {
                pc.onicecandidate = ({ candidate }) => {
                  socket.emit("iceCandidate", { candidate });
                }

                if (!addedTracks) {
                  // Using addTransceiver for each track
                  const videoTracks = videoStream.getVideoTracks()[0];
                  const audioTracks = videoStream.getAudioTracks()[0];

                  pc.addTransceiver(videoTracks, { streams: [videoStream] });
                  // pc.addTransceiver(audioTracks, { streams: [videoStream] });

                  addedTracks = true;
                }

                try {
                  await pc.setLocalDescription(await pc.createOffer());
                  console.log({ aa: pc.localDescription });
                  socket.emit("localDescription", { description: pc.localDescription });
                } catch (err) {
                  console.log({ msg: err?.message });
                  console.error(err);
                }

                setMeetingJoined(true);
              }}
              disabled={!socket}
              variant="contained"
            >
              Join meeting
            </Button>
          </div>
        </CentralizedCard>
      </div>
    );
  }

  return (
    <Grid container spacing={2} alignContent={"center"} justifyContent={"center"}>
      <Grid item xs={12} md={6} lg={4}>
        {console.log("//////////// videovdo")}
        {console.log(videoStream)}
        {videoStream ? <Video stream={videoStream} mute={true}  />:"NO LOCAL VIDEO"}
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        {console.log("//////////// remotevdo")}
        {console.log(remoteVideoStream)}
        {remoteVideoStream ? <Video stream={remoteVideoStream} />:"NO REMOTE VIDEO"}
        
      </Grid>
    </Grid>
  );
}
