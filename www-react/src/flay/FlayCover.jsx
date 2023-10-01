import React from 'react';

export default class FlayCover extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flay: props.flay };
    console.log('FlayCover constructor', this.state.flay.opus);
  }

  render() {
    return (
      <div>
        <img src={'/static/cover/' + this.state.flay.opus} />
      </div>
    );
  }
}
