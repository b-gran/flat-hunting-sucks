import React, { Component } from 'react';
import { connect } from 'react-redux'

import Navigation from './Navigation';
import FlatSearch from './FlatSearch';
import FlatListing from './FlatListing';

import './App.css';

class App extends Component {
  render () {
    return (
      <div className="app">
        <Navigation/>

        {
          this.props.page === 'form'
            ? <FlatSearch/>
            : <FlatListing/>
        }
      </div>
    );
  }
}

export default connect(
  state => ({
    page: state.page
  })
)(App);
