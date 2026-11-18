const categorySelect = document.querySelector('#sidebar-category-select');
const categoryStatus = document.querySelector('#sidebar-category-status');
const categoryResults = document.querySelector('#sidebar-category-results');
let booksInOrder = [];
let chaptersByBook = {};
let categoriesByBook = {};
let categoryLookup = new Map();

function categoryKey(value) {
  return String(value || '').trim().toLocaleLowerCase();
}

function populateCategories() {
  categoryLookup = new Map();
  for (const book of booksInOrder) {
    for (const category of categoriesByBook[book] || []) {
      const label = String(category.label || category.title || '').trim();
      const key = categoryKey(label);
      if (!key) continue;
      if (!categoryLookup.has(key)) categoryLookup.set(key, {label, books: new Map()});
      const record = categoryLookup.get(key);
      if (!record.books.has(book)) record.books.set(book, []);
      record.books.get(book).push(category);
    }
  }

  const previousValue = categorySelect.value;
  categorySelect.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Choose a category…';
  categorySelect.append(placeholder);
  [...categoryLookup.entries()]
    .sort((a, b) => a[1].label.localeCompare(b[1].label))
    .forEach(([key, record]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = record.label;
      categorySelect.append(option);
    });
  categorySelect.disabled = categoryLookup.size === 0;
  if (categoryLookup.has(previousValue)) categorySelect.value = previousValue;
}

function makeVerseList(verses) {
  const list = document.createElement('ol');
  list.className = 'sidebar-category-verses';
  verses.forEach((verse, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'sidebar-category-verse-number';
    number.textContent = String(index + 1);
    const text = document.createElement('span');
    text.textContent = verse;
    item.append(number, text);
    list.append(item);
  });
  return list;
}

function renderCategory(key) {
  categoryResults.replaceChildren();
  const record = categoryLookup.get(key);
  if (!record) {
    categoryStatus.textContent = key ? 'No related scripture found.' : 'Choose a category to browse related scripture.';
    return;
  }

  let chapterCount = 0;
  const books = [];
  for (const book of booksInOrder) {
    const categories = record.books.get(book);
    if (!categories) continue;
    const numbers = [...new Set(categories.flatMap(category => Array.isArray(category.chapters) ? category.chapters : []))]
      .map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    const chapters = chaptersByBook[book] || [];
    const matches = numbers.map(number => chapters.find(chapter => Number(chapter.number) === number)).filter(Boolean);
    if (matches.length) books.push({book, matches, categories});
    chapterCount += matches.length;
  }
  categoryStatus.textContent = books.length + ' books · ' + chapterCount + ' chapters · expand a chapter to read its verses.';

  books.forEach(({book, matches, categories}) => {
    const bookDetails = document.createElement('details');
    bookDetails.className = 'sidebar-category-book';
    bookDetails.open = true;
    const bookSummary = document.createElement('summary');
    bookSummary.textContent = book + ' · ' + matches.length + (matches.length === 1 ? ' chapter' : ' chapters');
    bookDetails.append(bookSummary);

    matches.forEach(chapter => {
      const chapterDetails = document.createElement('details');
      chapterDetails.className = 'sidebar-category-chapter';
      const chapterSummary = document.createElement('summary');
      const number = Number(chapter.number);
      const matchingCategory = categories.find(item => (item.chapters || []).map(Number).includes(number));
      const description = matchingCategory?.title && matchingCategory.title !== record.label ? ' · ' + matchingCategory.title : '';
      chapterSummary.textContent = book + ' ' + number + description;
      chapterDetails.append(chapterSummary);
      chapterDetails.addEventListener('toggle', () => {
        if (chapterDetails.open && !chapterDetails.dataset.loaded) {
          chapterDetails.append(makeVerseList(chapter.verses || []));
          chapterDetails.dataset.loaded = 'true';
        }
      });
      bookDetails.append(chapterDetails);
    });
    categoryResults.append(bookDetails);
  });
}

categorySelect.addEventListener('change', () => renderCategory(categorySelect.value));

window.addEventListener('stillwaters:reading-changed', event => {
  const detail = event.detail || {};
  if (!Array.isArray(detail.bookOrder) || !detail.categoriesByBook || !detail.chaptersByBook) return;
  booksInOrder = detail.bookOrder;
  categoriesByBook = detail.categoriesByBook;
  chaptersByBook = detail.chaptersByBook;
  const selectedCategory = categorySelect.value;
  populateCategories();
  if (selectedCategory) renderCategory(selectedCategory);
});