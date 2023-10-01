import React from 'react';

export default class FlayOpus extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flay: props.flay };
    console.log('FlayOpus constructor', this.state.flay.opus);
  }

  render() {
    return (
      <div>
        <label>{this.state.flay.opus}</label>
      </div>
    );
  }
}
