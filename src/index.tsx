import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import firebase from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCBWyZz0y45PaLxyIEymjBatecunk6SQ_M",
  authDomain: "vectis-gojs.firebaseapp.com",
  projectId: "vectis-gojs",
  storageBucket: "vectis-gojs.appspot.com",
  messagingSenderId: "834367723407",
  appId: "1:834367723407:web:8e72b9d6cdaa9d20931dfa",
};

firebase.initializeApp(firebaseConfig);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
