import React from 'react';

export default class FlayRelease extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flay: props.flay };
    console.log('FlayRelease constructor', this.state.flay.release);
  }

  render() {
    return (
      <div>
        <label>{this.state.flay.release}</label>
      </div>
    );
  }
}
