define([
  'backbone',
  'js/sf_neighb/collections/cali-geo',
  'js/sf_neighb/collections/sf-neighbs-geo',
  'js/sf_neighb/collections/sf-hoods.js',
  'js/sf_neighb/collections/sf-housing-prices',
  'js/sf_neighb/collections/sf-population.js',
  'three',
  'd3',
  'dthree',
  'trackballControls'
], function(Backbone, CaliGeo, SfNeighbsGeo, SfHoods, SfHousingPrices,
            SfPopulation, THREE, d3, dthree) {

  return Backbone.View.extend({

    _renderer: null,
    _camera: null,
    _scene: null,
    _objects: null,

    _projector: null,
    _raycaster: null,
    _mouse: null,
    _intersectedZip: null,

    events: {
      'mousemove': 'onMouseMove'
    },

    initialize: function() {
      this._objects = [];
      this._mouse = { x: 0, y: 0 };

      this._caliGeo = new CaliGeo();
      this._caliGeoNeighbsGeo = new SfNeighbsGeo();
      this._sfHoods = new SfHoods();
      this._sfHousingPrices = new SfHousingPrices();
      this._sfPopulation = new SfPopulation();

      this._initThree();

      var dataDeferreds = _.map([
        this._sfHoods,
        this._sfHousingPrices,
        this._sfPopulation,
        this._caliGeo,
        this._caliGeoNeighbsGeo], function(data) {
          return data.fetch();
        });

      $.when.apply(null, dataDeferreds).then(_.bind(this._onSfData, this));
      $(window).on('resize', _.bind(this.onWindowResize, this));
    },

    _initThree: function() {

      var width = window.innerWidth,
        height = window.innerHeight;

      this._renderer = new THREE.WebGLRenderer({
        antialiasing: true
      });
      this._renderer.setSize(width, height);
      this._renderer.setClearColorHex(0x7BB5FF);

      this._camera = new THREE.PerspectiveCamera(45, width/height, 10, 1000000);

      this._camera.position.set(0, 500, 500);
      this._camera.lookAt(0, 0, 0);

      this._controls = new THREE.TrackballControls(this._camera);

      this._scene = new THREE.Scene();
      this._scene.fog = new THREE.FogExp2(0xFFFFFF, 0.00025);
      this._scene.add(this._camera);

      this._axes = new THREE.AxisHelper(200);
      //this._scene.add(this._axes);

      this._projector = new THREE.Projector();
      this._raycaster = new THREE.Raycaster();

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

      this._caliGeo.each(function(feature) {
        var geoPathGen = this._caliGeo.getGeoPathGenerator(),
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

      this._caliGeoNeighbsGeo.each(function(feature) {
        var geoPathGen = this._caliGeoNeighbsGeo.getGeoPathGenerator(),
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

        var color = this._colors(population/100),
          material = new THREE.MeshPhongMaterial({
            color: color
          });
        var toAdd = new THREE.Mesh(neighbGeometry, material);
        toAdd.color = color;
        toAdd.zip = zip;

        // rotate and position the elements nicely in the center
        toAdd.rotation.x = Math.PI/2;
        toAdd.position.y += extrude;

        this._objects.push(toAdd);
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
      this.updateIntersections();
      this._renderer.render(this._scene, this._camera);
      requestAnimationFrame(_.bind(this.renderThree, this));
    },

    updateIntersections: function() {
      var mouseVector = new THREE.Vector3(this._mouse.x, this._mouse.y, 1),
        cameraVector = this._camera.position,
        intersects,
        zip;

      this._projector.unprojectVector(mouseVector, this._camera);
      this._raycaster.set(cameraVector,
        mouseVector.sub(cameraVector).normalize());
      intersects = this._raycaster.intersectObjects(this._scene.children);

      if (intersects.length > 0) {
        zip = intersects[0].object.zip;
        if (_.isUndefined(zip)) {
          this._intersectedZip = null;
        } else {
          this.unhighlightObjects();
          this.highlightObject(intersects[0].object);
          if (zip != this._intersectedZip) {
            this._intersectedZip = zip;
            this.updateInfo(zip);
          }
        }
      } else {
        this.unhighlightObjects();
        this._intersectedZip = null;
      }
    },

    highlightObject: function(object) {
      object.material.color.setHex(0xFFE87C);
    },

    unhighlightObjects: function() {
      _.each(this._objects, function(object) {
        object.material.color.set(object.color);
      });
    },

    updateInfo: function(zip) {
      var hoods = this._sfHoods.findWhere({
        zip: zip
      }).get('hoods'),
        population = this._sfPopulation.findWhere({
          zip: zip
        }),
        housingPrice = this._sfHousingPrices.findWhere({
          zip: zip
        });

      hoodsTxt = hoods[0] + ', ' + hoods[1] + ', ' + hoods[3];
      populationTxt = population.get('population')
      housingPriceTxt = '$' + housingPrice.get('zpctile50');


      this.$('.zip').html(zip);
      this.$('.population').html(populationTxt);
      this.$('.hoods').html(hoodsTxt);
      this.$('.housing-price').html(housingPriceTxt);
    },

    onMouseMove: function(event) {
      event.preventDefault();
      this._mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      this._mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
    },

    onWindowResize: function() {
      this._camera.aspect = window.innerWidth / window.innerHeight;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });
});