import React from 'react';
import FlayActress from './FlayActress.jsx';

export default class FlayActressList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flay: props.flay, actress: props.actress };
    console.log('FlayActressList constructor', this.state.actress);
  }

  handleActressFavoriteChange(checked) {
    console.log('FlayActressList actress checked', checked);
  }

  render() {
    return (
      <div>
        {this.state.actress.map((actress, index) => (
          <FlayActress key={actress.name} flay={this.state.flay} actress={actress} onActressFavoriteChange={this.handleActressFavoriteChange} />
        ))}
      </div>
    );
  }
}
