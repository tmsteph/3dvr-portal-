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
  nav.style.zIndex = '1000';
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
    window.location.href = 'index.html'; // Redirect back to portal
  });

  nav.appendChild(usernameSpan);
  nav.appendChild(scoreSpan);
  nav.appendChild(button);
  document.body.appendChild(nav);

  function updateUI(name, score) {
    usernameSpan.innerText = `👤 ${name}`;
    scoreSpan.innerText = `⭐ ${score || 0}`;
  }

  if (localStorage.getItem('signedIn')) {
    // Logged-in user
    user.get('alias').on(alias => {
      if (alias) usernameSpan.innerText = `👤 ${alias}`;
    });
    user.get('score').on(score => {
      scoreSpan.innerText = `⭐ ${score || 0}`;
    });
  } else if (localStorage.getItem('guest')) {
    // Guest user
    const guestId = localStorage.getItem('guestId') || (() => {
      const id = 'guest_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guestId', id);
      return id;
    })();
    const guestProfile = gun.get('3dvr-guests').get(guestId);

    guestProfile.get('username').on(name => {
      updateUI(name || 'Guest', 0);
    });
    guestProfile.get('score').on(score => {
      updateUI('Guest', score);
    });
  } else {
    updateUI('Guest', 0);
  }
}

window.addEventListener('load', createNavbar);
