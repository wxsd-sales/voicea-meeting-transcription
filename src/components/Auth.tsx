import React, {useState, useEffect} from 'react';
import {Button, Input} from '@momentum-ui/react';
import Meetings from './Meetings';
import Webex from 'webex';

function useForceUpdate(){
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value => value + 1); // update the state to force render
}

export default (props): JSX.Element => {
  const [disableToken, updateDisableToken] = useState(false);
  const [tokenInputValue, updateTokenInputValue] = useState("");
  const [tokenMessage, updateTokenMessage] = useState({});
  const [token, updateToken] = useState("");
  const [disableAuth, updateDisableAuth] = useState(true);
  const [connectingToWebex, updateConnectingToWebex] = useState(false);
  const [meetings, updateMeetings] = useState({});
  const [sessionID, updateSessionID] = useState("");

  useEffect(() => {
    const newToken = localStorage.getItem('token');

    if(newToken) {
      updateTokenInputValue(newToken);
      updateToken(newToken);
      updateDisableAuth(false);
    }
  }, []);

  const initWebex = async (event) => {
    event.preventDefault();

    updateConnectingToWebex(true);
    updateDisableAuth(true);
    
    const webex = new Webex({
      credentials: token
    });

    try {
      await webex.meetings.register();
      await webex.meetings.syncMeetings();

      updateSessionID(webex.sessionId)
      localStorage.setItem('token', token);

      updateDisableToken(true);
      updateDisableToken(true);
      updateTokenMessage({message: 'Authenticated!', type: 'success'})

      webex.meetings.on('meeting:added', () => {
        updateMeetings({...webex.meetings.meetingCollection.meetings});
      });
   
      setTimeout(() => {
        updateMeetings(webex.meetings.meetingCollection.meetings);
      }, 1000);

    } catch (error) {

      console.log(error)
      updateMeetings({});
      updateDisableToken(false);
      updateTokenMessage({message: 'Not Authenticated!', type: 'error'})
    }

    updateConnectingToWebex(false);
  }

  const handleTokenChange = (event) => {
    const token = event.target.value;

    if(token === "") {
      updateDisableAuth(true);
      updateTokenMessage({message: 'Token is required!', type: 'error'});
    }
    else {
      updateDisableAuth(false);
      updateTokenMessage({});
      updateToken(token);
    }
  }

  return (
    <div className="auth">
        <div className="tokenSection">
          <div className="tokenInput">
              <Input 
                name="Token"
                label="Token"
                htmlId="Token"
                inputSize="small-5"
                disabled={disableToken}
                value={tokenInputValue}
                messageArr={[tokenMessage]}
                onChange={(event) => {handleTokenChange(event)}}
                placeholder="Your Access Token" />
          </div>
          <Button 
            disabled={disableAuth}
            onClick={async (event) => {await initWebex(event)}}
            color="green"
          >
            {connectingToWebex ? "Initiating..." : "Authenticate"}
          </Button>
      </div>
        <Meetings meetings={meetings} token={token} sessionID={sessionID}/>
    </div>
  );
}