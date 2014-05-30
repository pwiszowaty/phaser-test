var assets, folder = 'parts';
var timeout, dots = 0, loader;
var loadingText = 'Loading<br />';

// function loading() {

// 	var str = loadingText;
// 	var i;

// 	if(dots > 3){
// 		dots = 0;
// 	}

// 	for (i = 0; i < dots; i++) {
// 		str += '.';
// 	}

// 	$('#loader').html(str);
// 	dots++;

// 	timeout = window.setTimeout(loading, 50);
// };
// loading();

$.getJSON( folder+".json", function( data ) {
	assets = data;
})
.always(function(){
	startGame();
});

var startGame = function () {

	var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
	var logo, 
		gui,
		keys=Phaser.Keyboard, 
		hero, 
		sprites,
		background1, 
		bgspeed = 1,
		speedFactor = 1,
		speedStep = 150, 
		bulletSpeed = 1000,
		bullets,
		bulletTime = 210, 
		bulletTimeTotal = 0,
		maxBullets = 100,
		maxObjects = 100, 
		objects = [], 
		generator,
		chat, 
		laserSound;
	 
	function preload() { 		
		preloadAsset('body');
		preloadAsset('cockpit');
		preloadAsset('engine');
		preloadAsset('gun');
		preloadAsset('wing');

		game.load.audio('laser', ['assets/audio/laser.mp3', 'assets/audio/laser.ogg']);

		game.load.image('bullet', '../phaser/examples/assets/misc/bullet0.png');
		
		game.load.image('bg','assets/img/bg.jpg');
	}

	function preloadAsset(group){
		for( var i = 0; i < assets[group].length; i++ ){
			game.load.image(assets[group][i].name, folder + '/' + assets[group][i].name + ".png" );
		}
	}
	
	function create() {		
		background1 = game.add.tileSprite(0, 0, 2000, 2000, 'bg');
		game.world.setSize(2000, 2000);

		generator = new Phaser.RandomDataGenerator();
		
		// Chrome-specific fix that allows canvas to be focused on.
		$("body > canvas").attr("tabindex", "0");

		$('#build').click(function(){
			regenerateShip();
		});

		$('#nextWave').click(function(){
			addRandomObjects(20, 1);
		});
		
		$('#angle').change(function(){
			hero.angle = $(this).val();
		});

		gui = function () {

			var scoreboard = $('#scoreboard');

			return {
				addScore: function(x) {
					scoreboard.text( +scoreboard.text() +x );
				},
				reset: function() {
					scoreboard.text('0');
				}

			};
		}();
		gui.reset();
		
		//hero = game.add.sprite(game.world.centerX, game.world.centerY, 'b2');
		hero = game.add.sprite(20, 20, 'b2');
		
		hero.anchor.x = 0.5;
		hero.anchor.y = 0.5;
		game.camera.follow(hero);

		bullets = initGroup('bullets', 'bullet', 1, 100, maxBullets);
        objects = initGroup('objects', 'b1', 100, 50, maxObjects);
		
		game.input.onDown.add(fireBullet, this);

		window.clearTimeout(timeout);
		$('#loader').fadeOut('fast');

		laserSound = game.add.audio('laser',1,false);
	}

	function initGroup(name, img, hitPoints, power, max) {
		var i,
			obj,
			group = game.add.group(null, name);

        for (i = 0; i < max; i++)
        {
            obj = group.create(0, 0, img);
            obj.name = name + i;
            obj.hitPoints = hitPoints;
            obj.power = power;
            obj.exists = false;
            obj.visible = false;
            obj.events.onOutOfBounds.add(resetObject, this);
        }

        return group;
	}

	function update() {
		hero.body.velocity.x=hero.body.velocity.y=0;

		if(game.input.keyboard.isDown(keys.A) && !game.input.keyboard.isDown(keys.D)){
			hero.body.velocity.x = - (speedStep * speedFactor);
		}
		else if(game.input.keyboard.isDown(keys.D) && !game.input.keyboard.isDown(keys.A)){
			hero.body.velocity.x = speedStep * speedFactor;
		}

		if(game.input.keyboard.isDown(keys.W) && !game.input.keyboard.isDown(keys.S)){
			hero.body.velocity.y = - speedStep * speedFactor;
		}
		else if(game.input.keyboard.isDown(keys.S) && !game.input.keyboard.isDown(keys.W)){
			hero.body.velocity.y = speedStep * speedFactor;
		}

		moveBackground();
		lookAtPointer();
		collideObjects();
	}

	function regenerateShip() {
		//hero.visible=!hero.visible;

		hero.x = game.world.centerX;
		hero.y = game.world.centerY;
	}

	function moveBackground() {
		background1.position.y - (bgspeed); 

	}

	function lookAtPointer() {
		hero.angle = Phaser.Math.radToDeg(Phaser.Math.angleBetween( -hero.position.y, hero.position.x, -game.input.y, game.input.x)); 
	}

	function collideObjects () {
		game.physics.collide(bullets, objects, objectHit, null, this);
	}
	
    function fireBullet () {

        if (game.time.now > bulletTimeTotal)
        {
        	bulletTimeTotal	= game.time.now + bulletTime;

            bullet = bullets.getFirstExists(false);

            if (bullet)
            {
                bullet.angle = hero.angle;

                bullet.anchor.x = 0.5;
                bullet.anchor.y = 0.5;
                
				var valX = game.input.x - hero.position.x; 
				var valY = - (game.input.y - hero.position.y);
				var valSum = Math.abs(valX) + Math.abs(valY);

                bullet.reset(hero.x, hero.y);
                bullet.velocity.y = - (valY / valSum) * bulletSpeed;
                bullet.velocity.x = (valX / valSum) * bulletSpeed;
				laserSound.play('',0,1);
            }
        }

    }

	function objectHit(_bullet, _obj) {

		if(_obj.hitPoints != undefined) {
			if(_bullet.power != undefined) {
				_obj.hitPoints -= _bullet.power;
				if( _obj.hitPoints <= 0) {
					_obj.kill();
					gui.addScore(1);
				}
			}
		}

		_bullet.kill();		
	}
    
    //  Called if the bullet goes out of the screen
    function resetObject (obj) {
    	obj.kill();
    }

    function addRandomObjects (count, level) {
        for (i=0; i<count; i++) {

            obj = objects.getFirstExists(false);

            if (obj)
            {
            	obj.anchor.x = 0.5;
            	obj.anchor.y = 0.5;

            	obj.reset(- generator.integerInRange(0, 100), - generator.integerInRange(0, 100));
            	obj.velocity.x = generator.integerInRange(100, 160);
            	obj.velocity.y = generator.integerInRange(100, 160);
            }
        }
    }
};