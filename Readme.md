# Slideshowify 

jQuery.slideshowify.js is a jQuery plugin for generating a slideshow with a [Ken Burns Effect](http://en.wikipedia.org/wiki/Ken_Burns_effect) from 
images that match a selector.  Images that don't fit the window proportions exactly (generally the case) are cropped and panned across the screen. 
This also resembles that Mac screensaver.

[Check out the DEMO](http://www.subchild.com/slideshowify)

As of version 0.9, jQuery.slideshowify supports hardware-accelerated CSS3 transforms, which include panning in all directions as well as zooming 
in and out (when the image aspect ratio matches that of the window). CSS3 support is provided by the excellent [jQuery.transit](http://ricostacruz.com/jquery.transit/) 
plugin from Rico Sta. Cruz.


@TODO fix the resizing business (force full screen and prevent resizing || add resize handler to adjust numbers)

To use, do something like this:

	$("img").slideshowify();

or:
	
	$.slideshowify({
		dataUrl     : "http://www.gallerama.com/services/gallery/get.php?gid=2107&versions[]=9",
		dataType    : "jsonp",
		randomize   : true,
		aniSpeedMin : 6000,
		aniSpeedMax : 10000,
		filterFn    : function(imgs){ // filter data
			var fixedImgs = [];
			$.each(imgs, function(i, img){
				fixedImgs.push($.extend(img.versions["9"], {id:img.id}));
			});
			return fixedImgs;
		},
		afterFadeIn : function(curImage){
			// do something
		},
		beforeFadeOut : function(curImage){
			// do something else
		}
	});
