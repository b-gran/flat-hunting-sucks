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
        <Navigation />

        <div className="main-content">
          <div className="sidebar">
            <FlatSearch />
          </div>

          <div className="section has-small-padding main-column">
            <FlatListing />
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    page: state.page
  })
)(App);
