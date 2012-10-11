/**
 * Slideshowify is a jQuery plugin for generating (window) edge-to-edge slideshows
 * from passed images, which could be passed selector, or json from an api endpoint. 
 * Images that don't fit the window proportions exactly (usually the case) are cropped 
 * and panned across the screen. Images which fit the screen exactly, are displayed fully
 * then slightly zoomed.
 *
 * Author: Aleksandar Kolundzija 
 * version 0.9
 *
 * Should appear on subchild.com, github, and jQuery plugins page at some point soon.
 * Will likely be used on Gallerama.com in some shape or form as well.
 * 
 * @requires jquery
 * @requires jquery.transit (http://ricostacruz.com/jquery.transit/) as of v. 0.9
 *
 * @TODO Consider adding option to pass image data directly to $.slideshowify()
 * @TODO Add header/subheader display, along with controls for pause and close. (likely on hover)
 * @TODO Add unit tests
 */

(function($){
	$.fn.slideshowify = function(/* config */){
	
		var _self         = this,
			_imgs         = [],
			_imgIndex     = -1,	
			_imgIndexNext = 0, // for preloading next			
			_transition   = true,
			_easing = 'in-out',
			_cfg  = {
				containerId   : "slideshowify-bg", // id of slideshowify div created by the plugin
				containerCss  : {
					"position" : "absolute",
					"overflow" : "hidden",
					"z-index"  : "-2",
					"left"     : "0",
					"top"      : "0",
					"width"    : "100%",
					"height"   : "100%"
				},
				blend         : "into", // "into" || "toBg"
				fadeInSpeed   : 1500,
				fadeOutSpeed  : 1500,
				aniSpeedMin   : 9000, 
				aniSpeedMax   : 15000,
				afterFadeIn   : function(){},
				beforeFadeOut : function(){}
			};
			
		if (arguments[0]){
			$.extend(_cfg, arguments[0]); // reconfigure
		}
			
		/**
		 * Fills screen with image (most likely cropped based on its dimensions and window size).
		 * @TODO Add a resize handler to adjust photo dimensions and margins
		 */
		function _revealImg(curImg){
			var $doc      = $(document),
				$img      = $(this),
				docW      = $doc.width(),
				docH      = $doc.height(),
				docRatio  = docW/docH,
				imgRatio  = $img.width()/$img.height(),
				transAttr = {},
				direction = Math.round(Math.random());

			if (imgRatio > docRatio){
				$img.height(docH + 'px').width(curImg.w * (docH/curImg.h) + 'px');				
				marginPixels = ($img.width() - docW);
				if (direction){
					$img.css({'left':'-' + marginPixels + 'px'}); // move image before slide if sliding to right
				}
				transAttr = {'x': (direction ? '' : '-') + marginPixels + 'px'}; 
			}
			else {
				$img.width(docW+'px').height(curImg.h * (docW/curImg.w) + 'px');				
				marginPixels = ($img.height() - docH);
				if (direction){
					$img.css({'top':'-' + marginPixels + 'px'}); // move image before slide if sliding down
				}
				transAttr = {'y' : (direction ? '' : '-') + marginPixels + 'px'}; // will be sliding to zero
			}

			// if margin is too small, zoom in a little instead of panning
			// @TODO consider using percentage instead of pixel value (100)
			if (_transition && marginPixels < 100){
				if (direction){
					$img.css('scale','1.2');
					transAttr = {'scale':'1'};
				}
				else {
					transAttr = {'scale':'1.2'};
				}
			}

			$.extend(transAttr, {
				duration : Math.min(Math.max(marginPixels * 10, _cfg.aniSpeedMin), _cfg.aniSpeedMax),
				easing   : _easing,
				queue    : false
			});

			$img
				.fadeIn(_cfg.fadeInSpeed, function(){
					$img.css('z-index', -1);
					_cfg.afterFadeIn(_imgs[_imgIndex]);
				})
				.transition(transAttr, function(){
					_cfg.beforeFadeOut(_imgs[_imgIndex]);
					$(this).fadeOut(_cfg.fadeOutSpeed, function(){
						$(this).remove();
					});
					_loadImg();
				}); 
		}	// end of _revealImg()

		
		/**
		 * Loads image and starts display flow
		 * @TODO fix preloading stuff; only preload images once (don't loop)
		 */
		function _loadImg(){
			var img     = new Image(),
				nextImg = new Image(), // for preloading
				len     = _imgs.length;

			_imgIndex = (_imgIndex < len-1) ? _imgIndex+1 : 0;
		
			$(img)
				// assign handlers
				.load(function(){
					if (_cfg.blend==="into"){
						$(this).css({"position":"absolute", "z-index":"-2"});
						$("#"+_cfg.containerId).append(this);
					}
					else {
						$("#"+_cfg.containerId).empty().append(this);
					}
					_revealImg.call(this, _imgs[_imgIndex]);
				})
				.error(function(){
					throw new Error("Oops, can't load the image.");
				})
				.hide()
				.attr("src", _imgs[_imgIndex].src); // load
			
			// preload next image
			_imgIndexNext = _imgIndex + 1;
			if (_imgIndexNext < len-1){
				nextImg.src = _imgs[_imgIndexNext].src;
			}
		} // end of _loadImg()
		

		// INITIALIZE
		if (!$.support.transition) {
        	$.fn.transition = $.fn.animate; // don't use css3 animations if not supported
        	_transition = false;
        	_easing = 'swing';
      	}

    	if (!_cfg.imgs){ // if images weren't passed as array, load from object
			// load images into private array
			$(this).each(function(i, img){
				$(img).hide();
				_imgs.push({
					src : $(img).attr("src"),
					w   : $(img).width(),
					h   : $(img).height()
				});
			});
		}
		else {
			_imgs = _cfg.imgs;
		}
	
		// create container div 
		$("<div id='"+_cfg.containerId+"'></div>")
			.css(_cfg.containerCss)
			.appendTo("body");
	
		// start
		_loadImg();
		
		return this;
	};
		
}(jQuery));



/**
 * Expose slideshowify() to jQuery for use without DOM selector.
 * @TODO add support for image array as a parameter (no need for ajax)
 */ 
$.slideshowify = function(cfg){
	
	var _self = this,
		_cfg  = {
			randomize : false,
			dataUrl   : "",
			dataType  : "json",
			async     : true,
			filterFn  : function(data){ return data; } // default filter. does nothing
		};
			
	$.extend(_cfg, cfg);

	$.ajax({
		url      : _cfg.dataUrl,
		dataType : _cfg.dataType,
		async    : _cfg.async,
		success  : function(imgs){
			_cfg.imgs = _cfg.filterFn(imgs);			
			if (_cfg.randomize){ 
				_cfg.imgs.sort(function(){
					return 0.5 - Math.random();
				});
			}
			$({}).slideshowify(_cfg);
		}
	});
	
};
