import React, {Component} from 'react';
import {Button, Icon, Spinner} from '@momentum-ui/react';
import Auth from './Auth';

declare type Props = null;
export default class App extends Component {
  githubPage: string;
  state: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      showApp: false
    }
    this.githubPage = 'https://github.com/WXSD-Sales/WebexVoicea/';
  }

  toggleShowApp(flag: boolean): void {
    this.setState({showApp: flag});
  }

  render(): JSX.Element {
    return <div className="app">
      { this.state.showApp ? <div className="header">
        <h1>Webex/Voicea - Meeting Transcription</h1>
        <Button circle color="blue" onClick={() => {window.open(this.githubPage, '_blank')}}>
          <Icon name="info_18" />  
        </Button >
      </div> : <Spinner /> }
      <Auth showApp={this.toggleShowApp.bind(this)} />
    </div>
  }
}