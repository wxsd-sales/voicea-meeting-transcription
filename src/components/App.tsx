import React, {Component} from 'react';
import {Button, Icon} from '@momentum-ui/react';
import Auth from './Auth';

declare type Props = null;
export default class App extends Component {
  githubPage: string;

  constructor(props: Props) {
    super(props);
    this.state = {}
    this.githubPage = 'https://github.com/WXSD-Sales/WebexVoicea';
  }

  render(): JSX.Element {
    return <div className="app">
      <div className="header">
        <h1>Webex/Voicea - Meeting Transcription</h1>
        <Button circle color="blue" onClick={() => {window.open(this.githubPage, '_blank')}}>
          <Icon name="info_18" />  
        </Button >
      </div>
      <Auth />
    </div>
  }
}