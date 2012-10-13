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
			_easing       = 'in-out',
			_cfg = {
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
		 * @TODO Add a window resize handler (adjust photo dims/margins)
		 */
		function _revealImg(curImg){
			var $doc      = $(document),
				$img      = $(this),
				docW      = $doc.width(),
				docH      = $doc.height(),
				direction = Math.round(Math.random()),
				docRatio  = docW/docH,
				imgRatio  = $img.width()/$img.height(),
				transAttr = {},
				transProps,
				marginPixels,
				modDims;  // will hold values to set/animate

			if (imgRatio > docRatio){
				modDims = _transition ? 
							{dim:'left', attr:'x'} :
							direction ? {dim:'left', attr:'left'} : {dim:'right', attr:'right'};
				$img.height(docH + 'px').width(curImg.w * (docH/curImg.h) + 'px');			
				marginPixels = $img.width() - docW;
				$img.css(modDims.dim, '0px'); 
				transAttr[modDims.attr] = '-' + marginPixels + 'px';
			}
			else {
				modDims = _transition ? 
							{dim:'top', attr:'y'} :
							direction ? {dim:'top', attr:'top'} : {dim:'bottom', attr:'bottom'};
				$img.width(docW+'px').height(curImg.h * (docW/curImg.w) + 'px');				
				marginPixels = $img.height() - docH;
				$img.css(modDims.dim, '0px');
				transAttr[modDims.attr] = '-' + marginPixels + 'px'; 
			}

			// if margin is too small, zoom a little instead of panning
			// @TODO consider using percentage instead of pixel value (100)
			if (_transition && marginPixels < 100){
				if (direction){ // zoom out 
					$img.css('scale','1.2');
					transAttr = {'scale':'1'};
				}
				else { // zoom in
					transAttr = {'scale':'1.2'};
				}
			}

			transProps = {
				duration : Math.min(Math.max(marginPixels * 10, _cfg.aniSpeedMin), _cfg.aniSpeedMax),
				easing   : _easing,
				queue    : false, 
				complete : function(){
					_cfg.beforeFadeOut(_imgs[_imgIndex]);
					$img.fadeOut(_cfg.fadeOutSpeed, function(){
						$img.remove();
					});
					_loadImg();

				}
			};

			$img.fadeIn(_cfg.fadeInSpeed, function(){
					$img.css('z-index', -1);
					_cfg.afterFadeIn(_imgs[_imgIndex]);
				});

			// use animate if css3 transitions aren't supported
			_transition ? 
				$img.transition($.extend(transAttr, transProps)) :
				$img.animate(transAttr, transProps);
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
					if (_cfg.blend==='into'){
						$(this).css({'position':'absolute', 'z-index':'-2'});
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
        	_transition = false;
        	_easing = 'swing';
      	}

    	if (!_cfg.imgs){ // if images weren't passed as array, load from object
			// load images into private array
			$(this).each(function(i, img){
				$(img).hide();
				_imgs.push({
					src : $(img).attr('src'),
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
