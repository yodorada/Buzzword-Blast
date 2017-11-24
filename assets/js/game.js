if (typeof window.yodorada === 'undefined') {
	window.yodorada = {};
}

(function($) {
	"use strict";
	// browser check
	$.uaMatch = function(ua) {
	  ua = ua.toLowerCase();

	  var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
	    /(webkit)[ \/]([\w.]+)/.exec(ua) ||
	    /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
	    /(msie) ([\w.]+)/.exec(ua) ||
	    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
	    [];

	  return {
	    browser: match[1] || "",
	    version: match[2] || "0"
	  };
	};
	// Don't clobber any existing $.browser in case it's different
	if (!$.browser) {
	  var matched = $.uaMatch(navigator.userAgent);
	  var browser = {};

	  if (matched.browser) {
	    browser[matched.browser] = true;
	    browser.version = matched.version;
	  }

	  // Chrome is Webkit, but Webkit is also Safari.
	  if (browser.chrome) {
	    browser.webkit = true;
	  } else if (browser.webkit) {
	    browser.safari = true;
	  }

	  $.browser = browser;
	}
	function shuffle(array) {
	    let counter = array.length;

	    // While there are elements in the array
	    while (counter > 0) {
	        // Pick a random index
	        let index = Math.floor(Math.random() * counter);

	        // Decrease counter by 1
	        counter--;

	        // And swap the last element with it
	        let temp = array[counter];
	        array[counter] = array[index];
	        array[index] = temp;
	    }

	    return array;
	}
	window.yodorada.buzzwordBlast = function() {
		if ($('html').hasClass('touch')) {
			var bg = $('#buzzwordBlast .gameContainer').eq(0).data('notouchbgsrc');
			$('#buzzwordBlast .gameContainer').eq(0).css('background-image', 'url(' + bg + ')');
			return;
		}

		var ImageRepository = new function() {

			this.assetsLoaded = false;
			this.assets = [];
			this.count = 0;
			this.generatePoints = function(w, h) {
				var scale = 1.6;
				var destW = Math.round(w / scale);
				var destH = Math.round(h / scale);

				return [-1 * Math.round(destW / 2), -1 * Math.round(destH / 2),
					Math.round(destW / 2), -1 * Math.round(destH / 2),
					Math.round(destW / 2), Math.round(destH / 2), -1 * Math.round(destW / 2), Math.round(destH / 2)
				];
			};
			this.loadImg = function() {
				var self = this;
				this.assets[self.count].img.onload = function() {
					self.assets[self.count].width = this.width;
					self.assets[self.count].height = this.height;
					self.assets[self.count].rect = self.generatePoints(this.width, this.height);
					self.count++;
					if (self.count != self.assets.length) {
						self.loadImg();
					} else {
						self.assetsLoaded = true;
					}
				};
				this.assets[this.count].img.src = this.assets[this.count].src;
			};
			this.init = function() {
				var shuffleImg = shuffle([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
				console.log(shuffleImg);
				for (var i = 1; i <= 15; i++) {
					this.assets.push({
						name: 'buzz-' + i,
						src: 'assets/images/' + shuffleImg[(i-1)] + '.png',
						img: new Image(),
						width: 0,
						height: 0,
						rect: []
					});
				}
				this.loadImg();
			}
			this.init();

		};

		// Canvas Asteroids
		//
		// Copyright (c) 2010 Doug McInnes
		//



		var Matrix = function(rows, columns) {
			var i, j;
			this.data = new Array(rows);
			for (var i = 0; i < rows; i++) {
				this.data[i] = new Array(columns);
			}

			this.configure = function(rot, scale, transx, transy) {
				var rad = (rot * Math.PI) / 180;
				var sin = Math.sin(rad) * scale;
				var cos = Math.cos(rad) * scale;
				this.set(cos, -sin, transx,
					sin, cos, transy);
			};

			this.set = function() {
				var k = 0;
				for (var i = 0; i < rows; i++) {
					for (var j = 0; j < columns; j++) {
						this.data[i][j] = arguments[k];
						k++;
					}
				}
			}

			this.multiply = function() {
				var vector = new Array(rows);
				for (var i = 0; i < rows; i++) {
					vector[i] = 0;
					for (var j = 0; j < columns; j++) {
						vector[i] += this.data[i][j] * arguments[j];
					}
				}
				return vector;
			};
		};

		var Sprite = function() {
			this.init = function(name, points) {
				this.name = name;
				this.points = points;

				this.vel = {
					x: 0,
					y: 0,
					rot: 0
				};

				this.acc = {
					x: 0,
					y: 0,
					rot: 0
				};
			};

			this.children = {};

			this.visible = false;
			this.reap = false;
			this.bridgesH = true;
			this.bridgesV = true;

			this.collidesWith = [];

			this.x = 0;
			this.y = 0;
			this.rot = 0;
			this.scale = 1;

			this.currentNode = null;
			this.nextSprite = null;

			this.preMove = null;
			this.postMove = null;

			this.run = function(delta) {

				this.move(delta);
				this.updateGrid();

				this.context.save();
				this.configureTransform();
				this.draw();

				var canidates = this.findCollisionCanidates();

				this.matrix.configure(this.rot, this.scale, this.x, this.y);
				this.checkCollisionsAgainst(canidates);

				this.context.restore();

				if (this.bridgesH && this.currentNode && this.currentNode.dupe.horizontal) {
					this.x += this.currentNode.dupe.horizontal;
					this.context.save();
					this.configureTransform();
					this.draw();
					this.checkCollisionsAgainst(canidates);
					this.context.restore();
					if (this.currentNode) {
						this.x -= this.currentNode.dupe.horizontal;
					}
				}
				if (this.bridgesV && this.currentNode && this.currentNode.dupe.vertical) {
					this.y += this.currentNode.dupe.vertical;
					this.context.save();
					this.configureTransform();
					this.draw();
					this.checkCollisionsAgainst(canidates);
					this.context.restore();
					if (this.currentNode) {
						this.y -= this.currentNode.dupe.vertical;
					}
				}
				if (this.bridgesH && this.bridgesV &&
					this.currentNode &&
					this.currentNode.dupe.vertical &&
					this.currentNode.dupe.horizontal) {
					this.x += this.currentNode.dupe.horizontal;
					this.y += this.currentNode.dupe.vertical;
					this.context.save();
					this.configureTransform();
					this.draw();
					this.checkCollisionsAgainst(canidates);
					this.context.restore();
					if (this.currentNode) {
						this.x -= this.currentNode.dupe.horizontal;
						this.y -= this.currentNode.dupe.vertical;
					}
				}
			};
			this.move = function(delta) {
				if (!this.visible) return;
				this.transPoints = null; // clear cached points

				if ($.isFunction(this.preMove)) {
					this.preMove(delta);
				}

				if (this.name != "ship" || (this.name == "ship" && !this.spawning)) {
					this.vel.x += this.acc.x * delta;
					this.vel.y += this.acc.y * delta;
					this.x += this.vel.x * delta;
					this.y += this.vel.y * delta;
				}

				this.rot += this.vel.rot * delta;
				if (this.rot > 360) {
					this.rot -= 360;
				} else if (this.rot < 0) {
					this.rot += 360;
				}


				if ($.isFunction(this.postMove)) {
					this.postMove(delta);
				}
			};
			this.updateGrid = function() {
				if (!this.visible) return;
				var gridx = Math.floor(this.x / GRID_SIZE);
				var gridy = Math.floor(this.y / GRID_SIZE);
				gridx = (gridx >= this.grid.length) ? 0 : gridx;
				gridy = (gridy >= this.grid[0].length) ? 0 : gridy;
				gridx = (gridx < 0) ? this.grid.length - 1 : gridx;
				gridy = (gridy < 0) ? this.grid[0].length - 1 : gridy;
				var newNode = this.grid[gridx][gridy];
				if (newNode != this.currentNode) {
					if (this.currentNode) {
						this.currentNode.leave(this);
					}
					newNode.enter(this);
					this.currentNode = newNode;
				}

				if (KEY_STATUS.g && this.currentNode) {
					this.context.lineWidth = 3.0;
					this.context.strokeStyle = 'green';
					this.context.strokeRect(gridx * GRID_SIZE + 2, gridy * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
					this.context.strokeStyle = '#fff';
					this.context.lineWidth = 1.0;
				}
			};
			this.configureTransform = function() {
				if (!this.visible) return;

				var rad = (this.rot * Math.PI) / 180;

				this.context.translate(this.x, this.y);
				this.context.rotate(rad);
				this.context.scale(this.scale, this.scale);
			};
			this.draw = function() {
				if (!this.visible) return;

				this.context.lineWidth = 1.0 / this.scale;

				for (var child in this.children) {
					this.children[child].draw();
				}
				this.context.strokeStyle = 'rgba(255,255,255,.4)';
				this.context.beginPath();

				this.context.moveTo(this.points[0], this.points[1]);
				for (var i = 1; i < this.points.length / 2; i++) {
					var xi = i * 2;
					var yi = xi + 1;
					this.context.lineTo(this.points[xi], this.points[yi]);
				}

				this.context.closePath();
				this.context.stroke();
			};
			this.findCollisionCanidates = function() {
				if (!this.visible || !this.currentNode) return [];
				var cn = this.currentNode;
				var canidates = [];
				if (cn.nextSprite) canidates.push(cn.nextSprite);
				if (cn.north.nextSprite) canidates.push(cn.north.nextSprite);
				if (cn.south.nextSprite) canidates.push(cn.south.nextSprite);
				if (cn.east.nextSprite) canidates.push(cn.east.nextSprite);
				if (cn.west.nextSprite) canidates.push(cn.west.nextSprite);
				if (cn.north.east.nextSprite) canidates.push(cn.north.east.nextSprite);
				if (cn.north.west.nextSprite) canidates.push(cn.north.west.nextSprite);
				if (cn.south.east.nextSprite) canidates.push(cn.south.east.nextSprite);
				if (cn.south.west.nextSprite) canidates.push(cn.south.west.nextSprite);
				return canidates
			};
			this.checkCollisionsAgainst = function(canidates) {
				for (var i = 0; i < canidates.length; i++) {
					var ref = canidates[i];
					do {
						this.checkCollision(ref);
						ref = ref.nextSprite;
					} while (ref)
				}
			};
			this.checkCollision = function(other) {
				if (!other.visible ||
					this == other ||
					this.collidesWith.indexOf(other.name) == -1 ||
					(other.name == "ship" && other.spawning) || (this.name == "ship" && this.spawning) ||
					(other.name == "ship" && !other.spawning && Date.now() - other.spawned < 500) || (this.name == "ship" && !this.spawning && Date.now() - this.spawned < 500)

				) return;
				var trans = other.transformedPoints();
				var px, py;
				var count = trans.length / 2;
				for (var i = 0; i < count; i++) {
					px = trans[i * 2];
					py = trans[i * 2 + 1];
					// mozilla doesn't take into account transforms with isPointInPath >:-P
					if (($.browser.mozilla) ? this.pointInPolygon(px, py) : this.context.isPointInPath(px, py)) {
						other.collision(this);
						this.collision(other);
						return;
					}
				}
			};
			this.pointInPolygon = function(x, y) {
				var points = this.transformedPoints();
				var j = 2;
				var y0, y1;
				var oddNodes = false;
				for (var i = 0; i < points.length; i += 2) {
					y0 = points[i + 1];
					y1 = points[j + 1];
					if ((y0 < y && y1 >= y) ||
						(y1 < y && y0 >= y)) {
						if (points[i] + (y - y0) / (y1 - y0) * (points[j] - points[i]) < x) {
							oddNodes = !oddNodes;
						}
					}
					j += 2
					if (j == points.length) j = 0;
				}
				return oddNodes;
			};
			this.collision = function() {};
			this.die = function() {
				this.visible = false;
				this.reap = true;
				if (this.currentNode) {
					this.currentNode.leave(this);
					this.currentNode = null;
				}
			};
			this.transformedPoints = function() {
				if (this.transPoints) return this.transPoints;
				var trans = new Array(this.points.length);
				this.matrix.configure(this.rot, this.scale, this.x, this.y);
				for (var i = 0; i < this.points.length / 2; i++) {
					var xi = i * 2;
					var yi = xi + 1;
					var pts = this.matrix.multiply(this.points[xi], this.points[yi], 1);
					trans[xi] = pts[0];
					trans[yi] = pts[1];
				}
				this.transPoints = trans; // cache translated points
				return trans;
			};
			this.isClear = function() {
				if (this.collidesWith.length == 0) return true;
				var cn = this.currentNode;
				if (cn == null) {
					var gridx = Math.floor(this.x / GRID_SIZE);
					var gridy = Math.floor(this.y / GRID_SIZE);
					gridx = (gridx >= this.grid.length) ? 0 : gridx;
					gridy = (gridy >= this.grid[0].length) ? 0 : gridy;
					cn = this.grid[gridx][gridy];
				}
				return (cn.isEmpty(this.collidesWith) &&
					cn.north.isEmpty(this.collidesWith) &&
					cn.south.isEmpty(this.collidesWith) &&
					cn.east.isEmpty(this.collidesWith) &&
					cn.west.isEmpty(this.collidesWith) &&
					cn.north.east.isEmpty(this.collidesWith) &&
					cn.north.west.isEmpty(this.collidesWith) &&
					cn.south.east.isEmpty(this.collidesWith) &&
					cn.south.west.isEmpty(this.collidesWith));
			};
			this.wrapPostMove = function() {
				if (this.x > Game.canvasWidth) {
					this.x = 0;
				} else if (this.x < 0) {
					this.x = Game.canvasWidth;
				}
				if (this.y > Game.canvasHeight) {
					this.y = 0;
				} else if (this.y < 0) {
					this.y = Game.canvasHeight;
				}
			};

		};

		var Ship = function() {
			// this.pt = [-5, 4,
			// 	0, -12,
			// 	5, 4
			// ];
			this.pt = [-8, 5,
				0, -12,
				8, 5,
				0, 2
			];

			this.init("ship", this.pt);



			this.children.exhaust = new Sprite();
			this.children.exhaust.init("exhaust", [-3, 6,
				0, 11,
				3, 6
			]);

			this.bulletCounter = 0;

			this.outline = false;

			this.postMove = this.wrapPostMove;

			this.spawnVisible = 0;

			this.accelerated = false;

			this.collidesWith = ["asteroid", "bigalien", "alienbullet"];
			this.draw = function() {


				if (!this.visible) return;



				this.context.lineWidth = 1.0 / this.scale;

				if (!this.spawning) {
					for (var child in this.children) {
						this.children[child].draw();
					}
				}
				var alpha = 1;

				if (this.spawning) {
					alpha = (this.spawnVisible % 5 == 0 ? 1 : 0);
					this.spawnVisible++;
				}
				if (!this.outline) {
					this.context.fillStyle = 'rgba(32, 248, 192, ' + alpha + ')';
				} else {
					this.context.strokeStyle = 'rgba(32, 248, 192, 1)';
				}



				this.context.beginPath();

				this.context.moveTo(this.points[0], this.points[1]);
				for (var i = 1; i < this.points.length / 2; i++) {
					var xi = i * 2;
					var yi = xi + 1;
					this.context.lineTo(this.points[xi], this.points[yi]);
				}

				this.context.closePath();
				if (!this.outline) {
					this.context.fill();
				} else {
					this.context.stroke();
				}
			};
			this.preMove = function(delta) {
				if (KEY_STATUS.left) {
					this.vel.rot = -6;
				} else if (KEY_STATUS.right) {
					this.vel.rot = 6;
				} else {
					this.vel.rot = 0;
				}

				var rad = ((this.rot - 90) * Math.PI) / 180;

				if (KEY_STATUS.up) {
					this.accelerated = true;
					this.acc.x = 0.5 * Math.cos(rad);
					this.acc.y = 0.5 * Math.sin(rad);
					this.children.exhaust.visible = Math.random() > 0.1;
				} else {
					this.acc.x = 0;
					this.acc.y = 0;
					this.children.exhaust.visible = false;

					if (!this.spawning && Date.now() - this.spawned > 6000 && !this.accelerated) {
						this.acc.x = 2.2 * Math.cos(rad);
						this.acc.y = 2.2 * Math.sin(rad);
						this.accelerated = true;
						this.children.exhaust.visible = Math.random() > 0.1;
						Game.soundPool.enough.get();
					}
				}

				if (this.bulletCounter > 0) {
					this.bulletCounter -= delta;
				}
				if (KEY_STATUS.space) {
					if (this.bulletCounter <= 0) {
						this.bulletCounter = 10;
						for (var i = 0; i < this.bullets.length; i++) {
							if (!this.bullets[i].visible) {
								Game.soundPool.laser.get();
								var bullet = this.bullets[i];
								var rad = ((this.rot - 90) * Math.PI) / 180;
								var vectorx = Math.cos(rad);
								var vectory = Math.sin(rad);
								// move to the nose of the ship
								bullet.x = this.x + vectorx * 4;
								bullet.y = this.y + vectory * 4;
								bullet.vel.x = 6 * vectorx + this.vel.x;
								bullet.vel.y = 6 * vectory + this.vel.y;
								bullet.visible = true;
								bullet.scoreFactor = 1 + Math.round(Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y)) / 10;
								break;
							}
						}
					}
				}

				// limit the ship's speed
				if (Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y) > Game.shipCurrSpeed) {
					this.vel.x *= 0.95;
					this.vel.y *= 0.95;
				}
			};

			this.collision = function(other) {
				Game.explosionAt(other.x, other.y);
				Game.FSM.state = 'player_died';
				this.visible = false;
				this.currentNode.leave(this);
				this.currentNode = null;
				Game.lives--;
				Game.soundPool.playerdied.get();
			};

		};
		Ship.prototype = new Sprite();

		var Bullet = function() {
			this.init("bullet", [0, 0]);
			this.time = 0;
			this.bridgesH = false;
			this.bridgesV = false;
			this.postMove = this.wrapPostMove;
			// asteroid can look for bullets so doesn't have
			// to be other way around
			//this.collidesWith = ["asteroid"];

			this.configureTransform = function() {};
			this.draw = function() {
				if (this.visible) {
					this.context.save();
					this.context.strokeStyle = '#ff273c';
					this.context.lineWidth = 2;
					this.context.beginPath();
					this.context.moveTo(this.x - 1, this.y - 1);
					this.context.lineTo(this.x + 1, this.y + 1);
					this.context.moveTo(this.x + 1, this.y - 1);
					this.context.lineTo(this.x - 1, this.y + 1);
					this.context.stroke();
					this.context.restore();
				}
			};
			this.preMove = function(delta) {
				if (this.visible) {
					this.time += delta;
				}
				if (this.time > 50) {
					this.visible = false;
					this.time = 0;
				}
			};
			this.collision = function(other) {
				this.time = 0;
				this.visible = false;
				this.currentNode.leave(this);
				this.currentNode = null;
			};
			this.transformedPoints = function(other) {
				return [this.x, this.y];
			};

		};
		Bullet.prototype = new Sprite();

		var Asteroid = function(i) {

			if (i > 9 && i < 20) {
				i -= 10;
			} else if (i > 19 && i < 30) {
				i -= 20;
			} else if (i > 29 && i < 40) {
				i -= 30;
			}
			this.buzzwordNum = i;
			this.buzzword = ImageRepository.assets[this.buzzwordNum];

			this.init("asteroid", this.buzzword.rect);

			this.visible = true;
			this.scale = 1.2;
			this.postMove = this.wrapPostMove;

			this.collidesWith = ["ship", "bullet"];

			this.collision = function(other) {
				if (other.name == "ship" && other.spawning) return;
				if (other.name == "bullet") {
					var asteroidSpeed = Math.max(1.2, Math.abs(parseInt(Math.max(this.vel.x, this.vel.y) * 10) / 10));
					Game.score += (120 / this.scale) * Math.floor(other.scoreFactor + asteroidSpeed);
				}


				this.scale /= 2;
				if (this.scale > 0.4) {
					// break into fragments
					for (var i = 0; i < Game.collisionDebris; i++) {
						var roid = $.extend(true, {}, this);
						roid.vel.x = Math.random() * 6 - 3;
						roid.vel.y = Math.random() * 6 - 3;
						// if (Math.random() > 0.5) {
						//   roid.points.reverse();
						// }
						roid.vel.rot = Math.random() * 2 - 1;
						roid.move(roid.scale * 3); // give them a little push
						Game.sprites.push(roid);
					}
				}

				if (other.name != "ship") {
					Game.soundPool.explosion.get();
					Game.explosionAt(other.x, other.y);
				} else {
					Game.destructionAt(other.x, other.y);
				}
				this.die();
			};
			this.draw = function() {
				if (!this.visible || !this.points) return;
				this.context.lineWidth = 1.0 / this.scale;


				this.context.strokeStyle = 'rgba(255,255,255,0)';
				this.context.beginPath();

				this.context.moveTo(this.points[0], this.points[1]);
				for (var i = 1; i < this.points.length / 2; i++) {
					var xi = i * 2;
					var yi = xi + 1;
					this.context.lineTo(this.points[xi], this.points[yi]);
				}

				this.context.closePath();
				this.context.stroke();


				this.context.drawImage(this.buzzword.img, this.points[0], this.points[1], this.points[2] * 2, this.points[5] * 2);



			};
		};
		Asteroid.prototype = new Sprite();

		var Explosion = function() {
			this.init("explosion");

			this.bridgesH = false;
			this.bridgesV = false;

			this.lines = [];
			for (var i = 0; i < 7; i++) {
				var rad = 2 * Math.PI * Math.random();
				var x = Math.cos(rad);
				var y = Math.sin(rad);
				this.lines.push([x, y, x * 2, y * 2]);
			}

			this.draw = function() {
				if (this.visible) {
					this.context.save();
					this.context.strokeStyle = '#fff';
					this.context.lineWidth = 1.0 / this.scale;
					this.context.beginPath();
					for (var i = 0; i < this.lines.length; i++) {
						var line = this.lines[i];
						this.context.moveTo(line[0], line[1]);
						this.context.lineTo(line[2], line[3]);
					}
					this.context.stroke();
					this.context.restore();
				}
			};

			this.preMove = function(delta) {
				if (this.visible) {
					this.scale += delta;
				}
				if (this.scale > 8) {
					this.die();
				}
			};
		};
		Explosion.prototype = new Sprite();

		var Destruction = function() {
			this.init("destruction");

			this.bridgesH = false;
			this.bridgesV = false;

			this.loops = 0;
			this.maxloops = 20;

			this.particles = [];
			for (var i = 0; i < 10; i++) {
				var rad = 2 * Math.PI * Math.random();
				var x = Math.cos(rad);
				var y = Math.sin(rad);
				var velX = Math.random() * 6 - 3;
				var velY = Math.random() * 6 - 3;
				this.particles.push([x, y, velX, velY]);
			}

			this.draw = function() {
				if (this.visible) {
					var alpha = .5 * (this.maxloops - this.loops) / 10;
					for (var i = 0; i < this.particles.length; i++) {
						this.context.save();
						this.context.fillStyle = 'rgba(32, 248, 192, ' + alpha + ')';
						this.context.beginPath();
						var particle = this.particles[i];
						var x = particle[0] + particle[2] * delta * this.loops;
						var y = particle[1] + particle[3] * delta * this.loops;
						this.context.arc(x, y, 2, 0, 2 * Math.PI, false);
						this.context.fill();
						this.context.restore();
					}
					this.loops++;
				}
			};

			this.preMove = function(delta) {
				if (this.visible) {
					this.scale += delta / 10;
				}
				// if (this.scale > 12) {
				// 	this.die();
				// }
				if (this.loops >= this.maxloops) {
					this.die();
				}
			};
		};
		Destruction.prototype = new Sprite();

		var GridNode = function() {
			this.north = null;
			this.south = null;
			this.east = null;
			this.west = null;

			this.nextSprite = null;

			this.dupe = {
				horizontal: null,
				vertical: null
			};

			this.enter = function(sprite) {
				sprite.nextSprite = this.nextSprite;
				this.nextSprite = sprite;
			};

			this.leave = function(sprite) {
				var ref = this;
				while (ref && (ref.nextSprite != sprite)) {
					ref = ref.nextSprite;
				}
				if (ref) {
					ref.nextSprite = sprite.nextSprite;
					sprite.nextSprite = null;
				}
			};

			this.eachSprite = function(sprite, callback) {
				var ref = this;
				while (ref.nextSprite) {
					ref = ref.nextSprite;
					callback.call(sprite, ref);
				}
			};

			this.isEmpty = function(collidables) {
				var empty = true;
				var ref = this;
				while (ref.nextSprite) {
					ref = ref.nextSprite;
					empty = !ref.visible || collidables.indexOf(ref.name) == -1
					if (!empty) break;
				}
				return empty;
			};
		};

		/**
		 * A sound pool to use for the sound effects
		 */
		var SoundPool = function(maxSize, vol) {
			var size = maxSize; // Max sounds allowed in the pool
			var pool = [];
			this.pool = pool;
			var currSound = 0;

			if (vol == undefined || vol == null) {
				this.vol = .12;
			} else {
				this.vol = vol;
			}
			/*
			 * Populates the pool array with the given object
			 */
			this.init = function(object) {
				var snd, path;

				switch (object) {
					case "laser":
						path = "assets/sounds/laser.wav";
						break;
					case "words":
						path = "assets/sounds/wordproblems.wav";
						break;
					case "explosion":
						path = "assets/sounds/explosion.wav";
						break;
					case "win":
						path = "assets/sounds/you-win.wav";
						break;
					case "loss":
						path = "assets/sounds/i-win.wav";
						break;
					case "ladies":
						path = "assets/sounds/ladies.wav";
						break;
					case "gameover":
						path = "assets/sounds/gameover.wav";
						break;
					case "echo":
						path = "assets/sounds/echo.wav";
						break;
					case "lifeup":
						path = "assets/sounds/lifeup.wav";
						break;
					case "playerdied":
						path = "assets/sounds/playerdied.wav";
						break;
					case "perfect":
						path = "assets/sounds/perfect-score.wav";
						break;
					case "enough":
						path = "assets/sounds/enough.wav";
						break;

				}
				for (var i = 0; i < size; i++) {
					// Initalize the object
					snd = new Audio(path);
					snd.volume = this.vol;
					snd.load();
					pool[i] = snd;
				}
			};

			/*
			 * Plays a sound
			 */
			this.get = function() {
				if (!Game.soundOn) {
					return;
				}
				if (pool[currSound].currentTime == 0 || pool[currSound].ended) {
					pool[currSound].play();
				}
				currSound = (currSound + 1) % size;
			};
		};

		var Game = {
			score: 0,
			totalAsteroids: 5,
			lives: 0,
			maxlives: 8,

			canvasWidth: 800,
			canvasHeight: 600,

			sprites: [],
			ship: null,

			lifeCache: 0,
			scoreCache: 0,

			gameAudio: {},
			atmoAudio: {},
			soundPool: {},

			checkAudio: {},
			audioLoaded: false,

			soundOn: true,
			musicOn: true,

			whichAudio: 'runAtmoAudio',

			collisionDebris: 1,

			shipMaxSpeed: 8,
			shipCurrSpeed: 4,

			alive: false,


			initAudio: function() {

				this.gameAudio = new Audio("assets/sounds/arcadeloop.mp3");
				this.gameAudio.loop = true;
				this.gameAudio.volume = .07;
				this.gameAudio.load();

				this.atmoAudio = new Audio("assets/sounds/atmospheric.mp3");
				this.atmoAudio.loop = true;
				this.atmoAudio.volume = .1;
				this.atmoAudio.load();

				this.soundPool.laser = new SoundPool(10);
				this.soundPool.laser.init("laser");

				this.soundPool.explosion = new SoundPool(20, 0.06);
				this.soundPool.explosion.init("explosion");

				this.soundPool.gameover = new SoundPool(1);
				this.soundPool.gameover.init("gameover");

				this.soundPool.ladies = new SoundPool(1);
				this.soundPool.ladies.init("ladies");

				this.soundPool.loss = new SoundPool(1);
				this.soundPool.loss.init("loss");

				this.soundPool.win = new SoundPool(1);
				this.soundPool.win.init("win");

				this.soundPool.words = new SoundPool(1, .08);
				this.soundPool.words.init("words");

				this.soundPool.echo = new SoundPool(1, .08);
				this.soundPool.echo.init("echo");

				this.soundPool.lifeup = new SoundPool(2, .08);
				this.soundPool.lifeup.init("lifeup");

				this.soundPool.playerdied = new SoundPool(1, .08);
				this.soundPool.playerdied.init("playerdied");

				this.soundPool.perfect = new SoundPool(1, .09);
				this.soundPool.perfect.init("perfect");

				this.soundPool.enough = new SoundPool(1, .09);
				this.soundPool.enough.init("enough");

				this.checkAudio = window.setInterval(function() {
					readyStateAudio();
				}, 500);
			},

			spawnAsteroids: function(count) {
				if (!count) count = this.totalAsteroids;
				for (var i = 0; i < count; i++) {
					var roid = new Asteroid(i);
					roid.x = Math.random() * this.canvasWidth;
					roid.y = Math.random() * this.canvasHeight;
					while (!roid.isClear()) {
						roid.x = Math.random() * this.canvasWidth;
						roid.y = Math.random() * this.canvasHeight;
					}
					roid.vel.x = Math.random() * 4 - 2;
					roid.vel.y = Math.random() * 4 - 2;
					roid.vel.rot = Math.random() * 2 - 1;
					Game.sprites.push(roid);
				}
			},

			explosionAt: function(x, y) {
				var sprite = new Explosion();
				sprite.x = x;
				sprite.y = y;
				sprite.visible = true;
				Game.sprites.push(sprite);
			},

			destructionAt: function(x, y) {
				var sprite = new Destruction();
				sprite.x = x;
				sprite.y = y;
				sprite.visible = true;
				Game.sprites.push(sprite);
			},

			runGameAudio: function() {
				if (!Game.musicOn) {
					return;
				}
				Game.whichAudio = 'runGameAudio';
				Game.atmoAudio.pause();

				Game.gameAudio.currentTime = 0;
				Game.gameAudio.play();
			},



			runAtmoAudio: function() {
				if (!Game.musicOn) {
					return;
				}
				Game.whichAudio = 'runAtmoAudio';
				Game.atmoAudio.currentTime = 0;
				Game.atmoAudio.play();

				Game.gameAudio.pause();
			},


			killGame: function() {
				Game.atmoAudio.pause();
				Game.gameAudio.pause();
				Game.atmoAudio = null;
				Game.gameAudio = null;
				Game.alive = false;
			},

			toggleMusic: function() {
				Game.musicOn = !Game.musicOn;
				Game.gameAudio.pause();
				Game.atmoAudio.pause();
				Game[Game.whichAudio]();
			},

			toggleSound: function() {
				Game.soundOn = !Game.soundOn;
			},


			FSM: {
				pointout: {
					ladies: false,
					words: false
				},
				boot: function() {
					Game.spawnAsteroids(5);
					Game.runAtmoAudio();
					this.state = 'waiting';
				},
				waiting: function() {
					if (this.timer == null) {
						this.timer = Date.now();
					}
					if (KEY_STATUS.space || window.gameStart) {
						KEY_STATUS.space = false; // hack so we don't shoot right away
						window.gameStart = false;
						this.state = 'start';
						this.timer = null;
					} else {
						if (Date.now() - this.timer > 10000 && !this.pointout.ladies) {
							this.pointout.ladies = true;
							Game.soundPool.ladies.get();
						}
						if (Date.now() - this.timer > 30000 && !this.pointout.words && this.pointout.ladies) {
							this.pointout.words = true;
							this.timer = null;
							Game.soundPool.words.get();
						}
					}
				},
				start: function() {

					Game.runGameAudio();

					$('#screens').fadeOut();
					$('#gameVars').removeClass('endscreen');
					$('#game').addClass('playing');
					for (var i = 0; i < Game.sprites.length; i++) {
						if (Game.sprites[i].name == 'asteroid') {
							Game.sprites[i].die();
						} else if (Game.sprites[i].name == 'bullet' ||
							Game.sprites[i].name == 'bigalien') {
							Game.sprites[i].visible = false;
						}
					}
					if (!Game.lifeCache && !Game.scoreCache) {

						Game.score = 0;
						Game.lives = 3;
					} else {
						Game.score = Game.scoreCache;
						Game.lives = Game.lifeCache;
						$('#game').addClass('continued');
					}
					Game.totalAsteroids = 5;
					Game.spawnAsteroids();


					this.state = 'spawn_ship';
				},
				spawn_ship: function() {
					Game.ship.spawning = true;
					Game.ship.accelerated = false;
					Game.ship.x = Game.canvasWidth / 2;
					Game.ship.y = Game.canvasHeight / 2;
					Game.ship.visible = true;
					Game.ship.rot = 0;
					Game.ship.rot = 0;
					Game.ship.vel.x = 0;
					Game.ship.vel.y = 0;
					if (Game.ship.isClear()) {
						Game.ship.spawned = Date.now();
						Game.ship.spawning = false;
						this.state = 'run';
					} else {
						this.state = 'wait_clearance';
					}
				},
				wait_clearance: function() {
					if (Game.ship.isClear()) {
						Game.ship.spawning = false;
						Game.ship.spawned = Date.now();
						this.state = 'run';
					}
				},
				run: function() {
					for (var i = 0; i < Game.sprites.length; i++) {
						if (Game.sprites[i].name == 'asteroid') {
							break;
						}
					}
					if (i == Game.sprites.length) {
						this.state = 'new_level';
					}
				},
				new_level: function() {
					if (this.timer == null) {
						this.timer = Date.now();
					}



					// wait a second before spawning more asteroids
					if (Date.now() - this.timer > 1000) {
						this.timer = null;

						Game.totalAsteroids += 3;
						if (!$('#game').hasClass('continued')) {
							Game.scoreCache = Game.score;
							Game.lifeCache = Game.lives;
							$('#screens').removeClass('ready').removeClass('loss').addClass('win');
							$('#continue').fadeOut(0);
							$('#restart').fadeOut(0);
							window.setTimeout(function() {
								$('#gameVars').addClass('endscreen');
								$('#screens').fadeIn();
								$('#game').removeClass('playing');
							}, 1000);
							window.setTimeout(function() {
								$('#continue').fadeIn();
							}, 3000);
							this.state = 'pause_game';

							Game.totalAsteroids = 10;
							Game.collisionDebris++;
							Game.shipCurrSpeed++;
							if (Game.shipCurrSpeed > Game.shipMaxSpeed) {
								Game.shipCurrSpeed = Game.shipMaxSpeed;
							}


							window.setTimeout(function() {
								Game.soundPool.win.get();
							}, 3000);

							Game.soundPool.echo.get();

							Game.runAtmoAudio();
							Game.lives = (Game.lives < 3 ? 3 : Game.lives);

						} else {

							if (Game.totalAsteroids > 35) {
								Game.totalAsteroids = 35;

							}

							Game.runGameAudio();
							Game.spawnAsteroids();
							this.state = 'run';
						}

					}
				},
				player_died: function() {
					if (Game.lives < 1) {
						$('#screens').removeClass('ready').removeClass('win').addClass('loss');
						$('#game').removeClass('continued');
						Game.scoreCache = 0;
						Game.lifeCache = 0;
						$('#restart').fadeOut(0);
						$('#continue').fadeOut(0);

						Game.runAtmoAudio();
						Game.soundPool.gameover.get();

						window.setTimeout(function() {
							$('#screens').fadeIn();
							$('#gameVars').addClass('endscreen');
							$('#game').removeClass('playing');
						}, 1000);
						window.setTimeout(function() {
							$('#restart').fadeIn();
							Game.soundPool.loss.get();
						}, 3000);
						this.state = 'end_game';
					} else {
						if (this.timer == null) {
							this.timer = Date.now();
						}
						// wait a second before spawning
						if (Date.now() - this.timer > 2000) {
							this.timer = null;
							this.state = 'spawn_ship';
						}
					}
				},
				pause_game: function() {
					// Text.renderText('GAME OVER', 50, Game.canvasWidth / 2 - 160, Game.canvasHeight / 2 + 10);
					if (this.timer == null) {
						this.timer = Date.now();
					}
					// wait 5 seconds then go back to waiting state
					if (Date.now() - this.timer > 3000) {
						this.timer = null;
						this.state = 'waiting';

					}

				},
				end_game: function() {
					// Text.renderText('GAME OVER', 50, Game.canvasWidth / 2 - 160, Game.canvasHeight / 2 + 10);
					if (this.timer == null) {
						this.timer = Date.now();
					}
					KEY_STATUS.space = false;



					// wait 5 seconds then go back to waiting state
					if (Date.now() - this.timer > 3000) {
						this.timer = null;
						this.state = 'waiting';
					}

					window.gameStart = false;
				},

				execute: function() {
					this[this.state]();
				},
				state: 'boot'
			}

		};

		var readyStateAudio = function() {
			if (Game.gameAudio.readyState === 4 && Game.atmoAudio.readyState === 4) {
				window.clearInterval(Game.checkAudio);
				Game.audioLoaded = true;
			}
		};

		$('#screens img').addClass('ready').fadeOut(0);
		$('#screens').fadeOut(0).addClass('ready').fadeIn();

		var randBetween = function(min, max) {
			return Math.floor(Math.random() * (max - min + 1) + min);
		};

		var pad = function(n, width, z) {
			z = z || '0';
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
		};


		var KEY_CODES = {
			32: 'space',
			37: 'left',
			38: 'up',
			39: 'right',
			40: 'down'
		}

		var KEY_STATUS = {
			keyDown: false
		};
		for (var code in KEY_CODES) {
			KEY_STATUS[KEY_CODES[code]] = false;
		}

		$(window).keydown(function(e) {
			KEY_STATUS.keyDown = true;
			if (KEY_CODES[e.keyCode]) {
				e.preventDefault();
				KEY_STATUS[KEY_CODES[e.keyCode]] = true;
			}
		}).keyup(function(e) {
			KEY_STATUS.keyDown = false;
			if (KEY_CODES[e.keyCode]) {
				e.preventDefault();
				KEY_STATUS[KEY_CODES[e.keyCode]] = false;
			}
		});

		var remainingLifes = new Ship();
		remainingLifes.scale = .8;
		remainingLifes.visible = true;
		remainingLifes.preMove = null;
		remainingLifes.children = [];

		var maxLifes = new Ship();
		maxLifes.scale = .8;
		maxLifes.outline = true;
		maxLifes.visible = true;
		maxLifes.preMove = null;
		maxLifes.children = [];


		var GRID_SIZE = 60;



		var canvas = $("#game");
		Game.canvasWidth = canvas.width();
		Game.canvasHeight = canvas.height();

		var context = canvas[0].getContext("2d");



		var gridWidth = Math.round(Game.canvasWidth / GRID_SIZE);
		var gridHeight = Math.round(Game.canvasHeight / GRID_SIZE);
		var grid = new Array(gridWidth);
		for (var i = 0; i < gridWidth; i++) {
			grid[i] = new Array(gridHeight);
			for (var j = 0; j < gridHeight; j++) {
				grid[i][j] = new GridNode();
			}
		}

		// set up the positional references
		for (var i = 0; i < gridWidth; i++) {
			for (var j = 0; j < gridHeight; j++) {
				var node = grid[i][j];
				node.north = grid[i][(j == 0) ? gridHeight - 1 : j - 1];
				node.south = grid[i][(j == gridHeight - 1) ? 0 : j + 1];
				node.west = grid[(i == 0) ? gridWidth - 1 : i - 1][j];
				node.east = grid[(i == gridWidth - 1) ? 0 : i + 1][j];
			}
		}

		// set up borders
		for (var i = 0; i < gridWidth; i++) {
			grid[i][0].dupe.vertical = Game.canvasHeight;
			grid[i][gridHeight - 1].dupe.vertical = -Game.canvasHeight;
		}

		for (var j = 0; j < gridHeight; j++) {
			grid[0][j].dupe.horizontal = Game.canvasWidth;
			grid[gridWidth - 1][j].dupe.horizontal = -Game.canvasWidth;
		}

		var sprites = [];
		Game.sprites = sprites;

		// so all the sprites can use it
		Sprite.prototype.context = context;
		Sprite.prototype.grid = grid;
		Sprite.prototype.matrix = new Matrix(2, 3);

		var ship = new Ship();

		ship.x = Game.canvasWidth / 2;
		ship.y = Game.canvasHeight / 2;
		Game.ship = ship;

		sprites.push(ship);

		ship.bullets = [];
		for (var i = 0; i < 10; i++) {
			var bull = new Bullet();
			ship.bullets.push(bull);
			sprites.push(bull);
		}
		Game.ship = ship;

		Game.initAudio();

		var i, j = 0;

		var paused = false;
		var showFramerate = false;
		var avgFramerate = 0;
		var frameCount = 0;
		var elapsedCounter = 0;

		var lastFrame = Date.now();
		var thisFrame;
		var elapsed;
		var delta;
		var nextExtraLife = 1;
		var nextExtraLifePoints = 10000;

		var canvasNode = canvas[0];

		// shim layer with setTimeout fallback
		// from here:
		// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
		window.requestAnimFrame = (function() {
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function( /* function */ callback, /* DOMElement */ element) {
					window.setTimeout(callback, 1000 / 60);
				};
		})();



		function mainLoop() {
			context.clearRect(0, 0, Game.canvasWidth, Game.canvasHeight);

			Game.FSM.execute();

			thisFrame = Date.now();
			elapsed = thisFrame - lastFrame;
			lastFrame = thisFrame;
			delta = elapsed / 30;

			for (var i = 0; i < sprites.length; i++) {

				sprites[i].run(delta);

				if (sprites[i].reap) {
					sprites[i].reap = false;
					sprites.splice(i, 1);
					i--;
				}
			}

			if (Game.score >= nextExtraLife * nextExtraLifePoints) {
				Game.soundPool.lifeup.get();
				Game.lives++;
				if (Game.lives > Game.maxlives) {
					Game.lives = Game.maxlives;
				}
				Game.collisionDebris++;
				Game.shipCurrSpeed++;
				if (Game.shipCurrSpeed > Game.shipMaxSpeed) {
					Game.shipCurrSpeed = Game.shipMaxSpeed;
				}
				nextExtraLife++;
				window.setTimeout(function() {
					Game.soundPool.perfect.get();
				}, 1000);

			}

			// $('#numships span').html(pad((Game.lives < 0 ? 0 : Game.lives), 2));
			for (i = 0; i < Game.maxlives; i++) {
				context.save();
				maxLifes.x = 50 + (15 * (i + 1));
				maxLifes.y = 20;
				maxLifes.configureTransform();
				maxLifes.draw();
				context.restore();
			}
			for (i = 0; i < Game.lives; i++) {
				context.save();
				remainingLifes.x = 50 + (15 * (i + 1));
				remainingLifes.y = 20;
				remainingLifes.configureTransform();
				remainingLifes.draw();
				context.restore();
			}
			$('#playerscore span').html(pad(Game.score, 8));
			// Text.renderText(score_text, 18, Game.canvasWidth - 14 * score_text.length, 20);


			frameCount++;
			elapsedCounter += elapsed;
			if (elapsedCounter > 1000) {
				elapsedCounter -= 1000;
				avgFramerate = frameCount;
				frameCount = 0;
			}
			if (Game.alive) {
				requestAnimFrame(mainLoop, canvasNode);
			}

		};

		$('#musicState').click(function() {
			$(this).toggleClass('inactive');
			Game.toggleMusic();
		});
		$('#soundState').click(function() {
			$(this).toggleClass('inactive');
			Game.toggleSound();
		});
		$('#game').click(function() {
			Game.FSM.state = 'start';
			$(this).off('click');
		});

		window.yodorada.game = Game;


		var waitAssets = setInterval(function() {

			if (ImageRepository.assetsLoaded && Game.audioLoaded) {
				clearInterval(waitAssets);
				Game.alive = true;
				mainLoop();
			}
		}, 100);



	};
})(jQuery);