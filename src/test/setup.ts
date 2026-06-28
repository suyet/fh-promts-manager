import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

Range.prototype.getBoundingClientRect = function () {
  return new DOMRect(0, 0, 0, 0);
};

Range.prototype.getClientRects = function () {
  return {
    item: () => null,
    length: 0,
    [Symbol.iterator]: function* () {}
  } as unknown as DOMRectList;
};
