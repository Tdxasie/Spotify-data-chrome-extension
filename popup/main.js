window.addEventListener('load', () => {
  chrome.runtime.sendMessage({msg: "spotify_token_please"});
});

chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => {
  if (request.msg === "your_spotify_token_thx"){
    let token = request.token;
    let currentPlayback = await getPlayBack(token);
    let info = await trackInfo(currentPlayback);
    info = await getGenre(token, info);
    console.log(info);
    document.getElementById('cover').src = info.images[1].url;
    document.getElementById('trck').innerHTML = info.track.name;
    animateTrackname(info.track.name);
    document.getElementById('artst').innerHTML = info.artist.name;
    document.getElementById('gnr').innerHTML = info.genres.join(', ');
  }
});

async function getPlayBack(token) {
  console.log(token);
  let url = "https://api.spotify.com/v1/me/player/currently-playing";
  let res = await fetch(url, {headers: {'Authorization' : 'Bearer ' + token}});
  let currentPlayback = await res.json();
  return currentPlayback;
}

async function getGenre(token, info) {
  let url = 'https://api.spotify.com/v1/artists/' + info.artist.id;
  let res = await fetch(url, {headers: {'Authorization' : 'Bearer ' + token}});
  let artistInfo = await res.json();
  info.genres = artistInfo.genres;
  return info;
}

async function trackInfo(currentPlayback){
  console.log(currentPlayback.item.artists);
  let track = currentPlayback.item.name;
  let artist = currentPlayback.item.artists[0].name;
  let samples = await getSamples(artist, track);
  let info = {
    track: {
      name: track,
      id: currentPlayback.item.id
    },
    artist: {
      name: artist,
      id: currentPlayback.item.artists[0].id
    },
    release_date: currentPlayback.item.album.release_date,
    google_link: 'https://www.google.com/search?q=' + track.replace(/\s/g, '+') + '+' + artist.replace(/\s/g, '+'),
    images: currentPlayback.item.album.images,
    samples: samples
  };
  return info;
}

async function getSamples(artist, track) {
  let corsEscape = "https://paye-ton-corse.herokuapp.com/";
  let requestUrl = "https://www.whosampled.com/" + artist.replace(/\s/g, '-') + "/" + track.replace(/\s/g, '-') + "/";
  let url = corsEscape + requestUrl;
  try {
    let res = await fetch(url);
    let html = await res.text();
    let samples = parseHTML(html);
    if (samples.length > 0) {
      return { more: requestUrl, samples: samples};
    } else {
      return { more: "https://www.whosampled.com/" + artist.replace(/\s/g, '-') + "/", samples: samples};
    }
  }
  catch(err){
    console.log('404 : No artist page on whosampled');
    return { more: undefined, samples: []};
  }
}

function parseHTML(html){
  let samples = [];
  let parser = new DOMParser();
  let htmlDoc = parser.parseFromString(html, 'text/html');
  let trackStats = htmlDoc.getElementsByClassName('section-header-title');
  if (trackStats[0].innerHTML.includes("Contains samples")){
    let a = htmlDoc.getElementsByClassName('list bordered-list')[0];
    for (let sampleHtml of a.getElementsByClassName('listEntry sampleEntry')) {
      let artist = sampleHtml.getElementsByClassName('trackArtist')[0].firstElementChild.innerHTML;
      let track = sampleHtml.getElementsByClassName('trackName playIcon')[0].innerHTML;
      samples.push({
        track: track,
        artist: artist
      });
    }
    return samples;
  } else {
    return [];
  }
}

function animateTrackname(trackname){
  if (trackname.length > 24){
    document.body.style.setProperty("--playTrackName", "running");
    document.body.style.setProperty("--trackPadding", "100%");
    console.log('overflowed');
  }
}




























//love
