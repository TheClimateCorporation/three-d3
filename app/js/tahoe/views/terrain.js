define([
  'backbone',
  'three',
  'terrainLoader',
  'trackballControls'
], function(Backbone, THREE) {

  // set some camera attributes
  var VIEW_ANGLE = 45,
    ASPECT = window.innerWidth / window.innerHeight,
    NEAR = 0.1,
    FAR = 10000;

  return Backbone.View.extend({

    _renderer: null,
    _camera: null,
    _scene: null,

    _terrainData: null,

    initialize: function() {
      var terrainLoader;

      // create a WebGL renderer, camera
      // and a scene
      this._renderer = new THREE.WebGLRenderer({
        antialiasing: true
      });
      this._renderer.setSize(window.innerWidth, window.innerHeight);

      this._camera = new THREE.PerspectiveCamera(
          VIEW_ANGLE,
          ASPECT,
          NEAR,
          FAR);
      this._camera.position.set(0, -50, 10);

      this._controls = new THREE.TrackballControls(this._camera);

      this._scene = new THREE.Scene();
      this._scene.add(this._camera);

      this._axes = new THREE.AxisHelper(200);
      this._scene.add(this._axes);

      this.initMaterials();
      this.initLighting();

      terrainLoader = new THREE.TerrainLoader();
      terrainLoader.load('images/dembathy.bin',
        _.bind(this.onTerrainData, this));
    },

    onTerrainData: function(data) {
      this._terrainData = data;
      this.initGeometries();
      this.render();
    },

    initMaterials: function() {
      /*this._terrainMaterial = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        wireframe: true
      });*/
      this._terrainMaterial = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('images/dembathy_texture.png')
      });
    },

    initLighting: function() {

      // White directional light at half intensity shining from the top.
      var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight.position.set(-50, 0, 50);
      this._scene.add(directionalLight);

      // ambient light
      //this._ambientLight = new THREE.AmbientLight(0xeeeeee);
      //this._scene.add(this._ambientLight);
    },

    initGeometries: function() {
      this._terrainGeometry = new THREE.PlaneGeometry(100, 50, 174, 420);
      this._terrainGeometry.vertices =
        _.map(this._terrainGeometry.vertices, function(vertex, i) {
          vertex.z = this._terrainData[i] / 65535 * 5;
          return vertex;
        }, this);

      this._terrain = new THREE.Mesh(this._terrainGeometry,
        this._terrainMaterial);
      this._scene.add(this._terrain);
    },

    render: function() {
      this.$('#webgl').append(this._renderer.domElement);
      this.renderThree();
    },

    renderThree: function() {
      this._controls.update();
      requestAnimationFrame(_.bind(this.renderThree, this));
      this._renderer.render(this._scene, this._camera);
    }
  });
});