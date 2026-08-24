const fs = require("fs");
const path = require("path");

const extensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".html"
]);

function getFiles(dir) {
  const result = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      result.push(...getFiles(fullPath));
    } else if (extensions.has(path.extname(item.name).toLowerCase())) {
      result.push(fullPath);
    }
  }

  return result;
}

function score(text) {
  const bad = ["Ã", "Â", "ð", "â", "ï¿½"];

  return bad.reduce(
    (total, value) => total + text.split(value).length - 1,
    0
  );
}

const files = getFiles(path.join(process.cwd(), "src"));

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  let current = original;

  for (let i = 0; i < 3; i++) {
    const converted = Buffer.from(current, "latin1").toString("utf8");

    if (score(converted) < score(current)) {
      current = converted;
    } else {
      break;
    }
  }

  if (current !== original) {
    fs.writeFileSync(file, current, "utf8");
    console.log("CORREGIDO:", file);
  }
}
