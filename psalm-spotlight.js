const spotlight = document.querySelector('#psalm-spotlight');
const titleNode = document.querySelector('#psalm-spotlight-title');
const textNode = document.querySelector('#psalm-spotlight-text');
const showToggle = document.querySelector('#show-random-toggle');
const hideButton = document.querySelector('#hide-random-button');
const bookSelect = document.querySelector('#random-book-select');
const previousButton = document.querySelector('#psalm-previous');
const nextButton = document.querySelector('#psalm-next');
const randomButton = document.querySelector('#psalm-random');
let bookOrder = [];
let chaptersByBook = {};
let selectedBook = '';
let mainSelectedBook = '';
let selectedChapters = [];
let currentIndex = -1;
let seenChapters = new Set();

function showBookPrompt() {
  titleNode.textContent = 'Random Scripture';
  textNode.textContent = 'Choose a book to see a random chapter.';
}

function setVisible(visible) {
  spotlight.hidden = !visible;
  showToggle.setAttribute('aria-pressed', String(visible));
  showToggle.setAttribute('aria-label', visible ? 'Hide random scripture' : 'Show random scripture');
  if (!visible) return;
  const preferredBook = mainSelectedBook || bookSelect.value;
  if (preferredBook && chaptersByBook[preferredBook]) {
    if (selectedBook !== preferredBook) seenChapters = new Set();
    selectedBook = preferredBook;
    selectedChapters = chaptersByBook[preferredBook];
    bookSelect.value = preferredBook;
    if (currentIndex >= selectedChapters.length) currentIndex = -1;
  }
  if (!selectedBook) {
    showBookPrompt();
    bookSelect.focus();
    return;
  }
  showRandomPassage();
}

function renderVerses(verses) {
  textNode.replaceChildren(...verses.map((verse, index) => {
    const paragraph = document.createElement('p');
    const number = document.createElement('span');
    number.className = 'psalm-verse-number';
    number.textContent = String(index + 1);
    paragraph.append(number, document.createTextNode(verse));
    return paragraph;
  }));
}

function showBookChapter(index) {
  if (!selectedChapters.length) return;
  currentIndex = (index + selectedChapters.length) % selectedChapters.length;
  seenChapters.add(currentIndex);
  const chapter = selectedChapters[currentIndex];
  const chapterNumber = Number(chapter.number) || currentIndex + 1;
  titleNode.textContent = selectedBook + ' ' + chapterNumber;
  renderVerses(chapter.verses || []);
}

function randomIndex(length) {
  if (length < 2) return 0;
  let available = Array.from({length}, (_, index) => index).filter(index => !seenChapters.has(index));
  if (!available.length) {
    seenChapters = new Set(currentIndex >= 0 ? [currentIndex] : []);
    available = Array.from({length}, (_, index) => index).filter(index => !seenChapters.has(index));
  }
  return available[Math.floor(Math.random() * available.length)];
}

function showRandomPassage() {
  if (!selectedBook || !selectedChapters.length) {
    showBookPrompt();
    return;
  }
  showBookChapter(randomIndex(selectedChapters.length));
}

function stepPassage(direction) {
  if (selectedBook && selectedChapters.length) showBookChapter(currentIndex + direction);
}

function fillBookOptions() {
  const currentValue = bookSelect.value;
  bookSelect.replaceChildren();
  const prompt = document.createElement('option');
  prompt.value = '';
  prompt.textContent = 'Choose a book…';
  bookSelect.append(prompt);
  bookOrder.forEach(book => {
    const option = document.createElement('option');
    option.value = book;
    option.textContent = book;
    bookSelect.append(option);
  });
  if (bookOrder.includes(currentValue)) bookSelect.value = currentValue;
  bookSelect.disabled = bookOrder.length === 0;
}

showToggle.addEventListener('click', () => setVisible(spotlight.hidden));
hideButton.addEventListener('click', () => setVisible(false));
bookSelect.addEventListener('change', () => {
  selectedBook = bookSelect.value;
  selectedChapters = chaptersByBook[selectedBook] || [];
  currentIndex = -1;
  seenChapters = new Set();
  if (selectedBook) showRandomPassage();
  else showBookPrompt();
});
previousButton.addEventListener('click', () => stepPassage(-1));
nextButton.addEventListener('click', () => stepPassage(1));
randomButton.addEventListener('click', showRandomPassage);

window.addEventListener('stillwaters:reading-changed', event => {
  const detail = event.detail || {};
  if (Array.isArray(detail.bookOrder) && detail.chaptersByBook) {
    bookOrder = detail.bookOrder;
    chaptersByBook = detail.chaptersByBook;
    const previousBook = bookSelect.value;
    fillBookOptions();
    if (previousBook && chaptersByBook[previousBook]) {
      selectedBook = previousBook;
      selectedChapters = chaptersByBook[previousBook];
    }
    const nextMainBook = detail.book || '';
    const mainBookChanged = nextMainBook !== mainSelectedBook;
    mainSelectedBook = nextMainBook;
    if (mainBookChanged && mainSelectedBook && chaptersByBook[mainSelectedBook]) {
      selectedBook = mainSelectedBook;
      selectedChapters = chaptersByBook[mainSelectedBook];
      bookSelect.value = mainSelectedBook;
      currentIndex = -1;
      seenChapters = new Set();
      if (!spotlight.hidden) showRandomPassage();
    }
  }
});

window.setInterval(() => {
  if (!spotlight.hidden && selectedBook && selectedChapters.length) showRandomPassage();
}, 5 * 60 * 1000);