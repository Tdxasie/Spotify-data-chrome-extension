
// chrome.storage.sync.remove(['refreshToken', 'accessToken'], () => {
//   console.log('cleared memory');
// });

const clientId = '67505c53122340ee89850bd5a20f49a7';
const clientSecret = '2e87275818e14517bc7e91a91e7ffa3e';

autoRefresh();

chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
  if (request.msg === "spotify_token_please") {
    chrome.storage.sync.get(['refreshToken'], async (res) => {
      if (!('refreshToken' in res)) {
        console.log('auth')
        await getAuth();
      } else {
        chrome.storage.sync.get(['accessToken'], memCell => {
          console.log('sent token')
          console.log(memCell.accessToken)
          chrome.runtime.sendMessage({
            msg: "your_spotify_token_thx",
            token: memCell.accessToken
          });
        });
      }
    });
  }
});

async function autoRefresh() {
  chrome.storage.sync.get(['refreshToken'], async (res) => {
    if ('refreshToken' in res) {
      await refreshToken();
      setInterval( async () => {await refreshToken()}, 3400*1000);
    }
  });
}

async function refreshToken() {
  chrome.storage.sync.get(['refreshToken'], async (val) => {
    let url = 'https://accounts.spotify.com/api/token';
    let authURL = url + '?grant_type=refresh_token' + '&refresh_token=' + val.refreshToken;
    let res = await fetch(authURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
      }
    });
    let msg = await res.json();
    chrome.storage.sync.set({
      accessToken: msg.access_token
    });

    console.log('refreshed');
  });
}

async function getTokens(code) {
  let url = 'https://accounts.spotify.com/api/token';
  let redirectURI = chrome.identity.getRedirectURL() + "spotify";
  let authURL = url + '?grant_type=authorization_code' + '&code=' + code + '&redirect_uri=' + encodeURI(redirectURI);
  let res = await fetch(authURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
    }
  });
  let msg = await res.json();
  chrome.storage.sync.set({
    refreshToken: msg.refresh_token
  });
}

async function getAuth() {
  let url = 'https://accounts.spotify.com/authorize';
  let redirectURI = chrome.identity.getRedirectURL() + "spotify";
  let authURL = url + '?client_id=' + clientId + '&redirect_uri=' + encodeURI(redirectURI) + "&scope=user-read-currently-playing" + "&response_type=code";
  console.log(authURL);
  let details = {
    url: authURL,
    interactive: true
  };
  chrome.identity.launchWebAuthFlow(details, async url => {
    let code = parseURL(url);
    console.log(code);
    await getTokens(code);
  });

}

function parseURL(url) {
  if(url == undefined) return undefined;
  let code = url.split('=')[1].split('&')[0];
  return code;
}
