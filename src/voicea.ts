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
    const pattern = new RegExp(msg, 'i');

    return str.slice(0, index) + str.slice(index).replace(pattern, newMessage);
  }

  getTranscription(callback: (message:string)=>void): void {
    let message = "";
    let currentMessage = "";
    let previousMessage = "";

    this.socket.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      currentMessage = messageData.data?.voiceaPayload?.data || "";
      
      if(messageData.data?.voiceaPayload?.type === "transcript_interim_results") {
        if(previousMessage === "") {
          message = message.concat(currentMessage);
        } else{
          message = this.replaceLastOccurrence(message, previousMessage, currentMessage);
        }
        previousMessage = currentMessage;
      } else {
        message = this.replaceLastOccurrence(message, previousMessage, '');
        message = message.concat(currentMessage);
        previousMessage = "";
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