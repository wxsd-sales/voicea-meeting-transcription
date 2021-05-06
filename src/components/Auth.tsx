import React, {Component} from 'react';
import Webex from 'webex';
import moment from 'moment';
import Meetings from './Meetings';
interface Props {
  showApp: (show: boolean) => void
}
export default class Auth extends Component {
  webex: any;
  token: string;
  state: any;
  props: any;

  constructor(props: Props) {
    super(props);

    this.props = props;
    this.token = "";
    this.state = {
      webexIsConnected: false,
      meetings: {},
      sessionID: '',
      token: ''
    };
    this.webex = new Webex({
      config: {
        credentials: {
          client_id: 'Ce2ceb5eba6c370acd6ba9c5f003290e39649dbf0001e521abceefb0d1b942dda',
          // redirect_uri: 'https://webexvoicea.ngrok.io',
          redirect_uri: 'https://wxsd-sales.github.io/WebexVoicea/',
          scope: 'spark:all spark:kms'
        }
      }
    }); 
  }

  startListeningToMeetings(): void {
    this.webex.meetings.on('meeting:added', () => {
      this.setState({
        meetings: {...this.webex.meetings.meetingCollection.meetings}
      });
    });

    this.webex.meetings.on('meeting:removed', () => {
      this.setState({
        meetings: {...this.webex.meetings.meetingCollection.meetings}
      });
    });

  }

  async setupMeetingPlugin(): Promise<void> {
    try {
      await this.webex.meetings.register();
      await this.webex.meetings.syncMeetings();
  
      this.startListeningToMeetings();

      setTimeout(() => {
        this.setState({
          webexIsConnected: true,
          sessionID: this.webex.sessionId,
          token: localStorage.getItem('token').replace('Bearer ', ''),
          meetings: this.webex.meetings.meetingCollection.meetings
        });

        this.props.showApp(true);
      }, 1000);

    } catch (error) {
      console.log('had some trouble with setting up the webex meeting plugin', error);
    }
  }

  async validateToken(): Promise<void> {
    if(localStorage.getItem('token')) {
      if((moment(localStorage.getItem('expires_in')).diff(moment.utc()) < 0)) {
        localStorage.removeItem('token');
        localStorage.removeItem('expires_in');
        this.webex.authorization.initiateImplicitGrant();
      } else {
        const token = localStorage.getItem('token').replace('Bearer ', '');
        this.webex = new Webex({
          credentials: token
        });
  
        await this.setupMeetingPlugin();
      }
    } else if (this.webex.credentials.supertoken) {
      const {access_token, expires_in} = this.webex.credentials.supertoken;

      localStorage.setItem('token', access_token);
      localStorage.setItem('expires_in', expires_in);

      await this.setupMeetingPlugin();
    } else {
      this.webex.authorization.initiateImplicitGrant();
    }
  }
  
  async requestToken(): Promise<void> {
    this.webex.on('ready', async() => {
      await this.validateToken();
    })
  }

  async componentDidMount(): Promise<void> {
    await this.requestToken();
  }

  render(): JSX.Element {
    const {webexIsConnected, meetings, token, sessionID} = this.state;

    return (
      <div className="auth">
        {webexIsConnected && 
          <Meetings meetings={meetings} token={token} sessionID={sessionID} />
        }
      </div>);
  } 
}
