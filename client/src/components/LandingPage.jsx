import { Button, Card, TextField, Typography } from "@mui/material";
import "./LandingPage.scss"
import { useNavigate } from "react-router-dom";

export function LandingPage() {
    const navigate = useNavigate()
    function generateRandomString() {
        const length = 32;
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
      
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length);
          result += charset[randomIndex];
        }
      
        return result;
    }
    const handleRedirect =(event)=>{
        event.preventDefault();
        let uniqueId = generateRandomString();
        navigate(`/meeting/${uniqueId}`)
    }
    return <div className="landing_main">
        <Card style={{width:500, padding:"20px", display: "flex", flexDirection: "column"}} className="card_container">
            <Typography variant="h6">Connect to a Meeting</Typography>
            <Button variant="contained" onClick={handleRedirect}>+New Meeting</Button>
            <Card style={{padding:"20px",display: "flex", flexDirection: "column",border:"3px solid #efefef",marginTop:"30px",alignItems:"center"}} className="meeting_input">
                <Typography style={{marginBottom:"20px"}} variant="body1">OR Join an existing meeting...</Typography>
                <div style={{width:"100%"}}>
                    <TextField style={{width: "100%",marginBottom:"20px"}} variant="outlined" placeholder="meeting Id"></TextField>
                    <Button style={{width: "100%"}} variant="contained">{"JOIN->"}</Button>
                </div>
            </Card>
        </Card>
    </div>
}