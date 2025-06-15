if (location.search !== "?privex") {
  location.search = "?privex";
  throw new Error;
}
