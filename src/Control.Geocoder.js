(function (factory) {
	// Packaging/modules magic dance
	var L;
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['leaflet'], factory);
	} else if (typeof module !== 'undefined') {
		// Node/CommonJS
		L = require('leaflet');
		module.exports = factory(L);
	} else {
		// Browser globals
		if (typeof window.L === 'undefined')
			throw 'Leaflet must be loaded first';
		factory(window.L);
	}
}(function (L) {
	'use strict';
	L.Control.Geocoder = L.Control.extend({
		options: {
			showResultIcons: false,
			collapsed: true,
			expand: 'click',
			position: 'topright',
			placeholder: 'Search...',
			errorMessage: 'Nothing found.'
		},

		_callbackId: 0,

		initialize: function (options) {
			L.Util.setOptions(this, options);
			if (!this.options.geocoder) {
				this.options.geocoder = new L.Control.Geocoder.Nominatim();
			}
		},

		onAdd: function (map) {
			var className = 'leaflet-control-geocoder',
			    container = L.DomUtil.create('div', className),
				icon = L.DomUtil.create('div', 'leaflet-control-geocoder-icon', container),
			    form = this._form = L.DomUtil.create('form', className + '-form', container),
			    input;

			this._map = map;
			this._container = container;
			input = this._input = L.DomUtil.create('input');
			input.type = 'text';
			input.placeholder = this.options.placeholder;

			L.DomEvent.addListener(input, 'keydown', this._keydown, this);
			//L.DomEvent.addListener(input, 'onpaste', this._clearResults, this);
			//L.DomEvent.addListener(input, 'oninput', this._clearResults, this);

			this._errorElement = document.createElement('div');
			this._errorElement.className = className + '-form-no-error';
			this._errorElement.innerHTML = this.options.errorMessage;

			this._alts = L.DomUtil.create('ul', className + '-alternatives leaflet-control-geocoder-alternatives-minimized');

			form.appendChild(input);
			form.appendChild(this._errorElement);
			container.appendChild(this._alts);

			L.DomEvent.addListener(form, 'submit', this._geocode, this);

			if (this.options.collapsed) {
				if (this.options.expand === 'click') {
					L.DomEvent.addListener(icon, 'click', function(e) {
						// TODO: touch
						if (e.button === 0 && e.detail === 1) {
							this._toggle();
						}
					}, this);
				} else {
					L.DomEvent.addListener(icon, 'mouseover', this._expand, this);
					L.DomEvent.addListener(icon, 'mouseout', this._collapse, this);
					this._map.on('movestart', this._collapse, this);
				}
			} else {
				this._expand();
			}

			L.DomEvent.disableClickPropagation(container);

			return container;
		},

		_geocodeResult: function (results) {
			L.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-throbber');
			if (results.length === 1) {
				this._geocodeResultSelected(results[0]);
			} else if (results.length > 0) {
				this._alts.innerHTML = '';
				this._results = results;
				L.DomUtil.removeClass(this._alts, 'leaflet-control-geocoder-alternatives-minimized');
				for (var i = 0; i < results.length; i++) {
					this._alts.appendChild(this._createAlt(results[i], i));
				}
			} else {
				L.DomUtil.addClass(this._errorElement, 'leaflet-control-geocoder-error');
			}
		},

		markGeocode: function(result) {
			this._map.fitBounds(result.bbox);

			if (this._geocodeMarker) {
				this._map.removeLayer(this._geocodeMarker);
			}

			this._geocodeMarker = new L.Marker(result.center)
				.bindPopup(result.html || result.name)
				.addTo(this._map)
				.openPopup();

			return this;
		},

		_geocode: function(event) {
			L.DomEvent.preventDefault(event);

			L.DomUtil.addClass(this._container, 'leaflet-control-geocoder-throbber');
			this._clearResults();
			this.options.geocoder.geocode(this._input.value, this._geocodeResult, this);

			return false;
		},

		_geocodeResultSelected: function(result) {
			if (this.options.collapsed) {
				this._collapse();
			} else {
				this._clearResults();
			}
			this.markGeocode(result);
		},

		_toggle: function() {
			if (this._container.className.indexOf('leaflet-control-geocoder-expanded') >= 0) {
				this._collapse();
			} else {
				this._expand();
			}
		},

		_expand: function () {
			L.DomUtil.addClass(this._container, 'leaflet-control-geocoder-expanded');
			this._input.select();
		},

		_collapse: function () {
			this._container.className = this._container.className.replace(' leaflet-control-geocoder-expanded', '');
			L.DomUtil.addClass(this._alts, 'leaflet-control-geocoder-alternatives-minimized');
			L.DomUtil.removeClass(this._errorElement, 'leaflet-control-geocoder-error');
		},

		_clearResults: function () {
			L.DomUtil.addClass(this._alts, 'leaflet-control-geocoder-alternatives-minimized');
			this._selection = null;
			L.DomUtil.removeClass(this._errorElement, 'leaflet-control-geocoder-error');
		},

		_createAlt: function(result, index) {
			var li = document.createElement('li'),
			    a = L.DomUtil.create('a', '', li),
			    icon = this.options.showResultIcons && result.icon ? L.DomUtil.create('img', '', a) : null,
			    text = result.html ? undefined : document.createTextNode(result.name);

			if (icon) {
				icon.src = result.icon;
			}

			a.href = '#';
			a.setAttribute('data-result-index', index);

			if (result.html) {
				a.innerHTML = result.html;
			} else {
				a.appendChild(text);
			}

			L.DomEvent.addListener(li, 'click', function clickHandler(e) {
				L.DomEvent.preventDefault(e);
				this._geocodeResultSelected(result);
			}, this);

			return li;
		},

		_keydown: function(e) {
			var _this = this,
				select = function select(dir) {
					if (_this._selection) {
						L.DomUtil.removeClass(_this._selection.firstChild, 'leaflet-control-geocoder-selected');
						_this._selection = _this._selection[dir > 0 ? 'nextSibling' : 'previousSibling'];
					}
					if (!_this._selection) {
						_this._selection = _this._alts[dir > 0 ? 'firstChild' : 'lastChild'];
					}

					if (_this._selection) {
						L.DomUtil.addClass(_this._selection.firstChild, 'leaflet-control-geocoder-selected');
					}
				};

			switch (e.keyCode) {
			// Escape
			case 27:
				this._collapse();
				break;
			// Up
			case 38:
				select(-1);
				L.DomEvent.preventDefault(e);
				break;
			// Up
			case 40:
				select(1);
				L.DomEvent.preventDefault(e);
				break;
			// Enter
			case 13:
				if (this._selection) {
					var index = parseInt(this._selection.firstChild.getAttribute('data-result-index'), 10);
					this._geocodeResultSelected(this._results[index]);
					this._clearResults();
					L.DomEvent.preventDefault(e);
				}
			}
			return true;
		}
	});

	L.Control.geocoder = function(id, options) {
		return new L.Control.Geocoder(id, options);
	};

	L.Control.Geocoder.callbackId = 0;
	L.Control.Geocoder.jsonp = function(url, params, callback, context, jsonpParam) {
		var callbackId = '_l_geocoder_' + (L.Control.Geocoder.callbackId++);
		params[jsonpParam || 'callback'] = callbackId;
		window[callbackId] = L.Util.bind(callback, context);
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url + L.Util.getParamString(params);
		script.id = callbackId;
		document.getElementsByTagName('head')[0].appendChild(script);
	};
	L.Control.Geocoder.getJSON = function(url, params, callback) {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open( "GET", url + L.Util.getParamString(params), true);
		xmlHttp.send(null);
		xmlHttp.onreadystatechange = function () {
			if (xmlHttp.readyState != 4) return;
			if (xmlHttp.status != 200 && req.status != 304) return;
			callback(JSON.parse(xmlHttp.response));
		};
	};

	L.Control.Geocoder.template = function (str, data, htmlEscape) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (value === undefined) {
				value = '';
			} else if (typeof value === 'function') {
				value = value(data);
			}
			return L.Control.Geocoder.htmlEscape(value);
		});
	};

	// Adapted from handlebars.js
	// https://github.com/wycats/handlebars.js/
	L.Control.Geocoder.htmlEscape = (function() {
		var badChars = /[&<>"'`]/g;
		var possible = /[&<>"'`]/;
		var escape = {
		  '&': '&amp;',
		  '<': '&lt;',
		  '>': '&gt;',
		  '"': '&quot;',
		  '\'': '&#x27;',
		  '`': '&#x60;'
		};

		function escapeChar(chr) {
		  return escape[chr];
		}

		return function(string) {
			if (string == null) {
				return '';
			} else if (!string) {
				return string + '';
			}

			// Force a string conversion as this will be done by the append regardless and
			// the regex test will do this transparently behind the scenes, causing issues if
			// an object's to string has escaped characters in it.
			string = '' + string;

			if (!possible.test(string)) {
				return string;
			}
			return string.replace(badChars, escapeChar);
		};
	})();

	L.Control.Geocoder.Nominatim = L.Class.extend({
		options: {
			serviceUrl: 'https://nominatim.openstreetmap.org/',
			geocodingQueryParams: {},
			reverseQueryParams: {},
			htmlTemplate: function(r) {
				var a = r.address,
					parts = [];
				if (a.road || a.building) {
					parts.push('{building} {road} {house_number}');
				}

				if (a.city || a.town || a.village) {
					parts.push('<span class="' + (parts.length > 0 ? 'leaflet-control-geocoder-address-detail' : '') +
						'">{postcode} {city}{town}{village}</span>');
				}

				if (a.state || a.country) {
					parts.push('<span class="' + (parts.length > 0 ? 'leaflet-control-geocoder-address-context' : '') +
						'">{state} {country}</span>');
				}

				return L.Control.Geocoder.template(parts.join('<br/>'), a, true);
			}
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);
		},

		geocode: function(query, cb, context) {
			L.Control.Geocoder.jsonp(this.options.serviceUrl + 'search/', L.extend({
				q: query,
				limit: 5,
				format: 'json',
				addressdetails: 1
			}, this.options.geocodingQueryParams),
			function(data) {
				var results = [];
				for (var i = data.length - 1; i >= 0; i--) {
					var bbox = data[i].boundingbox;
					for (var j = 0; j < 4; j++) bbox[j] = parseFloat(bbox[j]);
					results[i] = {
						icon: data[i].icon,
						name: data[i].display_name,
						html: this.options.htmlTemplate ?
							this.options.htmlTemplate(data[i])
							: undefined,
						bbox: L.latLngBounds([bbox[0], bbox[2]], [bbox[1], bbox[3]]),
						center: L.latLng(data[i].lat, data[i].lon),
						properties: data[i]
					};
				}
				cb.call(context, results);
			}, this, 'json_callback');
		},

		reverse: function(location, scale, cb, context) {
			L.Control.Geocoder.jsonp(this.options.serviceUrl + 'reverse/', L.extend({
				lat: location.lat,
				lon: location.lng,
				zoom: Math.round(Math.log(scale / 256) / Math.log(2)),
				addressdetails: 1,
				format: 'json'
			}, this.options.reverseQueryParams), function(data) {
				var result = [],
				    loc;

				if (data && data.lat && data.lon) {
					loc = L.latLng(data.lat, data.lon);
					result.push({
						name: data.display_name,
						html: this.options.htmlTemplate ?
							this.options.htmlTemplate(data)
							: undefined,
						center: loc,
						bounds: L.latLngBounds(loc, loc),
						properties: data
					});
				}

				cb.call(context, result);
			}, this, 'json_callback');
		}
	});

	L.Control.Geocoder.nominatim = function(options) {
		return new L.Control.Geocoder.Nominatim(options);
	};
	return L.Control.Geocoder;
}));
