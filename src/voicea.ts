import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';


export default class Voicea {
  datachannelUrl: string;
  deviceUrl: string;
  socket: any;

  constructor(meeting: any) {
    const {deviceUrl, locusInfo: {info: {datachannelUrl}}} = meeting;

    this.deviceUrl = deviceUrl;
    this.datachannelUrl = datachannelUrl;
    this.socket = {};
  }

  async generateSocketUrl(token: string): Promise<string> {
    let url = '';

    try {
      const response = await axios({
        method: 'post',
        url: this.datachannelUrl,
        data: {deviceUrl: this.deviceUrl},
        headers: {'Authorization': `Bearer ${token}`}
      });

      const {data: {webSocketUrl}} = response;
      url = `${webSocketUrl}?outboundWireFormat=text&bufferStates=true&aliasHttpStatus=true`;

    } catch(error) {
      console.log(`request web socket url ${error.message}`);
    }

    return url;
  }

  async openSocket(token: string, sessionID: string): Promise<void> {
    this.socket = new WebSocket(await this.generateSocketUrl(token));

    this.socket.onopen = () => {
      this.socket.send(JSON.stringify({
        id: uuidv4(),
        type: 'authorization',
        data: {"token": `Bearer ${token}`},
        trackingId: sessionID + Date.now().toString()
      }));
    }
  }

  replaceLastOccurrence(str: string, msg: string, newMessage:string): string {
    const index = str.toLowerCase().lastIndexOf(msg.toLowerCase());
    // const pattern = new RegExp(msg, 'i');

    return str.slice(0, index) + str.slice(index).replace(msg, newMessage);
  }

  getCurrentSpeaker(meeting, csis): any {
    return Object.values(meeting.members.membersCollection.members).find((member: any) => {
      const memberCSIs = member.participant.status.csis;
      let selfIsSpeaking = false;

      for(const csi of csis) {
        if(memberCSIs.includes(csi)) {
          selfIsSpeaking = true;
          break;
        }
      }

      return selfIsSpeaking;
    });
  }

  getTranscription(meeting: any, callback: (message:string)=>void): void {
    let message = "";
    let currentMessage = "";
    let previousMessage = "";
    let previousSpeaker;
    let currentSpeaker;

    this.socket.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      const csis = messageData.data?.voiceaPayload?.csis || [];
      currentSpeaker = this.getCurrentSpeaker(meeting, csis);
      currentMessage = messageData.data?.voiceaPayload?.data || "";

      if(messageData.data?.voiceaPayload?.type === "transcript_interim_results") {
        if(previousMessage === "") {
          if(previousSpeaker?.name !== currentSpeaker.name) { 
            message = message.concat(`\n\n${currentSpeaker.name}: ${currentMessage}`);
          } else {
            message = message.concat(currentMessage);
          }
        } else{
          message = this.replaceLastOccurrence(message, previousMessage, currentMessage);
        }
        previousMessage = currentMessage;
      } else if (messageData.data?.voiceaPayload?.type === "transcript_final_result") {
        if(currentSpeaker.name !== previousSpeaker?.name) {
          
          if(previousSpeaker) {
            message = this.replaceLastOccurrence(message, `\n\n${currentSpeaker.name}: `, '');
            currentMessage = `\n\n${currentSpeaker.name}: ${currentMessage}`;
          } else {
            message = this.replaceLastOccurrence(message, `${currentSpeaker.name}: `, '');
            currentMessage = `${currentSpeaker.name}: ${currentMessage}`;
          }
        }

        message = this.replaceLastOccurrence(message, previousMessage, '');
        message = message.concat(currentMessage);
        previousMessage = "";
        previousSpeaker = currentSpeaker;
      }

    this.socket.send(JSON.stringify({"messageId": messageData.id, "type": "ack"}));

    callback(message);
    };
  }

  closeSocket(): void {
    this.socket.on('close', (event) => {
      console.log('Socket has closed', event)
    })
  }
}