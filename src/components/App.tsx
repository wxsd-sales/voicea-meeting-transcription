import React, {Component} from 'react';
import Auth from './Auth';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {}
  }

  render(): JSX.Element {
    return <div className="app">
      <h1>Webex/Voicea - Meeting Transcription</h1>
      <Auth />
    </div>
  }
}