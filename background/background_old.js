
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "spotify_token_please") {
    getAuth();
  }
});

function getAuth(){
  let clientId = '67505c53122340ee89850bd5a20f49a7';
  let url = 'https://accounts.spotify.com/authorize'
  let redirectURI = chrome.identity.getRedirectURL() + "spotify";
  let authURL = url + '?client_id=' + clientId + '&redirect_uri=' + encodeURI(redirectURI) + "&scope=user-read-currently-playing" + "&response_type=token";
  let details = {
    url: authURL,
    interactive: true
  };
  chrome.identity.launchWebAuthFlow(details, url => {
    console.log(url);
    chrome.runtime.sendMessage({
      msg: "your_spotify_token_thx",
      token: parseURL(url)
    });
  });
}

function parseURL(url){
  let token = url.split('=')[1].split('&')[0];
  return token;
}
