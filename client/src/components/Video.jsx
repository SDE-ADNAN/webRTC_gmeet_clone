import { useEffect, useRef } from "react";

export const Video = ({stream,mute=false}) => {
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
      }, [videoRef,stream])
    
      return (
        <div>
          <div>
            <video style={{borderRadius: 10}} ref={videoRef}  width="100%" muted={mute} autoPlay={true} playsInline={true} />
          </div>
        </div>
      )
}