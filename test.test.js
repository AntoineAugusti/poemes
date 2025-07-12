const fetch = require('node-fetch');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const jQuery = require('jquery')

import iconv from 'iconv-lite';
import encodings from 'iconv-lite/encodings';
iconv.encodings = encodings;

const { exec } = require('node:child_process');

beforeEach(async () => {
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

afterAll(() => {
  exec("pkill php");
});

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

function poemTitles() {
  return [...document.querySelectorAll('.poeme.visible .poeme-title')].map(el => el.textContent);
}