import React, {useState} from 'react';
import {List, ListItem} from '@momentum-ui/react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  meetings: any,
  token: string,
  sessionID: string
}

export default (props: Props): JSX.Element => {
  const {meetings, token, sessionID} = props;
  const [transcription, updateTranscription] = useState("");
  let message = "";

  const selectMeeting = async (event) => {
    event.preventDefault();

    const meetingID = Object.values(meetings).find((meeting: any) => meeting.meetingInfo.meetingName === event.target.innerText).id;
    const meeting = meetings[meetingID];
    const {deviceUrl, locusInfo: {info: {datachannelUrl}}} = meeting;
    try {   
      const response =  await axios({
        method: 'post',
        url: datachannelUrl,
        data: {deviceUrl},
        headers: {'Authorization': `Bearer ${token}`}
      });
      
      const {data: {webSocketUrl}} = response;
      const socket = new WebSocket(`${webSocketUrl}?outboundWireFormat=text&bufferStates=true&aliasHttpStatus=true`);

      	// Open the socket
      socket.onopen = function(event) {
        // Send an initial message
        socket.send(JSON.stringify({
          id: uuidv4(),
          type: "authorization",
          data: { "token": "Bearer " + token },
          trackingId: `${sessionID}_${Date.now().toString()}`
        }));

        // Listen for messages
        socket.onmessage = function(event) {
          const messageData = JSON.parse(event.data);
          
          if(messageData.data?.voiceaPayload?.type === "transcript_final_result"){
            message = message.concat(messageData.data?.voiceaPayload?.data);
            console.log(message);
            updateTranscription(message)
          }
          
          socket.send(JSON.stringify({"messageId": messageData.id, "type": "ack"}));
        };

        // Listen for socket closes
        socket.onclose = function(event) {
          console.log('Client notified socket has closed', event);
        };
      };
    } catch(error) {
      console.log(error.message);
    }
  };

  const lists = Object.keys(meetings).map(key =>{
    return <ListItem label={meetings[key].meetingInfo.meetingName} key={key} onClick={async (event) => {await selectMeeting(event)}}/>
  });
    
  return (
    <div className="meetings">
      <h3>List of Meetings</h3>
      <List >
        {lists}
      </List>
      <div className="transcription">{transcription}</div>
    </div>
  );
}