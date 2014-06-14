define([
  'scripts/common/views/three-base',
  'scripts/viz/collections/cali-geo',
  'scripts/viz/collections/sf-neighbs-geo',
  'scripts/viz/collections/sf-hoods.js',
  'scripts/viz/collections/sf-housing-prices',
  'scripts/viz/collections/sf-population.js',
  'd3',
  'dthree',
  'three',
  'trackballControls'
], function(ThreeBaseView, CaliGeo, SfNeighbsGeo, SfHoods, SfHousingPrices,
            SfPopulation, d3, dthree, THREE) {

  return ThreeBaseView.extend({

    webglEl: '#webgl',

    _objects: null,
    _intersectedZip: null,

    initialize: function() {
      var dataDeferreds = [];
      this._objects = [];

      ThreeBaseView.prototype.initialize.apply(this, arguments);

      this._caliGeo = new CaliGeo();
      this._sfNeighbsGeo = new SfNeighbsGeo();
      this._sfHoods = new SfHoods();
      this._sfHousingPrices = new SfHousingPrices();
      this._sfPopulation = new SfPopulation();

      dataDeferreds = _.map([
        this._sfHoods,
        this._sfHousingPrices,
        this._sfPopulation,
        this._caliGeo,
        this._sfNeighbsGeo], function(data) {
          return data.fetch();
        });

      $.when.apply(null, dataDeferreds).then(_.bind(this._onSfData, this));
    },

    initThree: function() {
      ThreeBaseView.prototype.initThree.apply(this, arguments);

      this._renderer.setClearColor(0x7BB5FF);
      this._camera.position.set(0, 500, 500);
      this._controls = new THREE.TrackballControls(this._camera);
      this._scene.fog = new THREE.FogExp2(0xFFFFFF, 0.00025);

      this.initColors();
      this.initLighting();
      this.initPlane();
    },

    initColors: function() {
      this._colors = d3.scale.linear()
        .domain(_.range(0, 701, 100))
        .range( ["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"]);
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

      this._sfNeighbsGeo.each(function(feature) {
        var geoPathGen = this._sfNeighbsGeo.getGeoPathGenerator(),
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
        var extrude = 5*medianHousingPrice/100000,
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

    updateControls: function(controls) {
      controls.update();
    },

    updateIntersections: function(intersections) {
      var zip;

      if (intersections.length > 0) {
        zip = intersections[0].object.zip;
        if (_.isUndefined(zip)) {
          this._intersectedZip = null;
        } else {
          this.unhighlightObjects();
          this.highlightObject(intersections[0].object);
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
    }
  });
});