'use strict';

/*
	Object to handle Twitch API consumption
*/
var Twitch = {
	requestCount: 0,
	pageCount: 0,
	data_set: null,
	data_set_next: null,
	data_set_prev: null,
	data_offset: 0,
	debounce: null
};

// Display next page of data
Twitch.nextPage = function() {
	this.data_offset++;
	this.data_set_prev = this.data_set;
	this.data_set = this.data_set_next;

	this.updateList();
	this.queue.next();
}

// Display previous page of data
Twitch.prevPage = function() {
	this.data_offset--;
	this.data_set_next = this.data_set;
	this.data_set = this.data_set_prev;

	this.updateList();
	this.queue.prev();
}

/*
	For efficiency, queue up prev/next page of data
*/
Twitch.queue = (function() {
	var next_url   = 'https://api.twitch.tv/kraken/search/streams?limit=5&callback=queueNext&q=',
			prev_url   = 'https://api.twitch.tv/kraken/search/streams?limit=5&callback=queuePrev&q=',
 			searchBar  = document.getElementById('twitch-input');

	return {
		next: function() {
			var val = searchBar.value,
					offset = Twitch.data_offset * 5 + 5,
					request_url = next_url + val + '&offset=' + offset;
			Twitch.get(request_url);
		},
		prev: function() {
			var val = searchBar.value,
					offset = Twitch.data_offset * 5 - 5,
					request_url = prev_url + val + '&offset=' + offset;
			Twitch.get(request_url);
		}
	}
}());

/*
	Method for updating current list of displayed streams
		- Should update pagination arrows
		- Should build info and display all at once
*/
Twitch.updateList = (function() {

	var list  = document.getElementById('twitch-list'),
			pageIndex = document.getElementById('page-index'),
			pagePrev  = document.getElementById('page-prev'),
			pageNext  = document.getElementById('page-next'),
			streamTotal = document.getElementById('streamTotal');

	// Helper function to update pagination arrows
  function updatePageAvailability() {
  	var page = Twitch.pageCount > 0 ? Twitch.data_offset + 1 : 0;
  	pageIndex.innerHTML = '&nbsp ? &nbsp'.replace('?', page + '/' + Twitch.pageCount);
		if (Twitch.data_offset >= Twitch.pageCount - 1) {
			pageNext.className = 'disabled';
			pageNext.onclick   = null;
			pageNext.touchend  = null;
		} else {
			pageNext.className = '';
			pageNext.onclick   = function() {Twitch.nextPage()};
			pageNext.touchend  = function() {Twitch.nextPage()};
		}

		if (Twitch.data_offset === 0) {
			pagePrev.className = 'disabled';
			pagePrev.onclick   = null;
			pagePrev.touchend  = null;
		} else {
			pagePrev.className = '';
			pagePrev.onclick   = function() {Twitch.prevPage()};
			pagePrev.touchend  = function() {Twitch.prevPage()};
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
		this.pageCount = Math.ceil(this.data_set._total / 5);
		streamTotal.innerHTML = this.data_set._total;

		var html = '';
		this.data_set.streams.forEach(function(stream) {
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
*/
Twitch.search = (function() {
	var url   = 'https://api.twitch.tv/kraken/search/streams?limit=5&callback=search&q=',
			list  = document.getElementById('twitch-list'),
			searchBar  = document.getElementById('twitch-input'),
			prevVal = '';

	return function() {
		clearTimeout(this.debounce);
		var val = searchBar.value;

		// Submitted from keydown (not pagination)
		this.data_offset = 0;

		// Twitch only responds with data for searches of length > 2
		if (val.length > 2) {
			var request_url = url + val + '&offset=' + Twitch.data_offset * 5;

			this.debounce = setTimeout(function() {
				Twitch.get(request_url);
			}, 200);

		}
	};
}());

// Base cross domain request
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
window.search = function(response) {
	Twitch.requestCount--;
	// Only change view if another request has not been sent
	if (response.streams && Twitch.requestCount === 0) {
		Twitch.data_set = response;
		Twitch.updateList();
		Twitch.queue.next();
	}
};

window.queueNext = function(response) {
	if (response && response.streams)
		Twitch.data_set_next = response;
};

window.queuePrev = function(response) {
	if (response && response.streams)
		Twitch.data_set_prev = response;
};

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
