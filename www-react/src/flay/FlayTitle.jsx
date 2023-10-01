import React from 'react';

export default class FlayTitle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flay: props.flay };
    console.log('FlayTitle constructor', this.state.flay.title);
  }

  render() {
    return (
      <div>
        <label>{this.state.flay.title}</label>
      </div>
    );
  }
}
