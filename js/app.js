'use strict';

/*
	Object to handle Twitch API consumption
*/
var Twitch = {
	requestCount: 0,
	pageCount: 0,
	data_set: [],
	data_offset: 0,
	debounce: null
};

Twitch.nextPage = function() {
	this.data_offset++;
	this.search();
}

Twitch.prevPage = function() {
	this.data_offset--;
	this.search();
}

/*
	Method for updating current list of displayed streams
		- Should update pagination arrows
		- Should build info and display all at once
*/
Twitch.updateList = (function() {

	var list  = document.getElementById('twitch-list'),
			pageIndex = document.getElementById('page-index'),
			pagePrev  = document.getElementById('page-prev'),
			pageNext  = document.getElementById('page-next');

	// Helper function to update pagination arrows
  function updatePageAvailability() {
  	var page = Twitch.pageCount > 0 ? Twitch.data_offset + 1 : 0;
  	pageIndex.innerHTML = '&nbsp ? &nbsp'.replace('?', page + '/' + Twitch.pageCount);
		if (Twitch.data_offset >= Twitch.pageCount - 1) {
			pageNext.className = 'disabled';
			pageNext.onclick   = null;
		} else {
			pageNext.className = '';
			pageNext.onclick   = function() {Twitch.nextPage()};
		}

		if (Twitch.data_offset === 0) {
			pagePrev.className = 'disabled';
			pagePrev.onclick   = null;
		} else {
			pagePrev.className = '';
			pagePrev.onclick   = function() {Twitch.prevPage()};
		}
	}

	function createStreamString(stream) {
		var html = "<div class='twitch-stream'>";
		   html += "  <a href='#'><img class='stream-image' src='?'></img></a>".replace('?', stream.preview.medium).replace('#', stream.channel.url);
		   html += "  <div class='stream-info'>";
		   html += "    <a class='stream-name' href='#'> ?</a>".replace('?', stream.channel.display_name).replace('#', stream.channel.url);
		   html += "    <div class='stream-game'> ?</div>".replace('?', stream.game + ' - ' + stream.viewers + ' viewers');
		   html += "    <div class='stream-desc'> ?</div>".replace('?', stream.channel.status);
		   html += "</div></div>";
		return html;
	}

	return function() {
		var html = '';
		Twitch.data_set.forEach(function(stream) {
			html += createStreamString(stream);
		});
		updatePageAvailability();
		list.innerHTML = html;
		list.style.display = 'block';
	};

}());

/*
	Method for searching for twitch streams matching input query.
	 - Should be debounced for efficiency
	 - Should limit results to 5
	 - Should return results based of offset
*/
Twitch.search = (function() {
	var url   = 'https://api.twitch.tv/kraken/search/streams?limit=5&callback=twitchCallback&q=',
			list  = document.getElementById('twitch-list'),
			searchBar  = document.getElementById('twitch-input');

	return function(e) {
		clearTimeout(this.debounce);

		// Submitted from keydown (not pagination)
		if (e) {
			// Ignore unnecessary keystrokes
			if ((e.keyCode < 48 || (e.keyCode > 90 && e.keyCode < 187)) &&
				  [8, 13, 46, 188, 189,187].indexOf(e.keyCode) === -1) 
				return;
			this.data_offset = 0;
		}

		var val = searchBar.value;

		// Twitch only responds with data for searches of length > 2
		if (val.length > 2) {
			var request_url = url + val + '&offset=' + Twitch.data_offset * 5;

			// Pagination requires no debounce
			if (!e) {
				Twitch.get(request_url);
			} else {
				// Only send request after idle typing
				this.debounce = setTimeout(function() {
					Twitch.get(request_url);
				}, 300);
			}
		}
	};
}());

Twitch.get = function(url) {
	var script = document.createElement('script');
	script.src = url;
	document.getElementsByTagName('head')[0].appendChild(script);
	this.requestCount++;
}

/* Method for handle Twitch API response
		- Should check for correct data
		- Should only update view if no other requests are out
*/
window.twitchCallback = (function() {
	var streamTotal = document.getElementById('streamTotal');
	return function(response) {
		Twitch.requestCount--;

		// Only change view if another request has not been sent
		if (response.streams && Twitch.requestCount === 0) {
			Twitch.pageCount = Math.ceil(response._total / 5);
			Twitch.data_set = response.streams;
			Twitch.updateList();
			streamTotal.innerHTML = response._total;
		}
	};
}());

// Initialize search
(function() {
  var val = document.getElementById('twitch-input');
  if (val) Twitch.search();
}());

window.onresize = (function() {
	var elem = document.getElementById('twitch');
  return function() {
  	elem.style.marginLeft = (window.innerWidth - elem.offsetWidth) / 2 + 'px';
  }
}());
window.onresize();
