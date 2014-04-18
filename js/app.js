

// Initialize search
(function() {
	var	url    = 'https://api.twitch.tv/kraken/search/streams?limit=15&callback=',
	    list   = document.getElementById('twitch-list'),
	    input  = document.getElementById('twitch-input'),
	    submit = document.getElementById('twitch-submit'),
	    total  = document.getElementById('streamTotal'),
	    offset = 0, debounce = null, height = 0, prevValue = '',
			twitch = new HTMLArray("stream-node")
	
	input.addEventListener("keyup", search);
	submit.addEventListener("click", search);
	submit.addEventListener("touchend", search);
	window.addEventListener("scroll", scroll);
	search();

	window.response = function(response) {
		if (response.streams) {
			if (offset === 0) {
				total.innerHTML = response._total;
				twitch.set(response.streams);
			} else {
				twitch.concat(response.streams);
			}
		}
	};

	function scroll() {
		if (window.scrollY === document.documentElement.clientHeight - window.innerHeight) {
			if (window.scrollY !== height) {
				height = window.scrollY;
				offset += 15;
				var value = input.value.trim();
				get(url + 'response&q=' + value + '&offset=' + offset);
			}
		}
	}

  function get(url) {
	 	var script = document.createElement('script');
		script.src = url;
		document.getElementsByTagName('head')[0].appendChild(script);
  }

	function search() {
		var value = input.value.trim();
		if (value !== prevValue) {
			prevValue = value;
			clearTimeout(debounce);
			debounce = setTimeout(function() {
				offset = 0;
				get(url + 'response&q=' + value + '&offset=' + offset);
			}, 250);
		}
	}	
}());

window.onresize = (function() {
	var elem = document.getElementById('twitch');
	return function() {
		if (window.innerWidth > 700)
			elem.style.marginLeft = (window.innerWidth - elem.offsetWidth) / 2 + 'px';
	}
}());
window.onresize();
