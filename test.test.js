const fetch = require('node-fetch');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const jQuery = require('jquery')

import iconv from 'iconv-lite';
import encodings from 'iconv-lite/encodings';
iconv.encodings = encodings;

const { exec } = require('node:child_process');

beforeAll(async () => {
  const response = await fetch('http://localhost:8080');
  expect(response.ok).toBe(true);
  const html = await response.text();
  dom = new JSDOM(html, {url: 'http://localhost:8080', runScripts: "dangerously", resources: "usable"});
  await new Promise(resolve => {
      dom.window.addEventListener('load', () => {
          resolve();
      });
  });
  document = dom.window.document;
  $ = jQuery(dom.window);
});

afterEach(() => search(""))

afterAll(() => exec("pkill php"));

test('page title', async () => {
  expect($('title').text()).toBe('Poésie');
});

test('poem titles', async () => {
  expect(poemTitles()).toEqual(["Bar", "Foo"]);
})

test('up-down', async () => {
  expect([...document.querySelector('.poemes-container').classList]).toEqual(["poemes-container"]);

  $('.up-down').click();

  expect([...document.querySelector('.poemes-container').classList]).toEqual(["poemes-container", "reverse"]);
})

test('search', async () => {
  search("bar");
  expect(poemTitles()).toEqual(["Bar"]);
  expect(document.querySelector("#nb-results").textContent).toEqual("1 poème");

  search("foo");
  expect(poemTitles()).toEqual(["Bar", "Foo"]);
  expect(document.querySelector("#nb-results").textContent).toEqual("2 poèmes");

  search("Hello");
  expect(poemTitles()).toEqual(["Bar", "Foo"]);
  expect(document.querySelector("#nb-results").textContent).toEqual("2 poèmes");

  search("1");
  expect(poemTitles()).toEqual(["Foo"]);
  expect(document.querySelector("#nb-results").textContent).toEqual("1 poème");

  search("baz");
  expect(poemTitles()).toEqual([]);
  expect(document.querySelector("#nb-results").textContent).toEqual("0 poèmes");

  search("2025-07");
  expect(poemTitles()).toEqual(["Bar"]);

  search("2025-06");
  expect(poemTitles()).toEqual(["Foo"]);

  search("1-");
  expect(poemTitles()).toEqual(["Bar", "Foo"]);

  search("2-2");
  expect(poemTitles()).toEqual(["Bar"]);

  search("2025-06-01-");
  expect(poemTitles()).toEqual(["Bar", "Foo"]);

  search("2025-07-01-2025-08-01");
  expect(poemTitles()).toEqual(["Bar"]);
})

test('filter by poem title', async () => {
  expect(document.querySelector(".poeme-titles .poeme-title.visible")).toBeNull();

  search("Hello");
  expect(filterByTitleTitles()).toEqual(["Bar", "Foo"]);
  expect(filterByTitleActiveTitles()).toEqual([]);

  $(`.poeme-titles .poeme-title.visible[data-id="2"]`).click();

  expect(filterByTitleTitles()).toEqual(["Bar", "Foo"]);
  expect(filterByTitleActiveTitles()).toEqual(["Bar"]);
  expect(poemTitles()).toEqual(["Bar"]);
  expect(document.querySelector('#reset-poeme-titles.visible')).not.toBeNull();

  $('#reset-poeme-titles.visible').click();

  expect(filterByTitleTitles()).toEqual(["Bar", "Foo"]);
  expect(filterByTitleActiveTitles()).toEqual([]);
  expect(poemTitles()).toEqual(["Bar", "Foo"]);
  expect(document.querySelector('#reset-poeme-titles.visible')).toBeNull();

  $(`.poeme-titles .poeme-title.visible[data-id="1"]`).click();
  $(`.poeme-titles .poeme-title.visible[data-id="2"]`).click();

  expect(filterByTitleTitles()).toEqual(["Bar", "Foo"]);
  expect(filterByTitleActiveTitles()).toEqual(["Bar", "Foo"]);
  expect(poemTitles()).toEqual(["Bar", "Foo"]);
  expect(document.querySelector('#reset-poeme-titles.visible')).not.toBeNull();
})

test('mark words', async () => {
  search("world");
  expect(poemTitles()).toEqual(["Bar"]);
  expect(document.querySelector('.poeme.visible .poeme-text').innerHTML).toContain(`Hello <mark data-markjs="true">world</mark>.`);

  search("");
  expect(poemTitles()).toEqual(["Bar", "Foo"]);
  expect(document.querySelector('.poeme.visible .poeme-text').innerHTML).toContain(`Hello world.`);
})

function search(value) {
  const search = document.getElementById("search");
  search.value = value;
  const inputEvent = new dom.window.Event("input", {
    bubbles: true,
    cancelable: true
  });
  search.dispatchEvent(inputEvent);
  dom.window.dispatchEvent(new dom.window.Event("hashchange"));
}

function filterByTitleTitles() {
  return [...document.querySelectorAll(".poeme-titles .poeme-title.visible")].map(el => el.textContent);
}

function filterByTitleActiveTitles() {
  return [...document.querySelectorAll(".poeme-titles .poeme-title.active")].map(el => el.textContent);
}

function poemTitles() {
  return [...document.querySelectorAll('.poeme.visible .poeme-title')].map(el => el.textContent);
}