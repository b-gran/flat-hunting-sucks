import React from 'react';
import C from './C';

import './Navigation.css';

function Navigation () {
  return (
    <nav className="nav main-navigation">
      <div className="nav-left">
        <div className="has-text-left">
          <p className="title is-2">Flat Hunting</p>
          <p className="subtitle is-4">Better UI on top of shitty SpareRoom</p>
        </div>
      </div>
    </nav>
  );
}

export default C(Navigation);
