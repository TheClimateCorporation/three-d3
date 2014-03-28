define([
  'backbone',
  'three'
], function(Backbone, THREE) {

  // set some camera attributes
  var VIEW_ANGLE = 75,
    ASPECT = window.innerWidth / window.innerHeight,
    NEAR = 0.1,
    FAR = 10000;

  return Backbone.View.extend({

    _lastLoop: null,
    _fps: null,

    _renderer: null,
    _camera: null,
    _scene: null,

    _cubeMaterial: null,
    _cubeGeometry: null,
    _cube: null,

    _sphereMaterial: null,
    _sphere: null,
    _sphereMesh: null,
    _pointLight: null,

    initialize: function() {

      // create a WebGL renderer, camera
      // and a scene
      this._renderer = new THREE.WebGLRenderer();
      this._camera = new THREE.PerspectiveCamera(
          VIEW_ANGLE,
          ASPECT,
          NEAR,
          FAR);

      this._scene = new THREE.Scene();

      // add the camera to the scene
      this._scene.add(this._camera);

      this.initMaterials();
      this.initGeometries();
      this.initLighting();

      // the camera starts at 0,0,0
      // so pull it back
      this._camera.position.x = 5;
      this._camera.position.y = 5;
      this._camera.position.z = 5;
      this._camera.lookAt(new THREE.Vector3(0, 0, 0));

      // start the renderer
      this._renderer.setSize(window.innerWidth, window.innerHeight);
    },

    initMaterials: function() {

      // Cube
      this._cubeMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00
      });

      // create the sphere's material
      this._sphereMaterial = new THREE.MeshLambertMaterial({
        color: 0xCC0000
      });
    },

    initGeometries: function() {

      // Cube
      this._cubeGeometry = new THREE.CubeGeometry(4, 4, 4);
      this._cube = new THREE.Mesh(this._cubeGeometry, this._cubeMaterial);

      // set up the sphere vars
      var radius = 50,
          segments = 16,
          rings = 16;

      // create a new mesh with sphere geometry
      //this._sphere = new THREE.SphereGeometry(radius, segments, rings);
      //this._sphereMesh =  new THREE.Mesh(this._sphere, this._sphereMaterial);

      this._scene.add(this._cube);

      // add the sphere to the scene
      //this._scene.add(this._sphereMesh);
    },

    initLighting: function() {

      // create a point light
      this._pointLight = new THREE.PointLight(0xFFFFFF);

      // set its position
      this._pointLight.position.x = 5;
      this._pointLight.position.y = 5;
      this._pointLight.position.z = 5;

      // add to the scene
      this._scene.add(this._pointLight);
    },

    render: function() {
      this.$('#webgl').append(this._renderer.domElement);
      this._lastLoop = new Date();
      this.renderThree();
      this.renderFps();
    },

    renderThree: function() {
      requestAnimationFrame(_.bind(this.renderThree, this));

      var thisLoop = new Date;
      this._fps = 1000 / (thisLoop - this._lastLoop);
      this._lastLoop = thisLoop;

      // animate!
      //this._cube.rotation.x += 0.1;
      this._cube.rotation.y += 0.05;

      // draw!
      this._renderer.render(this._scene, this._camera);
    },

    renderFps: function() {
      _.delay(_.bind(this.renderFps, this), 1000);
      this.$('#fps').text(Math.round(this._fps));
    }
  });
});