/**
 * Slideshowify is a jQuery plugin for generating a full-screen (well, browser dims) slideshow 
 * from images that match a selector.  Images that don't fit the window proportions exactly (generally
 * the case) are cropped and panned across the screen.
 *
 * version 0.5
 * Should appear on subchild.com, github, and jQuery plugins page at some point soon.
 * Will likely be used on Gallerama.com in some shape or form as well.
 * 
 * @TODO add more configuration options: direction, css3 prog enhancement stuff
 * @TODO consider adding support for loading images from passed array instead of from DOM
 */

(function($){
	$.fn.slideshowify = function(/* config */){
	
		var _self         = this,
				_imgs         = [],
				_imgIndex     = -1,	
				_imgIndexNext = 0, // for preloading next			
				_fadeTimeoutId,
				_cfg = {
					containerId  : "slideshowify_bg",
					transition   : "into", // or "into"
					fadeInSpeed  : 2000,
					fadeOutSpeed : 2000,
					aniSpeedMin  : 3000, // min animate speed
					aniSpeedMax  : 8000 // max animate speed
				};
			
		if (arguments[0]){
			$.extend(_cfg, arguments[0]); // reconfigure
		}
			
		/**
		 * Fills screen with image (most likely cropped based on its dimensions and window size).
		 * @TODO Use 100% dims for non-IE browsers (do detection), OR instead add a resize handler, OR
		 * make screen full size and prevent resizing.
		 */
		function _adjustImgDims(curImg){
			var $doc     = $(document),
					$img     = $(this),
					docW     = $doc.width(),
					docH     = $doc.height(),
					docRatio = docW/docH,
					imgRatio = $img.width()/$img.height();
			if (imgRatio > docRatio){
	//				$img.height("100%");
				$img.height(docH+"px").width(curImg.w*(docH/curImg.h)+"px");				
				marginPixels = $img.width()-docW;
				marginAttr   = {"margin-left":"-"+marginPixels+"px"};
			}
			else {
	//				$img.width("100%");
				$img.width(docW+"px").height(curImg.h*(docW/curImg.w)+"px");				
				marginPixels = $img.height()-docH;
				marginAttr   = {"margin-top":"-"+marginPixels+"px"};
			}
			$img.fadeIn(_cfg.fadeInSpeed, function(){
				$(this).css("z-index", -1);
			});
			_panOrWait.call(this, marginPixels, marginAttr);
		}	
	
	
		/**
		 * Animates (pans over) image (if not entirely displayed), then loads/shows next image
		 */
		function _panOrWait(marginPixels, marginAttr){
			var img      = this,
					aniSpeed = _cfg.aniSpeedMin;
			if (Math.abs(marginPixels) > 0){ // pan...
				aniSpeed = Math.min(Math.max(marginPixels * 50, _cfg.aniSpeedMin), _cfg.aniSpeedMax);
				$(img).animate(marginAttr, aniSpeed, function(){
					_showNext.call(img);
				});
			}
			else { // or wait...
				_fadeTimeoutId = setTimeout(function(){
					clearTimeout(_fadeTimeoutId);
					_showNext.call(img);
				}, (_cfg.aniSpeedMin + _cfg.aniSpeedMax)/2);
			}
		}
	
	
		/**
		 * Fades out current image and calls starts display of next one
		 */
		function _showNext(){
			$(this).fadeOut(_cfg.fadeOutSpeed, function(){
				$(this).remove();
			});
			_showImg();
		}	
	
		
		/**
		 * Loads image and starts display flow
		 * @TODO fix preloading stuff; only preload images once (don't loop)
		 */
		function _showImg(){
			var img     = new Image(),
					nextImg = new Image(), // for preloading
					len     = _imgs.length;
				
			_imgIndex = (_imgIndex < len-1) ? _imgIndex+1 : 0;
			clearTimeout(_fadeTimeoutId); // @TODO need to be able to clear this timeout externally
		
			$(img)
				// assign handlers
				.load(function(){
					if (_cfg.transition==="into"){
						$(this).css({"position":"absolute", "z-index":"-2"});
						$("#"+_cfg.containerId).append(this);
					}
					else {
						$("#"+_cfg.containerId).empty().append(this);
					}
					_adjustImgDims.call(this, _imgs[_imgIndex]);
				})
				.error(function(){
					alert("Oops, can't load the image.");
				})
				.hide()
				.attr("src", _imgs[_imgIndex].src); // load/show image
			
			// preload next image
			_imgIndexNext = _imgIndex + 1;
			if (_imgIndexNext < len-1){
				nextImg.src = _imgs[_imgIndexNext].src;
			}
		}
		


		// load images into private array
		$(this).each(function(i, img){
			$(img).hide();
			_imgs.push({
				src : $(img).attr("src"),
				w   : $(img).width(),
				h   : $(img).height()
			});
		});
	
		// create container div 
		$("<div id='"+_cfg.containerId+"'></div>")
			.css({
					 	"position" : "absolute",
						"top"      : "0",
						"left"     : "0",
						"z-index"  : "-2",
						"width"    : "100%",
						"height"   : "100%",
						"overflow" : "hidden"
					})
			.appendTo("body");
	
		// start
		_showImg();

	};
}(jQuery));
