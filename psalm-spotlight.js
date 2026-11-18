const psalmTitle = document.querySelector('#psalm-spotlight-title');
const psalmText = document.querySelector('#psalm-spotlight-text');
const previousButton = document.querySelector('#psalm-previous');
const nextButton = document.querySelector('#psalm-next');
const randomButton = document.querySelector('#psalm-random');

if (psalmTitle && psalmText) {
  fetch('psalms.json')
    .then(response => {
      if (!response.ok) throw new Error('Could not load psalms');
      return response.json();
    })
    .then(psalms => {
      if (!Array.isArray(psalms) || psalms.length < 2) throw new Error('Psalm data is unavailable');
      let currentIndex = -1;

      const displayPsalm = index => {
        currentIndex = (index + psalms.length) % psalms.length;
        const psalm = psalms[currentIndex];
        psalmTitle.textContent = 'Psalm ' + psalm.number;
        psalmText.replaceChildren(...psalm.verses.map((verse, verseIndex) => {
          const paragraph = document.createElement('p');
          const number = document.createElement('span');
          number.className = 'psalm-verse-number';
          number.textContent = String(verseIndex + 1);
          paragraph.append(number, document.createTextNode(verse));
          return paragraph;
        }));
      };

      const showRandomPsalm = () => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * psalms.length);
        } while (nextIndex === currentIndex);
        displayPsalm(nextIndex);
      };

      previousButton?.addEventListener('click', () => displayPsalm(currentIndex - 1));
      nextButton?.addEventListener('click', () => displayPsalm(currentIndex + 1));
      randomButton?.addEventListener('click', showRandomPsalm);
      showRandomPsalm();
      window.setInterval(showRandomPsalm, 5 * 60 * 1000);
    })
    .catch(error => {
      console.error('Psalm spotlight:', error);
      psalmText.textContent = 'A psalm will appear here when scripture is available.';
    });
}