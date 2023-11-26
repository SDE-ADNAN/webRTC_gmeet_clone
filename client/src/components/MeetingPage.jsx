import React, { useEffect, useState } from "react";
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

export function MeetingPage() {
  const [socket, setSocket] = useState(null);
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [videoStream, setVideoStream] = useState();
  const [remoteVideoStream, setRemoteVideoStream] = useState();
  
  const params = useParams();
  const roomId = params.roomId;

  useEffect(() => {
    const s = socketIO.connect("https://webrtc-gmeet-clone.onrender.com");
    s.on("connect", () => {
      setSocket(s);
      s.emit("join", {
        roomId,
      });

      window.navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then(async (stream) => {
          setVideoStream(stream);
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });

          pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
              if (track.kind === 'video') {
                setRemoteVideoStream(new MediaStream([track]));
              }
            });
          };
        })
        .catch((error) => {
          console.error('Error accessing media devices:', error);
        });

      s.on("localDescription", async ({ description }) => {
        pc.setRemoteDescription(description);

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
        pc.setRemoteDescription(description);

        s.on("iceCandidate", ({ candidate }) => {
          pc.addIceCandidate(candidate);
        });

        pc.onicecandidate = ({ candidate }) => {
          s.emit("iceCandidateReply", { candidate });
        };
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
          <br/><br/>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              onClick={async () => {
                pc.onicecandidate = ({ candidate }) => {
                  socket.emit("iceCandidate", { candidate });
                };
                
                try {
                  await pc.setLocalDescription(await pc.createOffer());
                  socket.emit("localDescription", { description: pc.localDescription });
                } catch (err) {
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
        <Video stream={videoStream} mute={false}/>
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <Video stream={remoteVideoStream} muted={false} />
      </Grid>
    </Grid>
  );
}
