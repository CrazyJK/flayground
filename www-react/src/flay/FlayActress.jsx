import React from 'react';

export default class FlayActress extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flay: props.flay, actress: props.actress };
    console.log('FlayActress constructor', this.state.actress);

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {}

  handleChange(e) {
    console.log(this.state.actress.name, e.target.checked);
    this.setState((prevActress) => ({
      actress: {
        favorite: e.target.checked,
        name: prevActress.name,
        localName: prevActress.localName,
        body: prevActress.body,
        birth: prevActress.birth,
        debut: prevActress.debut,
        height: prevActress.height,
        comment: prevActress.comment,
      },
    }));
    this.props.onActressFavoriteChange(this.state.actress);
  }

  render() {
    return (
      <div>
        <div>
          <label>
            {this.state.actress.favorite ? '★' : '☆'}
            <input type="checkbox" checked={this.state.actress.favorite} onChange={this.handleChange} />
          </label>
          <label>{this.state.actress.name}</label>
          <label>{this.state.actress.localName}</label>
          <label>{this.state.actress.body}</label>
          <label>{this.state.actress.birth}</label>
          <label>{this.state.actress.debut}</label>
          <label>{this.state.actress.height}</label>
        </div>
        <div>
          <label>{this.state.actress.comment}</label>
        </div>
      </div>
    );
  }
}
