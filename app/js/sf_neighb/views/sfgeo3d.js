define([
  'backbone',
  'js/sf_neighb/collections/sf',
  'js/sf_neighb/collections/sf-neighbs',
  'js/sf_neighb/collections/sf-housing-prices',
  'js/sf_neighb/collections/sf-population.js',
  'three',
  'd3',
  'dthree',
  'trackballControls'
], function(Backbone, Sf, SfNeighbs, SfHousingPrices, SfPopulation, THREE, d3,
            dthree) {

  // set some camera attributes
  var VIEW_ANGLE = 45,
    ASPECT = window.innerWidth / window.innerHeight,
    NEAR = 10,
    FAR = 1000000;

  return Backbone.View.extend({

    _renderer: null,
    _camera: null,
    _scene: null,

    initialize: function() {
      this._sf = new Sf();
      this._sfNeighbs = new SfNeighbs();
      this._sfHousingPrices = new SfHousingPrices();
      this._sfPopulation = new SfPopulation();

      this._initThree();

      var dataDeferreds = _.map([this._sfHousingPrices, this._sfPopulation,
        this._sf, this._sfNeighbs], function(data) {
          return data.fetch();
        });

      $.when.apply(null, dataDeferreds).then(_.bind(this._onSfData, this));
    },

    _initThree: function() {

      this._renderer = new THREE.WebGLRenderer({
        antialiasing: true
      });
      this._renderer.setSize(window.innerWidth, window.innerHeight);
      this._renderer.setClearColorHex(0x7BB5FF);

      this._camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

      this._camera.position.set(0, 500, 500);
      this._camera.lookAt(0, 0, 0);

      this._controls = new THREE.TrackballControls(this._camera);

      this._scene = new THREE.Scene();
      this._scene.fog = new THREE.FogExp2(0xFFFFFF, 0.00025);
      this._scene.add(this._camera);

      this._axes = new THREE.AxisHelper(200);
      this._scene.add(this._axes);

      this.initColors();
      this.initLighting();
      this.initPlane();
    },

    initColors: function() {
      this._colors = d3.scale.linear()
        .domain([0, 100, 200, 300, 400, 500, 600, 700])
        .range( ["#ffffff","#f0f0f0","#d9d9d9","#bdbdbd","#969696","#737373",
          "#525252","#252525"]);
    },

    initLighting: function() {

      this._directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
      this._directionalLight.position.set( 0, 1, 0 );
      this._scene.add(this._directionalLight);

      this._pointLight = new THREE.PointLight(0xFFFFFF, 0.5);
      this._pointLight.position.set(0, 500, 500);
      this._scene.add(this._pointLight);
    },

    initPlane: function() {
      var circleGeometry = new THREE.CircleGeometry(100000, 50),
        material = new THREE.MeshPhongMaterial({
          color: 0x4E8975
        });       
      var circle = new THREE.Mesh(circleGeometry, material);
      circle.position.y = -10;
      circle.rotation.x = -Math.PI/2;
      this._scene.add(circle);
    },

    _onSfData: function() {

      this._sf.each(function(feature) {
        var geoPathGen = this._sf.getGeoPathGenerator(),
          geoFeature = geoPathGen(feature.toJSON()),
          meshes = dthree.transformSvgPath(geoFeature),
          geometry = new THREE.ExtrudeGeometry(meshes, {
            amount: 1,
            bevelEnabled: false
          }),
          material = new THREE.MeshLambertMaterial({
            color: 0x84D067
          }),
          toAdd = new THREE.Mesh(geometry, material);

          toAdd.rotation.x = Math.PI/2;
          this._scene.add(toAdd);
      }, this);

      this._sfNeighbs.each(function(feature) {
        var geoPathGen = this._sfNeighbs.getGeoPathGenerator(),
          geoFeature = geoPathGen(feature.toJSON()),
          meshes = dthree.transformSvgPath(geoFeature),
          zip = parseInt(feature.get('properties').id)
          medianHousingPrice = this._sfHousingPrices.findWhere({
            zip: zip
          }).get('zpctile50'),
          population = this._sfPopulation.findWhere({
            zip: zip
          }).get('population');

        // extrude mesh
        var extrude = 2*medianHousingPrice/100000,
          neighbGeometry = new THREE.ExtrudeGeometry(meshes, {
            amount: extrude,
            bevelEnabled: false
          });

        var material = new THREE.MeshPhongMaterial({
          color: this._colors(population/100)
        });
        var toAdd = new THREE.Mesh(neighbGeometry, material);

        // rotate and position the elements nicely in the center
        toAdd.rotation.x = Math.PI/2;
        toAdd.position.y += extrude;

        this._scene.add(toAdd);        
      }, this);

      this.render();
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