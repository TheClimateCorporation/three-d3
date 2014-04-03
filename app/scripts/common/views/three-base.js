define([
  'backbone'
], function(Backbone) {
  return Backbone.View.extend({

    webglEl: null,

    _renderer: null,
    _camera: null,
    _scene: null,
    _projector: null,
    _raycaster: null,
    _mouse: null,
    _control: null,

    config: {
      camera: {
        fov: 45,
        aspect: 1,
        near: 1,
        far: 100000
      }
    },

    events: {
      'mousemove': 'onMouseMove'
    },

    initialize: function(options) {
      this._mouse = { x: 0, y: 0 };
      this.webglEl = this.webglEl || options.webglEl;

      if (_.isNull(this.webglEl)) {
        throw 'ERROR webglEl dom element must be specified';
      }

      this.initThree();
      this._scene.add(this._camera);

      _.bindAll(this, 'renderThree');
      $(window).on('resize', _.bind(this.onWindowResize, this));
    },

    initThree: function() {
      var cameraConfig = this.config.camera,
        width = window.innerWidth,
        height = window.innerHeight;
      cameraConfig.aspect = width/height;

      this._renderer = new THREE.WebGLRenderer({
        antialiasing: true
      });
      this._renderer.setSize(width, height);
      this._renderer.setClearColorHex(0x7BB5FF);

      this._camera = new THREE.PerspectiveCamera(cameraConfig.fov,
        cameraConfig.aspect, cameraConfig.near, cameraConfig.far);
      this._camera.lookAt(0, 0, 0);

      this._scene = new THREE.Scene();

      this._projector = new THREE.Projector();
      this._raycaster = new THREE.Raycaster();
    },

    render: function() {
      this.$(this.webglEl).append(this._renderer.domElement);
      this.renderThree();
    },

    renderThree: function() {
      this.updateControls(this._controls);
      this.updateIntersections(this.getIntersections());
      this._renderer.render(this._scene, this._camera);
      requestAnimationFrame(this.renderThree);
    },

    updateControls: function(controls) {},

    updateIntersections: function (intersections) {},

    getIntersections: function() {
      var mouseVector = new THREE.Vector3(this._mouse.x, this._mouse.y, 1),
        cameraVector = this._camera.position;

      this._projector.unprojectVector(mouseVector, this._camera);
      this._raycaster.set(cameraVector,
        mouseVector.sub(cameraVector).normalize());
      
      return this._raycaster.intersectObjects(this._scene.children);
    },

    onMouseMove: function(event) {
      event.preventDefault();
      this._mouse.x =  (event.clientX / window.innerWidth) * 2 - 1;
      this._mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    },

    onWindowResize: function() {
      var width = window.innerWidth,
        height = window.innerHeight;
      this._camera.aspect = width / height;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(width, height);
    }
  });
});