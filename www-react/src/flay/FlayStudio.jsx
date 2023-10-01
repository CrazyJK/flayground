import React from 'react';

export default class FlayStudio extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flay: props.flay };
    console.log('FlayStudio constructor', this.state.flay.studio);
  }

  render() {
    return (
      <div>
        <label>{this.state.flay.studio}</label>
      </div>
    );
  }
}
