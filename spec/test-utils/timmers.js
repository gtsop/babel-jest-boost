function multilineTrim(string) {
  return string
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length)
    .join("\n");
}

function multilineRemove(mainString, stringToRemove) {
  return mainString.replace(
    new RegExp(stringToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    "",
  );
}

module.exports = {
  multilineTrim,
  multilineRemove,
};
