import React from 'react';
import ReactDOM from 'react-dom';
import './assets/index.css';
import { BrowserRouter as Router  } from "react-router-dom";
import { Webcall } from './VideoSetups/Webcall'

window.JitsiMeetJS.init()

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Webcall />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

