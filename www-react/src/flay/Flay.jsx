import React, { Fragment } from 'react';
import FlayActressList from './FlayActressList.jsx';
import FlayCover from './FlayCover.jsx';
import FlayOpus from './FlayOpus.jsx';
import FlayRelease from './FlayRelease.jsx';
import FlayStudio from './FlayStudio.jsx';
import FlayTitle from './FlayTitle.jsx';

export class Flay extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flay: props.flay, actress: props.actress };
  }

  componentDidMount() {}

  render() {
    return (
      <Fragment>
        <FlayCover flay={this.state.flay} />
        <FlayStudio flay={this.state.flay} />
        <FlayOpus flay={this.state.flay} />
        <FlayTitle flay={this.state.flay} />
        <FlayActressList actress={this.state.actress} />
        <FlayRelease flay={this.state.flay} />
      </Fragment>
    );
  }
}
