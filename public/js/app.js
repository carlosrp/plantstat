/**
 * app.js
 */
"use strict";

/**
 * Dynamic Element class object
 */
var DynElement = function(tag, name, type, x, y, status) {
  "use strict";
  this.tag = tag;
  this.name = name;
  this.type = type;
  this.x = x;
  this.y = y;
  this.width = appModel.typeAttrs[type].width;
  this.status = status;
  this.nStatus = appModel.typeAttrs[type].nStatus;
  this.imgList = appModel.typeAttrs[type].imgList;
  this.imgEl = null;
  this.ref = null;
};
/**
 * Update status received from data store
 */
DynElement.prototype.updateStatus = function(status){
  this.status = status;
  appController.setDynElImg(this, this.getCurrentImg());
};
DynElement.prototype.cycleStatus = function() {
  this.status = ++this.status % this.nStatus;
  appController.setDynElImg(this, this.getCurrentImg());
  // Write value in data store
  this.ref.set(this.status);
};
DynElement.prototype.getCurrentImg = function(){
  return this.imgList[this.status];
};

// Area Id's
const NUM_AREAS = 14;
const AID_INTAKE = 0;
const AID_PT1 = 1;
const AID_PT2 = 2;
const AID_PT3 = 3;
const AID_RO1 = 4;
const AID_RO2 = 5;
const AID_RO3 = 6;
const AID_PT_CHEM = 7;
const AID_RO_CHEM = 8;
const AID_SLUDGE = 9;
const AID_LIME = 10;
const AID_POTAB = 11;
const AID_TRANSFER = 12;
const AID_DPS = 13;
const STD_WIDTH = 1920;  // Reference document/window dimensions
const STD_HEIGHT = 1080; // Reference document/window dimensions

/**
 *
 */
var appModel = {
  initialised: false,
  activeArea: null,
  areas: [
    { id: 'intake', name: 'Intake/Outfall', menu: 'menu-intake', loaded: false, bckImg: 'images/intake-background.svg' },
    { id: 'pret-S1', name: 'Pre-Treatment S1', menu: 'menu-pt1', loaded: false, bckImg: 'images/pt1-background.svg' },
    { id: 'pret-S2', name: 'Pre-Treatment S2', menu: 'menu-pt2', loaded: false, bckImg: 'images/pt2-background.svg' },
    { id: 'pret-S3', name: 'Pre-Treatment S3', menu: 'menu-pt3', loaded: false, bckImg: 'images/pt3-background.svg' },
    { id: 'ro-S1', name: 'RO S1', menu: 'menu-ro1', loaded: false, bckImg: 'images/ro1-background.svg' },
    { id: 'ro-S2', name: 'RO S2', menu: 'menu-ro2', loaded: false, bckImg: 'images/ro2-background.svg' },
    { id: 'ro-S3', name: 'RO S3', menu: 'menu-ro3', loaded: false, bckImg: 'images/ro3-background.svg' },
    { id: 'pt-chem', name: 'Pre-Treat Chemicals', menu: 'menu-pt-chem', loaded: false, bckImg: 'images/pt-chem-background.svg' },
    { id: 'ro-chem', name: 'RO Chemicals', menu: 'menu-ro-chem', loaded: false, bckImg: 'images/ro-chem-background.svg' },
    { id: 'sludge', name: 'Sludge', menu: 'menu-sludge', loaded: false, bckImg: 'images/sludge-background.svg' },
    { id: 'lime', name: 'Lime', menu: 'menu-lime', loaded: false, bckImg: 'images/lime-background.svg' },
    { id: 'potab', name: 'Potabilisation', menu: 'menu-potab', loaded: false, bckImg: 'images/potab-background.svg' },
    { id: 'transfer', name: 'Transfer', menu: 'menu-transfer', loaded: false, bckImg: 'images/transfer-background.svg' },
    { id: 'dps', name: 'DPs', menu: 'menu-dps', loaded: false, bckImg: 'images/dps-background.svg' }
  ],
  typeAttrs: [],
  //dynElements: new Array(NUM_AREAS), // Collections of dynamic elements for each area
  dynElements: [NUM_AREAS], // Collections of dynamic elements for each area
  loadArea: function( idxArea ) {

    // Check if data initilisation is finished
    if( !this.initialised )
    {
      console.log('Data initialisation not finished yet!');
      return;
    }
    // Previously loaded area ?
    if( this.activeArea ) {
      console.log('Previously loaded area', this.activeArea, this.areas[this.activeArea].name);
      if( this.activeArea == idxArea ) {
        console.log('Selected the same area => not doing anything');
        return;
      }
      // Hide  prev area objects
      appController.hideArea(this.activeArea);
    }
    // Set new active area
    this.activeArea = idxArea;
    var areaName = this.areas[idxArea].name;
    var areaId = this.areas[idxArea].id;
    console.log('Selected area', idxArea, areaName);
    // If first time loading area, read dynamic elements
    if( !this.isAreaLoaded(idxArea) ) {
      // First, add background img
      appController.initArea( idxArea, this.areas[idxArea].bckImg );
      // Get list of dynamic elements
      var dynElementsRef = appController.rootRef.child('dynElements/' + idxArea);
      dynElementsRef.once('value').then(function(dynElsSnap) {
        console.log('listDynElements returned:', dynElsSnap.val());
        var listDynElements = dynElsSnap.val();
        // Create array for the selected area dynElements
        appModel.dynElements[idxArea] = [];
        // Add dynamic elements
        listDynElements.forEach(function(el, idxDynEl) {
          console.log('Adding element:', el.tag, 'at (', el.x, el.y, ')');
          // -> Create JS object for dyn element (sets initial status)
          var dynEl = new DynElement(el.tag, el.name, el.type, el.x, el.y, el.status);
          appController.addDynElement( idxArea, idxDynEl, dynEl );
          appModel.dynElements[idxArea].push( dynEl );
          // Listen for dynElements status changes
          dynEl.ref = dynElementsRef.child( idxDynEl + '/status' );
          dynEl.ref.on('value', function(snapStatus) {
            dynEl.updateStatus(snapStatus.val());
          });
        });
        // Set area as loaded
        appModel.setAreaLoaded(idxArea);
      });
    }
    // Show new area objects
    appController.showArea(idxArea);
  },
  getAreaIdx: function( areaId ){
    var idxFound = null;
    let area = this.areas.some(function(areaId, idx, arr) {
      if(arr.name === areaId) {
        idxFound = idx;
        return true;
      }
      return false;
    });
    return idxFound;
  },
  isAreaLoaded: function( aid ) {
    // Check for correct aid
    if( aid >= this.areas.length ) {
      return false;
    }
    return this.areas[aid].loaded;
  },
  updateAreaField: function( aid, fieldName, val ) {
    // Check for correct aid
    if( aid >= this.areas.length ) {
      return;
    }
    let area = this.areas[aid];
    switch(fieldName) {
      case 'loaded':
        area[fieldName] = val;
    }
  },
  setAreaLoaded: function( aid ) {
    this.updateAreaField( aid, 'loaded', true);
  },
  rotateDynElement: function(idxArea, idxDynEl) {
    console.log('Element', appModel.dynElements[idxArea][idxDynEl].tag, 'clicked');
    appModel.dynElements[idxArea][idxDynEl].cycleStatus();
  }
};

var appController = {

  config: {
    apiKey: "AIzaSyBmWsoB6qtm1nLerSf0yY_Jx_3SwphyLTE",
    authDomain: "plantstat.firebaseapp.com",
    databaseURL: "https://plantstat.firebaseio.com",
    storageBucket: "plantstat.appspot.com",
    messagingSenderId: "363782380167"
  },
  rootRef: {},
  init: function() {
    // Initialise appView
    appView.init(appModel.areas);
    // Initialize Firebase
    firebase.initializeApp(this.config);
    this.rootRef = firebase.database().ref();
    // Listen for auth state changes
    this.fbListenAuthChanges();
    // Read basic configuration from datastore
    const typeAttrsRef = this.rootRef.child('typeAttrs');
    typeAttrsRef.once('value').then(function(typeAttrsSnap) {
      appModel.typeAttrs = typeAttrsSnap.val();
      appModel.initialised = true;  // Flag to show initialised is finished (it is set asynchronously)
      console.log('Initialisation finished');
    });
  },
  /**
   * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
   * programmatic token refresh but not a User status change.
   */
  currentUID: null,
  currentUserEmail: null,
  currentUsername: null,
  selectArea: function(idxArea) {
    appModel.loadArea(idxArea);
  },
  initArea: function(idxArea, bckImg) {
    appView.initAreaDOM(idxArea, bckImg);
  },
  showArea: function(idxArea) {
    appView.showArea(idxArea);
  },
  hideArea: function(idxArea) {
    appView.hideArea(idxArea);
  },
  addDynElement: function(idxArea, idxDynEl, dynEl) {
    appView.addDynElementToDOM( idxArea, idxDynEl, dynEl );
  },
  setDynElImg: function(dynEl, img) {
    appView.setDynElImg(dynEl, img);
  },
  rotateDynElement: function(idxArea, idxDynEl) {
    appModel.rotateDynElement(idxArea, idxDynEl);
    // In Progress -- console.log('Element', dynElementsCollection[id].tag, 'clicked');
    // In Progress -- dynElementsCollection[id].cycleStatus();
  },
  fbLogin: function( email, password ) {
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      // Login error
      console.log(error.message);
      appView.errLogin(error.message);
    });
  },
  /**
   * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
   */
  onAuthStateChanged: function(user) {
    // We ignore token refresh events.
    if (user && this.currentUID === user.uid) {
      return;
    }
    // First, cleanup login fields after successful login, or logout
    appView.cleanupLogin();
    // Are we logged in ?
    if (user) {
      // Logged in
      this.currentUID = user.uid;
      this.currentUserEmail = user.email;
      appView.loggedIn(user.email);
      appController.fbWriteUserData(user.uid, user.displayName, user.email);
      //startDatabaseQueries();
    } else {
      // Logged out
      // Set currentUID to null.
      this.currentUID = null;
      this.currentUserEmail = null;
      // Display the splash page where you can sign-in.
      appView.loggedOut();
    }
  },
  /**
   * Writes the user's data to the database.
   */
  fbWriteUserData: function(uid, displayName, email) {
    firebase.database().ref('users/' + uid).set({
      username: displayName,
      email: email
    });
  },
  fbListenAuthChanges: function() {
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged);
  },
  fbLogout: function() {
    firebase.auth().signOut();
  },
  /**
   * Send Password reset email for current user
   */
  fbPasswordResetEmail: function() {

  }
};

var appView = {
  // Shortcuts to DOM Elements.
  splashPage: {},
  mainScreen: {},
  fsLogin: {},
  btnLogin: {},
  btnLogout: {},
  inpEmail: {},
  inpPassword: {},
  msgLogin: {},
  txtUsername: {},
  aMenuOpts: new Array(NUM_AREAS),
  divArea: new Array(NUM_AREAS),
  resizeTimeout: {},
  actualWiewWidth: STD_WIDTH,
  actualViewHeight: STD_HEIGHT,
  actualWidthRatio: 1.0,
  /**
   * Initialise app View object
   */
  init: function(areas) {
    // Get DOM elements
    this.splashPage = document.getElementById('page-splash');
    this.mainScreen = document.getElementById('main-screen');
    this.fsLogin = document.getElementById('form-fields');
    this.btnLogin = document.getElementById('login-button');
    this.btnLogout = document.getElementById('sign-out');
    this.inpEmail = document.getElementById('inputEmail');
    this.inpPassword = document.getElementById('inputPassword');
    this.msgLogin = document.getElementById('login-message');
    this.txtUsername = document.getElementById('username');
    areas.forEach( function(el, idx) {
      appView.aMenuOpts[idx] = document.getElementById( el.menu );
      appView.divArea[idx] = document.getElementById( el.id );
    });

    // Bind Sign in button.
    this.btnLogin.addEventListener('click', function(e) {
      appView.msgLogin.classList.add('hidden');
      appView.fsLogin.setAttribute('disabled', '');
      appController.fbLogin(appView.inpEmail.value, appView.inpPassword.value);
    });

    // Bind Sign out button.
    this.btnLogout.addEventListener('click', function() {
      appController.fbLogout();
    });

    // Bind menu options
    this.aMenuOpts.forEach(function(opt, idx, arr) {
      opt.addEventListener('click', function() {
        appController.selectArea(idx);
      });
    });

    // Find initial sizing
    this.getActualViewSize();
    console.log('Initial width ratio:', this.actualWidthRatio);

    // Add resising listener
    window.addEventListener('resize', this.resizeThrottler);
  },
  resizeThrottler: function() {
    // ignore resize events as long as an actualResizeHandler execution is in the queue
    if ( !this.resizeTimeout ) {
      this.resizeTimeout = setTimeout(function() {
        this.resizeTimeout = null;
        appView.actualResizeHandler();
       }, 1000);
    }
  },
  getActualViewSize: function() {
    appView.actualViewWidth = document.documentElement.clientWidth;
    appView.actualViewHeight = document.documentElement.clientHeight;
    appView.actualWidthRatio = appView.actualViewWidth / STD_WIDTH;
    // Set initial application window size
    var mainScreen = document.getElementById('main-screen');
    mainScreen.style.width = STD_WIDTH * this.actualWidthRatio + "px";
 },
  actualResizeHandler: function() {
    appView.getActualViewSize();
    console.log('Resizing: width ratio', appView.actualWidthRatio );
    ///////
    // ToDo: find all backgrounds/dyn objects created and resize them...
  },
  initAreaDOM: function(idxArea, bckImgFile) {
    var bckImg = document.createElement('img');
    bckImg.setAttribute('src', bckImgFile);
    bckImg.setAttribute('class', 'plant-bck');
    bckImg.style.left = "0px";
    bckImg.style.top = "0px";
    bckImg.style.width = STD_WIDTH * this.actualWidthRatio + "px"; // Scale background to current view
    bckImg.style.height = STD_HEIGHT * this.actualWidthRatio + "px"; // Scale background to current view
    this.divArea[idxArea].appendChild(bckImg);
  },
  // resizeAreaBck: function(idxArea) {
  //   this.divArea[idxArea].
  // },
  addDynElementToDOM: function(idxArea, idxDynEl, dynEl) {
    console.log('..adding element to DOM at (', dynEl.x * this.actualWidthRatio, ',', dynEl.y * this.actualWidthRatio, ') width ', dynEl.width * this.actualWidthRatio);
    dynEl.imgEl = document.createElement('img');
    dynEl.imgEl.setAttribute('class', 'plant-obj');
    dynEl.imgEl.setAttribute('src', dynEl.getCurrentImg());
    dynEl.imgEl.style.left = dynEl.x * this.actualWidthRatio + "px"; // Scale position to current view size
    dynEl.imgEl.style.top = dynEl.y * this.actualWidthRatio + "px";  // Scale position to current view size
    dynEl.imgEl.style.width = dynEl.width * this.actualWidthRatio + "px";        // Scale object size to current view
    dynEl.imgEl.setAttribute('onclick', 'appView.dynElementClicked(' + idxArea + ',' + idxDynEl + ')');
    this.divArea[idxArea].appendChild(dynEl.imgEl);
  },
  setDynElImg: function(dynEl, img) {
    dynEl.imgEl.setAttribute('src', dynEl.getCurrentImg());
  },
  showArea: function(idxArea) {
    this.divArea[idxArea].classList.remove('hidden');
  },
  hideArea: function(idxArea) {
    this.divArea[idxArea].classList.add('hidden');
  },
  errLogin: function(msg) {
    this.msgLogin.innerHTML = msg;
    this.msgLogin.classList.remove('hidden');
    this.fsLogin.removeAttribute('disabled');
  },
  cleanupLogin: function() {
    this.inpEmail.value = '';
    this.inpPassword.value = '';
    this.fsLogin.removeAttribute('disabled');
  },
  loggedIn: function(email) {
    this.txtUsername.innerHTML = email;
    this.splashPage.style.display = 'none';
    this.mainScreen.style.display = '';
  },
  loggedOut: function() {
    this.splashPage.style.display = '';
    this.mainScreen.style.display = 'none';
  },
  dynElementClicked: function(idxArea, idxDynEl) {
    appController.rotateDynElement(idxArea, idxDynEl);
  }
};

// Bindings on load.
window.addEventListener('load', function() {
  appController.init();
}, false);
