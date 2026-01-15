const fs = require("fs");

function getUserByEmail(email) {
  files = fs
    .readdirSync("data")
    .filter((file) => file.endsWith(`${email}.txt`));
  if (files.length == 0) {
    return null;
  }
  return readUser(files[0]);
}

function getUserById(id) {
  files = fs.readdirSync("data").filter((file) => file.startsWith(id));
  if (files.length == 0) {
    return null;
  }
  return readUser(files[0]);
}

function createUser(id, email, passKey) {
  saveUser({ id, email, passKey });
}

function updateUserCounter(id, counter) {
  const user = getUserById(id);
  user.passKey.counter = counter;
  saveUser(user);
}

function saveUser(data) {
  fs.writeFileSync(`data/${data.id}-${data.email}.txt`, JSON.stringify(data));
}

function readUser(filename) {
  data = JSON.parse(fs.readFileSync(`data/${filename}`, "utf8"));
  data.passKey.publicKey = new Uint8Array(
    Object.values(data.passKey.publicKey),
  );
  return data;
}

function getFavorites(identifier) {
  const filePath = `data/favorites-${identifier}.json`;
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveFavorites(identifier, favorites) {
  const filePath = `data/favorites-${identifier}.json`;
  fs.writeFileSync(filePath, JSON.stringify(favorites));
}

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
  updateUserCounter,
  getFavorites,
  saveFavorites,
};
