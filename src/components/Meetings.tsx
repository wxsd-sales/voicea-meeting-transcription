import React, {useState, useEffect, useRef} from 'react';
import {List, ListItem, Spinner} from '@momentum-ui/react';
import Voicea from '../voicea';
interface Props {
  meetings: any,
  token: string,
  sessionID: string
}
export default (props: Props): JSX.Element => {
  const {meetings, token, sessionID} = props;
  const [transcription, updateTranscription] = useState("");
  const [isListening, updateListening] = useState(false);
  const endRef = useRef(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom();
  }, [transcription]);

  const selectMeeting = async (event) => {
    event.preventDefault();
    
    const meetingID = Object.values(meetings).find((meeting: any) => meeting.meetingInfo.meetingName === event.target.innerText).id;
    const meeting = meetings[meetingID];
    
    updateListening(true);
    
    try {
      const voicea = new Voicea(meeting);
      
      await voicea.openSocket(token, sessionID);
      
      updateListening(false);

      voicea.getTranscription(meeting, updateTranscription.bind(this));
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
      <div className="content">
        {
          isListening ? 
          <Spinner /> :
          <div className="transcription">{transcription}
            <div ref={endRef} />
          </div>
        }
      </div>
    </div>
  );
}