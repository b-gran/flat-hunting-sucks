import React, { Component } from 'react';

import Navigation from './Navigation';
import FlatSearch from './FlatSearch';
import FlatListing from './FlatListing';

import './App.css';

export default function App () {
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
App.displayName = 'App'
