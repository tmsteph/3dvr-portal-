// navbar.js
const gun = Gun(['https://gun-manhattan.herokuapp.com/gun']);
const user = gun.user();

function createNavbar() {
  const nav = document.createElement('div');
  nav.style.position = 'fixed';
  nav.style.top = '10px';
  nav.style.right = '10px';
  nav.style.background = 'rgba(255, 215, 0, 0.1)';
  nav.style.border = '1px solid gold';
  nav.style.borderRadius = '8px';
  nav.style.padding = '10px 15px';
  nav.style.zIndex = '9999';
  nav.style.display = 'flex';
  nav.style.alignItems = 'center';
  nav.style.gap = '10px';
  nav.style.fontSize = '1rem';

  const usernameSpan = document.createElement('span');
  const scoreSpan = document.createElement('span');
  const button = document.createElement('button');

  button.style.background = 'gold';
  button.style.color = '#003366';
  button.style.border = 'none';
  button.style.borderRadius = '6px';
  button.style.padding = '5px 10px';
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';
  button.style.transition = '0.3s ease';
  button.innerText = 'Sign Out';

  button.addEventListener('click', () => {
    user.leave();
    localStorage.removeItem('signedIn');
    localStorage.removeItem('guest');
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    window.location.href = 'index.html'; // Redirect back to portal
  });

  nav.appendChild(usernameSpan);
  nav.appendChild(scoreSpan);
  nav.appendChild(button);
  document.body.appendChild(nav);

  const signedIn = localStorage.getItem('signedIn');
  const guest = localStorage.getItem('guest');

  if (signedIn) {
    user.get('alias').on(alias => {
      usernameSpan.innerText = `👤 ${alias || 'Loading...'}`;
    });
    user.get('score').on(score => {
      scoreSpan.innerText = `⭐ ${score || 0}`;
    });
  } else if (guest) {
    const guestId = localStorage.getItem('guestId') || (() => {
      const id = 'guest_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guestId', id);
      return id;
    })();
    const guestProfile = gun.get('3dvr-guests').get(guestId);

    guestProfile.get('username').on(name => {
      usernameSpan.innerText = `👤 ${name || 'Guest'}`;
    });
    guestProfile.get('score').on(score => {
      scoreSpan.innerText = `⭐ ${score || 0}`;
    });
  } else {
    usernameSpan.innerText = '👤 Guest';
    scoreSpan.innerText = '⭐ 0';
  }
}

window.addEventListener('load', createNavbar);
