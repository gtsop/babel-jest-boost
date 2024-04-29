function matchAnyRegex(regexArray, haystack) {
  for (let i = 0; i < regexArray.length; i++) {
    const regexString = regexArray[i];
    const regex = new RegExp(regexString);
    if (regex.test(haystack)) {
      return true;
    }
  }
  return false;
}

module.exports = {
  matchAnyRegex,
}
