/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./es6/arrayReader.js":
/*!****************************!*\
  !*** ./es6/arrayReader.js ***!
  \****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var DataReader = __webpack_require__(/*! ./dataReader.js */ "./es6/dataReader.js");
function ArrayReader(data) {
  if (data) {
    this.data = data;
    this.length = this.data.length;
    this.index = 0;
    this.zero = 0;
    for (var i = 0; i < this.data.length; i++) {
      data[i] &= data[i];
    }
  }
}
ArrayReader.prototype = new DataReader();
/**
 * @see DataReader.byteAt
 */
ArrayReader.prototype.byteAt = function (i) {
  return this.data[this.zero + i];
};
/**
 * @see DataReader.lastIndexOfSignature
 */
ArrayReader.prototype.lastIndexOfSignature = function (sig) {
  var sig0 = sig.charCodeAt(0),
    sig1 = sig.charCodeAt(1),
    sig2 = sig.charCodeAt(2),
    sig3 = sig.charCodeAt(3);
  for (var i = this.length - 4; i >= 0; --i) {
    if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
      return i - this.zero;
    }
  }
  return -1;
};
/**
 * @see DataReader.readData
 */
ArrayReader.prototype.readData = function (size) {
  this.checkOffset(size);
  if (size === 0) {
    return [];
  }
  var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
  this.index += size;
  return result;
};
module.exports = ArrayReader;

;

/***/ }),

/***/ "./es6/base64.js":
/*!***********************!*\
  !*** ./es6/base64.js ***!
  \***********************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


// private property
var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

// public method for encoding
exports.encode = function (input) {
  var output = "";
  var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  var i = 0;
  while (i < input.length) {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);
    enc1 = chr1 >> 2;
    enc2 = (chr1 & 3) << 4 | chr2 >> 4;
    enc3 = (chr2 & 15) << 2 | chr3 >> 6;
    enc4 = chr3 & 63;
    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }
    output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
  }
  return output;
};

// public method for decoding
exports.decode = function (input) {
  var output = "";
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
  while (i < input.length) {
    enc1 = _keyStr.indexOf(input.charAt(i++));
    enc2 = _keyStr.indexOf(input.charAt(i++));
    enc3 = _keyStr.indexOf(input.charAt(i++));
    enc4 = _keyStr.indexOf(input.charAt(i++));
    chr1 = enc1 << 2 | enc2 >> 4;
    chr2 = (enc2 & 15) << 4 | enc3 >> 2;
    chr3 = (enc3 & 3) << 6 | enc4;
    output += String.fromCharCode(chr1);
    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }
  return output;
};

;

/***/ }),

/***/ "./es6/compressedObject.js":
/*!*********************************!*\
  !*** ./es6/compressedObject.js ***!
  \*********************************/
/***/ ((module) => {

"use strict";


function CompressedObject() {
  this.compressedSize = 0;
  this.uncompressedSize = 0;
  this.crc32 = 0;
  this.compressionMethod = null;
  this.compressedContent = null;
}
CompressedObject.prototype = {
  /**
   * Return the decompressed content in an unspecified format.
   * The format will depend on the decompressor.
   * @return {Object} the decompressed content.
   */
  getContent: function getContent() {
    return null; // see implementation
  },
  /**
   * Return the compressed content in an unspecified format.
   * The format will depend on the compressed conten source.
   * @return {Object} the compressed content.
   */
  getCompressedContent: function getCompressedContent() {
    return null; // see implementation
  }
};
module.exports = CompressedObject;

;

/***/ }),

/***/ "./es6/compressions.js":
/*!*****************************!*\
  !*** ./es6/compressions.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


exports.STORE = {
  magic: "\x00\x00",
  compress: function compress(content) {
    return content; // no compression
  },
  uncompress: function uncompress(content) {
    return content; // no compression
  },
  compressInputType: null,
  uncompressInputType: null
};
exports.DEFLATE = __webpack_require__(/*! ./flate.js */ "./es6/flate.js");

;

/***/ }),

/***/ "./es6/crc32.js":
/*!**********************!*\
  !*** ./es6/crc32.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");

// prettier-ignore
var table = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3, 0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7, 0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F, 0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D, 0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433, 0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];

/**
 *
 *  Javascript crc32
 *  http://www.webtoolkit.info/
 *
 */
module.exports = function crc32(input, crc) {
  if (typeof input === "undefined" || !input.length) {
    return 0;
  }
  var isArray = utils.getTypeOf(input) !== "string";
  if (typeof crc == "undefined") {
    crc = 0;
  }
  var x = 0;
  var y = 0;
  var b = 0;
  crc ^= -1;
  for (var i = 0, iTop = input.length; i < iTop; i++) {
    b = isArray ? input[i] : input.charCodeAt(i);
    y = (crc ^ b) & 0xff;
    x = table[y];
    crc = crc >>> 8 ^ x;
  }
  return crc ^ -1;
};

;

/***/ }),

/***/ "./es6/dataReader.js":
/*!***************************!*\
  !*** ./es6/dataReader.js ***!
  \***************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");
function DataReader() {
  this.data = null; // type : see implementation
  this.length = 0;
  this.index = 0;
  this.zero = 0;
}
DataReader.prototype = {
  /**
   * Check that the offset will not go too far.
   * @param {string} offset the additional offset to check.
   * @throws {Error} an Error if the offset is out of bounds.
   */
  checkOffset: function checkOffset(offset) {
    this.checkIndex(this.index + offset);
  },
  /**
   * Check that the specifed index will not be too far.
   * @param {string} newIndex the index to check.
   * @throws {Error} an Error if the index is out of bounds.
   */
  checkIndex: function checkIndex(newIndex) {
    if (this.length < this.zero + newIndex || newIndex < 0) {
      throw new Error("End of data reached (data length = " + this.length + ", asked index = " + newIndex + "). Corrupted zip ?");
    }
  },
  /**
   * Change the index.
   * @param {number} newIndex The new index.
   * @throws {Error} if the new index is out of the data.
   */
  setIndex: function setIndex(newIndex) {
    this.checkIndex(newIndex);
    this.index = newIndex;
  },
  /**
   * Skip the next n bytes.
   * @param {number} n the number of bytes to skip.
   * @throws {Error} if the new index is out of the data.
   */
  skip: function skip(n) {
    this.setIndex(this.index + n);
  },
  /**
   * Get the byte at the specified index.
   * @param {number} i the index to use.
   * @return {number} a byte.
   */
  byteAt: function byteAt() {
    // see implementations
  },
  /**
   * Get the next number with a given byte size.
   * @param {number} size the number of bytes to read.
   * @return {number} the corresponding number.
   */
  readInt: function readInt(size) {
    var result = 0,
      i;
    this.checkOffset(size);
    for (i = this.index + size - 1; i >= this.index; i--) {
      result = (result << 8) + this.byteAt(i);
    }
    this.index += size;
    return result;
  },
  /**
   * Get the next string with a given byte size.
   * @param {number} size the number of bytes to read.
   * @return {string} the corresponding string.
   */
  readString: function readString(size) {
    return utils.transformTo("string", this.readData(size));
  },
  /**
   * Get raw data without conversion, <size> bytes.
   * @param {number} size the number of bytes to read.
   * @return {Object} the raw data, implementation specific.
   */
  readData: function readData() {
    // see implementations
  },
  /**
   * Find the last occurence of a zip signature (4 bytes).
   * @param {string} sig the signature to find.
   * @return {number} the index of the last occurence, -1 if not found.
   */
  lastIndexOfSignature: function lastIndexOfSignature() {
    // see implementations
  },
  /**
   * Get the next date.
   * @return {Date} the date.
   */
  readDate: function readDate() {
    var dostime = this.readInt(4);
    return new Date((dostime >> 25 & 0x7f) + 1980,
    // year
    (dostime >> 21 & 0x0f) - 1,
    // month
    dostime >> 16 & 0x1f,
    // day
    dostime >> 11 & 0x1f,
    // hour
    dostime >> 5 & 0x3f,
    // minute
    (dostime & 0x1f) << 1); // second
  }
};
module.exports = DataReader;

;

/***/ }),

/***/ "./es6/defaults.js":
/*!*************************!*\
  !*** ./es6/defaults.js ***!
  \*************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.base64 = false;
exports.binary = false;
exports.dir = false;
exports.createFolders = false;
exports.date = null;
exports.compression = null;
exports.compressionOptions = null;
exports.comment = null;
exports.unixPermissions = null;
exports.dosPermissions = null;

;

/***/ }),

/***/ "./es6/deprecatedPublicUtils.js":
/*!**************************************!*\
  !*** ./es6/deprecatedPublicUtils.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.string2binary = function (str) {
  return utils.string2binary(str);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.string2Uint8Array = function (str) {
  return utils.transformTo("uint8array", str);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.uint8Array2String = function (array) {
  return utils.transformTo("string", array);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.string2Blob = function (str) {
  var buffer = utils.transformTo("arraybuffer", str);
  return utils.arrayBuffer2Blob(buffer);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.arrayBuffer2Blob = function (buffer) {
  return utils.arrayBuffer2Blob(buffer);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.transformTo = function (outputType, input) {
  return utils.transformTo(outputType, input);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.getTypeOf = function (input) {
  return utils.getTypeOf(input);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.checkSupport = function (type) {
  return utils.checkSupport(type);
};

/**
 * @deprecated
 * This value will be removed in a future version without replacement.
 */
exports.MAX_VALUE_16BITS = utils.MAX_VALUE_16BITS;

/**
 * @deprecated
 * This value will be removed in a future version without replacement.
 */
exports.MAX_VALUE_32BITS = utils.MAX_VALUE_32BITS;

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.pretty = function (str) {
  return utils.pretty(str);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.findCompression = function (compressionMethod) {
  return utils.findCompression(compressionMethod);
};

/**
 * @deprecated
 * This function will be removed in a future version without replacement.
 */
exports.isRegExp = function (object) {
  return utils.isRegExp(object);
};

;

/***/ }),

/***/ "./es6/flate.js":
/*!**********************!*\
  !*** ./es6/flate.js ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var USE_TYPEDARRAY = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Uint32Array !== "undefined";
var pako = __webpack_require__(/*! pako/dist/pako.es5.min.js */ "./node_modules/pako/dist/pako.es5.min.js");
exports.uncompressInputType = USE_TYPEDARRAY ? "uint8array" : "array";
exports.compressInputType = USE_TYPEDARRAY ? "uint8array" : "array";
exports.magic = "\x08\x00";
exports.compress = function (input, compressionOptions) {
  return pako.deflateRaw(input, {
    level: compressionOptions.level || -1 // default compression
  });
};
exports.uncompress = function (input) {
  return pako.inflateRaw(input);
};

;

/***/ }),

/***/ "./es6/index.js":
/*!**********************!*\
  !*** ./es6/index.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var base64 = __webpack_require__(/*! ./base64.js */ "./es6/base64.js");

/**
Usage:
   zip = new PizZip();
   zip.file("hello.txt", "Hello, World!").file("tempfile", "nothing");
   zip.folder("images").file("smile.gif", base64Data, {base64: true});
   zip.file("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
   zip.remove("tempfile");

   base64zip = zip.generate();

**/

/**
 * Representation a of zip file in js
 * @constructor
 * @param {String=|ArrayBuffer=|Uint8Array=} data the data to load, if any (optional).
 * @param {Object=} options the options for creating this objects (optional).
 */
function PizZip(data, options) {
  // if this constructor is used without `new`, it adds `new` before itself:
  if (!(this instanceof PizZip)) {
    return new PizZip(data, options);
  }

  // object containing the files :
  // {
  //   "folder/" : {...},
  //   "folder/data.txt" : {...}
  // }
  this.files = {};
  this.comment = null;

  // Where we are in the hierarchy
  this.root = "";
  if (data) {
    this.load(data, options);
  }
  this.clone = function () {
    var _this = this;
    var newObj = new PizZip();
    Object.keys(this.files).forEach(function (file) {
      newObj.file(file, _this.files[file].asUint8Array());
    });
    return newObj;
  };
  this.shallowClone = function () {
    var newObj = new PizZip();
    for (var i in this) {
      if (typeof this[i] !== "function") {
        newObj[i] = this[i];
      }
    }
    return newObj;
  };
}
PizZip.prototype = __webpack_require__(/*! ./object.js */ "./es6/object.js");
PizZip.prototype.load = __webpack_require__(/*! ./load.js */ "./es6/load.js");
PizZip.support = __webpack_require__(/*! ./support.js */ "./es6/support.js");
PizZip.defaults = __webpack_require__(/*! ./defaults.js */ "./es6/defaults.js");

/**
 * @deprecated
 * This namespace will be removed in a future version without replacement.
 */
PizZip.utils = __webpack_require__(/*! ./deprecatedPublicUtils.js */ "./es6/deprecatedPublicUtils.js");
PizZip.base64 = {
  /**
   * @deprecated
   * This method will be removed in a future version without replacement.
   */
  encode: function encode(input) {
    return base64.encode(input);
  },
  /**
   * @deprecated
   * This method will be removed in a future version without replacement.
   */
  decode: function decode(input) {
    return base64.decode(input);
  }
};
PizZip.compressions = __webpack_require__(/*! ./compressions.js */ "./es6/compressions.js");
module.exports = PizZip;
module.exports["default"] = PizZip;

;

/***/ }),

/***/ "./es6/load.js":
/*!*********************!*\
  !*** ./es6/load.js ***!
  \*********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var base64 = __webpack_require__(/*! ./base64.js */ "./es6/base64.js");
var utf8 = __webpack_require__(/*! ./utf8.js */ "./es6/utf8.js");
var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");
var ZipEntries = __webpack_require__(/*! ./zipEntries.js */ "./es6/zipEntries.js");
module.exports = function (data, options) {
  var i, input;
  options = utils.extend(options || {}, {
    base64: false,
    checkCRC32: false,
    optimizedBinaryString: false,
    createFolders: false,
    decodeFileName: utf8.utf8decode
  });
  if (options.base64) {
    data = base64.decode(data);
  }
  var zipEntries = new ZipEntries(data, options);
  var files = zipEntries.files;
  for (i = 0; i < files.length; i++) {
    input = files[i];
    this.file(input.fileNameStr, input.decompressed, {
      binary: true,
      optimizedBinaryString: true,
      date: input.date,
      dir: input.dir,
      comment: input.fileCommentStr.length ? input.fileCommentStr : null,
      unixPermissions: input.unixPermissions,
      dosPermissions: input.dosPermissions,
      createFolders: options.createFolders
    });
  }
  if (zipEntries.zipComment.length) {
    this.comment = zipEntries.zipComment;
  }
  return this;
};

;

/***/ }),

/***/ "./es6/nodeBuffer.js":
/*!***************************!*\
  !*** ./es6/nodeBuffer.js ***!
  \***************************/
/***/ ((module) => {

"use strict";


module.exports = function (data, encoding) {
  if (typeof data === "number") {
    return Buffer.alloc(data);
  }
  return Buffer.from(data, encoding);
};
module.exports.test = function (b) {
  return Buffer.isBuffer(b);
};

;

/***/ }),

/***/ "./es6/nodeBufferReader.js":
/*!*********************************!*\
  !*** ./es6/nodeBufferReader.js ***!
  \*********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var Uint8ArrayReader = __webpack_require__(/*! ./uint8ArrayReader.js */ "./es6/uint8ArrayReader.js");
function NodeBufferReader(data) {
  this.data = data;
  this.length = this.data.length;
  this.index = 0;
  this.zero = 0;
}
NodeBufferReader.prototype = new Uint8ArrayReader();

/**
 * @see DataReader.readData
 */
NodeBufferReader.prototype.readData = function (size) {
  this.checkOffset(size);
  var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
  this.index += size;
  return result;
};
module.exports = NodeBufferReader;

;

/***/ }),

/***/ "./es6/object.js":
/*!***********************!*\
  !*** ./es6/object.js ***!
  \***********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var support = __webpack_require__(/*! ./support.js */ "./es6/support.js");
var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");
var _crc = __webpack_require__(/*! ./crc32.js */ "./es6/crc32.js");
var signature = __webpack_require__(/*! ./signature.js */ "./es6/signature.js");
var defaults = __webpack_require__(/*! ./defaults.js */ "./es6/defaults.js");
var base64 = __webpack_require__(/*! ./base64.js */ "./es6/base64.js");
var compressions = __webpack_require__(/*! ./compressions.js */ "./es6/compressions.js");
var CompressedObject = __webpack_require__(/*! ./compressedObject.js */ "./es6/compressedObject.js");
var nodeBuffer = __webpack_require__(/*! ./nodeBuffer.js */ "./es6/nodeBuffer.js");
var utf8 = __webpack_require__(/*! ./utf8.js */ "./es6/utf8.js");
var StringWriter = __webpack_require__(/*! ./stringWriter.js */ "./es6/stringWriter.js");
var Uint8ArrayWriter = __webpack_require__(/*! ./uint8ArrayWriter.js */ "./es6/uint8ArrayWriter.js");

/**
 * Returns the raw data of a ZipObject, decompress the content if necessary.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */
function getRawData(file) {
  if (file._data instanceof CompressedObject) {
    file._data = file._data.getContent();
    file.options.binary = true;
    file.options.base64 = false;
    if (utils.getTypeOf(file._data) === "uint8array") {
      var copy = file._data;
      // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
      // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
      file._data = new Uint8Array(copy.length);
      // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
      if (copy.length !== 0) {
        file._data.set(copy, 0);
      }
    }
  }
  return file._data;
}

/**
 * Returns the data of a ZipObject in a binary form. If the content is an unicode string, encode it.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */
function getBinaryData(file) {
  var result = getRawData(file),
    type = utils.getTypeOf(result);
  if (type === "string") {
    if (!file.options.binary) {
      // unicode text !
      // unicode string => binary string is a painful process, check if we can avoid it.
      if (support.nodebuffer) {
        return nodeBuffer(result, "utf-8");
      }
    }
    return file.asBinary();
  }
  return result;
}

// return the actual prototype of PizZip
var out = {
  /**
   * Read an existing zip and merge the data in the current PizZip object.
   * The implementation is in pizzip-load.js, don't forget to include it.
   * @param {String|ArrayBuffer|Uint8Array|Buffer} stream  The stream to load
   * @param {Object} options Options for loading the stream.
   *  options.base64 : is the stream in base64 ? default : false
   * @return {PizZip} the current PizZip object
   */
  load: function load() {
    throw new Error("Load method is not defined. Is the file pizzip-load.js included ?");
  },
  /**
   * Filter nested files/folders with the specified function.
   * @param {Function} search the predicate to use :
   * function (relativePath, file) {...}
   * It takes 2 arguments : the relative path and the file.
   * @return {Array} An array of matching elements.
   */
  filter: function filter(search) {
    var result = [];
    var filename, relativePath, file, fileClone;
    for (filename in this.files) {
      if (!this.files.hasOwnProperty(filename)) {
        continue;
      }
      file = this.files[filename];
      // return a new object, don't let the user mess with our internal objects :)
      fileClone = new ZipObject(file.name, file._data, utils.extend(file.options));
      relativePath = filename.slice(this.root.length, filename.length);
      if (filename.slice(0, this.root.length) === this.root &&
      // the file is in the current root
      search(relativePath, fileClone)) {
        // and the file matches the function
        result.push(fileClone);
      }
    }
    return result;
  },
  /**
   * Add a file to the zip file, or search a file.
   * @param   {string|RegExp} name The name of the file to add (if data is defined),
   * the name of the file to find (if no data) or a regex to match files.
   * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
   * @param   {Object} o     File options
   * @return  {PizZip|Object|Array} this PizZip object (when adding a file),
   * a file (when searching by string) or an array of files (when searching by regex).
   */
  file: function file(name, data, o) {
    if (arguments.length === 1) {
      if (utils.isRegExp(name)) {
        var regexp = name;
        return this.filter(function (relativePath, file) {
          return !file.dir && regexp.test(relativePath);
        });
      }
      // text
      return this.filter(function (relativePath, file) {
        return !file.dir && relativePath === name;
      })[0] || null;
    }
    // more than one argument : we have data !
    name = this.root + name;
    fileAdd.call(this, name, data, o);
    return this;
  },
  /**
   * Add a directory to the zip file, or search.
   * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
   * @return  {PizZip} an object with the new directory as the root, or an array containing matching folders.
   */
  folder: function folder(arg) {
    if (!arg) {
      return this;
    }
    if (utils.isRegExp(arg)) {
      return this.filter(function (relativePath, file) {
        return file.dir && arg.test(relativePath);
      });
    }

    // else, name is a new folder
    var name = this.root + arg;
    var newFolder = folderAdd.call(this, name);

    // Allow chaining by returning a new object with this folder as the root
    var ret = this.shallowClone();
    ret.root = newFolder.name;
    return ret;
  },
  /**
   * Delete a file, or a directory and all sub-files, from the zip
   * @param {string} name the name of the file to delete
   * @return {PizZip} this PizZip object
   */
  remove: function remove(name) {
    name = this.root + name;
    var file = this.files[name];
    if (!file) {
      // Look for any folders
      if (name.slice(-1) !== "/") {
        name += "/";
      }
      file = this.files[name];
    }
    if (file && !file.dir) {
      // file
      delete this.files[name];
    } else {
      // maybe a folder, delete recursively
      var kids = this.filter(function (relativePath, file) {
        return file.name.slice(0, name.length) === name;
      });
      for (var i = 0; i < kids.length; i++) {
        delete this.files[kids[i].name];
      }
    }
    return this;
  },
  /**
   * Generate the complete zip file
   * @param {Object} options the options to generate the zip file :
   * - base64, (deprecated, use type instead) true to generate base64.
   * - compression, "STORE" by default.
   * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
   * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the zip file
   */
  generate: function generate(options) {
    options = utils.extend(options || {}, {
      base64: true,
      compression: "STORE",
      compressionOptions: null,
      type: "base64",
      platform: "DOS",
      comment: null,
      mimeType: "application/zip",
      encodeFileName: utf8.utf8encode
    });
    utils.checkSupport(options.type);

    // accept nodejs `process.platform`
    if (options.platform === "darwin" || options.platform === "freebsd" || options.platform === "linux" || options.platform === "sunos") {
      options.platform = "UNIX";
    }
    if (options.platform === "win32") {
      options.platform = "DOS";
    }
    var zipData = [],
      encodedComment = utils.transformTo("string", options.encodeFileName(options.comment || this.comment || ""));
    var localDirLength = 0,
      centralDirLength = 0,
      writer,
      i;

    // first, generate all the zip parts.
    for (var name in this.files) {
      if (!this.files.hasOwnProperty(name)) {
        continue;
      }
      var file = this.files[name];
      var compressionName = file.options.compression || options.compression.toUpperCase();
      var compression = compressions[compressionName];
      if (!compression) {
        throw new Error(compressionName + " is not a valid compression method !");
      }
      var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
      var compressedObject = generateCompressedObjectFrom.call(this, file, compression, compressionOptions);
      var zipPart = generateZipParts.call(this, name, file, compressedObject, localDirLength, options.platform, options.encodeFileName);
      localDirLength += zipPart.fileRecord.length + compressedObject.compressedSize;
      centralDirLength += zipPart.dirRecord.length;
      zipData.push(zipPart);
    }
    var dirEnd = "";

    // end of central dir signature
    dirEnd = signature.CENTRAL_DIRECTORY_END +
    // number of this disk
    "\x00\x00" +
    // number of the disk with the start of the central directory
    "\x00\x00" +
    // total number of entries in the central directory on this disk
    decToHex(zipData.length, 2) +
    // total number of entries in the central directory
    decToHex(zipData.length, 2) +
    // size of the central directory   4 bytes
    decToHex(centralDirLength, 4) +
    // offset of start of central directory with respect to the starting disk number
    decToHex(localDirLength, 4) +
    // .ZIP file comment length
    decToHex(encodedComment.length, 2) +
    // .ZIP file comment
    encodedComment;

    // we have all the parts (and the total length)
    // time to create a writer !
    var typeName = options.type.toLowerCase();
    if (typeName === "uint8array" || typeName === "arraybuffer" || typeName === "blob" || typeName === "nodebuffer") {
      writer = new Uint8ArrayWriter(localDirLength + centralDirLength + dirEnd.length);
    } else {
      writer = new StringWriter(localDirLength + centralDirLength + dirEnd.length);
    }
    for (i = 0; i < zipData.length; i++) {
      writer.append(zipData[i].fileRecord);
      writer.append(zipData[i].compressedObject.compressedContent);
    }
    for (i = 0; i < zipData.length; i++) {
      writer.append(zipData[i].dirRecord);
    }
    writer.append(dirEnd);
    var zip = writer.finalize();
    switch (options.type.toLowerCase()) {
      // case "zip is an Uint8Array"
      case "uint8array":
      case "arraybuffer":
      case "nodebuffer":
        return utils.transformTo(options.type.toLowerCase(), zip);
      case "blob":
        return utils.arrayBuffer2Blob(utils.transformTo("arraybuffer", zip), options.mimeType);
      // case "zip is a string"
      case "base64":
        return options.base64 ? base64.encode(zip) : zip;
      default:
        // case "string" :
        return zip;
    }
  },
  /**
   * @deprecated
   * This method will be removed in a future version without replacement.
   */
  crc32: function crc32(input, crc) {
    return _crc(input, crc);
  },
  /**
   * @deprecated
   * This method will be removed in a future version without replacement.
   */
  utf8encode: function utf8encode(string) {
    return utils.transformTo("string", utf8.utf8encode(string));
  },
  /**
   * @deprecated
   * This method will be removed in a future version without replacement.
   */
  utf8decode: function utf8decode(input) {
    return utf8.utf8decode(input);
  }
};
/**
 * Transform this._data into a string.
 * @param {function} filter a function String -> String, applied if not null on the result.
 * @return {String} the string representing this._data.
 */
function dataToString(asUTF8) {
  var result = getRawData(this);
  if (result === null || typeof result === "undefined") {
    return "";
  }
  // if the data is a base64 string, we decode it before checking the encoding !
  if (this.options.base64) {
    result = base64.decode(result);
  }
  if (asUTF8 && this.options.binary) {
    // PizZip.prototype.utf8decode supports arrays as input
    // skip to array => string step, utf8decode will do it.
    result = out.utf8decode(result);
  } else {
    // no utf8 transformation, do the array => string step.
    result = utils.transformTo("string", result);
  }
  if (!asUTF8 && !this.options.binary) {
    result = utils.transformTo("string", out.utf8encode(result));
  }
  return result;
}
/**
 * A simple object representing a file in the zip file.
 * @constructor
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
 * @param {Object} options the options of the file
 */
function ZipObject(name, data, options) {
  this.name = name;
  this.dir = options.dir;
  this.date = options.date;
  this.comment = options.comment;
  this.unixPermissions = options.unixPermissions;
  this.dosPermissions = options.dosPermissions;
  this._data = data;
  this.options = options;

  /*
   * This object contains initial values for dir and date.
   * With them, we can check if the user changed the deprecated metadata in
   * `ZipObject#options` or not.
   */
  this._initialMetadata = {
    dir: options.dir,
    date: options.date
  };
}
ZipObject.prototype = {
  /**
   * Return the content as UTF8 string.
   * @return {string} the UTF8 string.
   */
  asText: function asText() {
    return dataToString.call(this, true);
  },
  /**
   * Returns the binary content.
   * @return {string} the content as binary.
   */
  asBinary: function asBinary() {
    return dataToString.call(this, false);
  },
  /**
   * Returns the content as a nodejs Buffer.
   * @return {Buffer} the content as a Buffer.
   */
  asNodeBuffer: function asNodeBuffer() {
    var result = getBinaryData(this);
    return utils.transformTo("nodebuffer", result);
  },
  /**
   * Returns the content as an Uint8Array.
   * @return {Uint8Array} the content as an Uint8Array.
   */
  asUint8Array: function asUint8Array() {
    var result = getBinaryData(this);
    return utils.transformTo("uint8array", result);
  },
  /**
   * Returns the content as an ArrayBuffer.
   * @return {ArrayBuffer} the content as an ArrayBufer.
   */
  asArrayBuffer: function asArrayBuffer() {
    return this.asUint8Array().buffer;
  }
};

/**
 * Transform an integer into a string in hexadecimal.
 * @private
 * @param {number} dec the number to convert.
 * @param {number} bytes the number of bytes to generate.
 * @returns {string} the result.
 */
function decToHex(dec, bytes) {
  var hex = "",
    i;
  for (i = 0; i < bytes; i++) {
    hex += String.fromCharCode(dec & 0xff);
    dec >>>= 8;
  }
  return hex;
}

/**
 * Transforms the (incomplete) options from the user into the complete
 * set of options to create a file.
 * @private
 * @param {Object} o the options from the user.
 * @return {Object} the complete set of options.
 */
function prepareFileAttrs(o) {
  o = o || {};
  if (o.base64 === true && (o.binary === null || o.binary === undefined)) {
    o.binary = true;
  }
  o = utils.extend(o, defaults);
  o.date = o.date || new Date();
  if (o.compression !== null) {
    o.compression = o.compression.toUpperCase();
  }
  return o;
}

/**
 * Add a file in the current folder.
 * @private
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
 * @param {Object} o the options of the file
 * @return {Object} the new file.
 */
function fileAdd(name, data, o) {
  // be sure sub folders exist
  var dataType = utils.getTypeOf(data),
    parent;
  o = prepareFileAttrs(o);
  if (typeof o.unixPermissions === "string") {
    o.unixPermissions = parseInt(o.unixPermissions, 8);
  }

  // UNX_IFDIR  0040000 see zipinfo.c
  if (o.unixPermissions && o.unixPermissions & 0x4000) {
    o.dir = true;
  }
  // Bit 4    Directory
  if (o.dosPermissions && o.dosPermissions & 0x0010) {
    o.dir = true;
  }
  if (o.dir) {
    name = forceTrailingSlash(name);
  }
  if (o.createFolders && (parent = parentFolder(name))) {
    folderAdd.call(this, parent, true);
  }
  if (o.dir || data === null || typeof data === "undefined") {
    o.base64 = false;
    o.binary = false;
    data = null;
    dataType = null;
  } else if (dataType === "string") {
    if (o.binary && !o.base64) {
      // optimizedBinaryString == true means that the file has already been filtered with a 0xFF mask
      if (o.optimizedBinaryString !== true) {
        // this is a string, not in a base64 format.
        // Be sure that this is a correct "binary string"
        data = utils.string2binary(data);
      }
    }
  } else {
    // arraybuffer, uint8array, ...
    o.base64 = false;
    o.binary = true;
    if (!dataType && !(data instanceof CompressedObject)) {
      throw new Error("The data of '" + name + "' is in an unsupported format !");
    }

    // special case : it's way easier to work with Uint8Array than with ArrayBuffer
    if (dataType === "arraybuffer") {
      data = utils.transformTo("uint8array", data);
    }
  }
  var object = new ZipObject(name, data, o);
  this.files[name] = object;
  return object;
}

/**
 * Find the parent folder of the path.
 * @private
 * @param {string} path the path to use
 * @return {string} the parent folder, or ""
 */
function parentFolder(path) {
  if (path.slice(-1) === "/") {
    path = path.substring(0, path.length - 1);
  }
  var lastSlash = path.lastIndexOf("/");
  return lastSlash > 0 ? path.substring(0, lastSlash) : "";
}

/**
 * Returns the path with a slash at the end.
 * @private
 * @param {String} path the path to check.
 * @return {String} the path with a trailing slash.
 */
function forceTrailingSlash(path) {
  // Check the name ends with a /
  if (path.slice(-1) !== "/") {
    path += "/"; // IE doesn't like substr(-1)
  }
  return path;
}
/**
 * Add a (sub) folder in the current folder.
 * @private
 * @param {string} name the folder's name
 * @param {boolean=} [createFolders] If true, automatically create sub
 *  folders. Defaults to false.
 * @return {Object} the new folder.
 */
function folderAdd(name, createFolders) {
  createFolders = typeof createFolders !== "undefined" ? createFolders : false;
  name = forceTrailingSlash(name);

  // Does this folder already exist?
  if (!this.files[name]) {
    fileAdd.call(this, name, null, {
      dir: true,
      createFolders: createFolders
    });
  }
  return this.files[name];
}

/**
 * Generate a PizZip.CompressedObject for a given zipOject.
 * @param {ZipObject} file the object to read.
 * @param {PizZip.compression} compression the compression to use.
 * @param {Object} compressionOptions the options to use when compressing.
 * @return {PizZip.CompressedObject} the compressed result.
 */
function generateCompressedObjectFrom(file, compression, compressionOptions) {
  var result = new CompressedObject();
  var content;

  // the data has not been decompressed, we might reuse things !
  if (file._data instanceof CompressedObject) {
    result.uncompressedSize = file._data.uncompressedSize;
    result.crc32 = file._data.crc32;
    if (result.uncompressedSize === 0 || file.dir) {
      compression = compressions.STORE;
      result.compressedContent = "";
      result.crc32 = 0;
    } else if (file._data.compressionMethod === compression.magic) {
      result.compressedContent = file._data.getCompressedContent();
    } else {
      content = file._data.getContent();
      // need to decompress / recompress
      result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions);
    }
  } else {
    // have uncompressed data
    content = getBinaryData(file);
    if (!content || content.length === 0 || file.dir) {
      compression = compressions.STORE;
      content = "";
    }
    result.uncompressedSize = content.length;
    result.crc32 = _crc(content);
    result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions);
  }
  result.compressedSize = result.compressedContent.length;
  result.compressionMethod = compression.magic;
  return result;
}

/**
 * Generate the UNIX part of the external file attributes.
 * @param {Object} unixPermissions the unix permissions or null.
 * @param {Boolean} isDir true if the entry is a directory, false otherwise.
 * @return {Number} a 32 bit integer.
 *
 * adapted from http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute :
 *
 * TTTTsstrwxrwxrwx0000000000ADVSHR
 * ^^^^____________________________ file type, see zipinfo.c (UNX_*)
 *     ^^^_________________________ setuid, setgid, sticky
 *        ^^^^^^^^^________________ permissions
 *                 ^^^^^^^^^^______ not used ?
 *                           ^^^^^^ DOS attribute bits : Archive, Directory, Volume label, System file, Hidden, Read only
 */
function generateUnixExternalFileAttr(unixPermissions, isDir) {
  var result = unixPermissions;
  if (!unixPermissions) {
    // I can't use octal values in strict mode, hence the hexa.
    //  040775 => 0x41fd
    // 0100664 => 0x81b4
    result = isDir ? 0x41fd : 0x81b4;
  }
  return (result & 0xffff) << 16;
}

/**
 * Generate the DOS part of the external file attributes.
 * @param {Object} dosPermissions the dos permissions or null.
 * @param {Boolean} isDir true if the entry is a directory, false otherwise.
 * @return {Number} a 32 bit integer.
 *
 * Bit 0     Read-Only
 * Bit 1     Hidden
 * Bit 2     System
 * Bit 3     Volume Label
 * Bit 4     Directory
 * Bit 5     Archive
 */
function generateDosExternalFileAttr(dosPermissions) {
  // the dir flag is already set for compatibility

  return (dosPermissions || 0) & 0x3f;
}

/**
 * Generate the various parts used in the construction of the final zip file.
 * @param {string} name the file name.
 * @param {ZipObject} file the file content.
 * @param {PizZip.CompressedObject} compressedObject the compressed object.
 * @param {number} offset the current offset from the start of the zip file.
 * @param {String} platform let's pretend we are this platform (change platform dependents fields)
 * @param {Function} encodeFileName the function to encode the file name / comment.
 * @return {object} the zip parts.
 */
function generateZipParts(name, file, compressedObject, offset, platform, encodeFileName) {
  var useCustomEncoding = encodeFileName !== utf8.utf8encode,
    encodedFileName = utils.transformTo("string", encodeFileName(file.name)),
    utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)),
    comment = file.comment || "",
    encodedComment = utils.transformTo("string", encodeFileName(comment)),
    utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)),
    useUTF8ForFileName = utfEncodedFileName.length !== file.name.length,
    useUTF8ForComment = utfEncodedComment.length !== comment.length,
    o = file.options;
  var dosTime,
    dosDate,
    extraFields = "",
    unicodePathExtraField = "",
    unicodeCommentExtraField = "",
    dir,
    date;

  // handle the deprecated options.dir
  if (file._initialMetadata.dir !== file.dir) {
    dir = file.dir;
  } else {
    dir = o.dir;
  }

  // handle the deprecated options.date
  if (file._initialMetadata.date !== file.date) {
    date = file.date;
  } else {
    date = o.date;
  }
  var extFileAttr = 0;
  var versionMadeBy = 0;
  if (dir) {
    // dos or unix, we set the dos dir flag
    extFileAttr |= 0x00010;
  }
  if (platform === "UNIX") {
    versionMadeBy = 0x031e; // UNIX, version 3.0
    extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
  } else {
    // DOS or other, fallback to DOS
    versionMadeBy = 0x0014; // DOS, version 2.0
    extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
  }

  // date
  // @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
  // @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
  // @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

  dosTime = date.getHours();
  dosTime <<= 6;
  dosTime |= date.getMinutes();
  dosTime <<= 5;
  dosTime |= date.getSeconds() / 2;
  dosDate = date.getFullYear() - 1980;
  dosDate <<= 4;
  dosDate |= date.getMonth() + 1;
  dosDate <<= 5;
  dosDate |= date.getDate();
  if (useUTF8ForFileName) {
    // set the unicode path extra field. unzip needs at least one extra
    // field to correctly handle unicode path, so using the path is as good
    // as any other information. This could improve the situation with
    // other archive managers too.
    // This field is usually used without the utf8 flag, with a non
    // unicode path in the header (winrar, winzip). This helps (a bit)
    // with the messy Windows' default compressed folders feature but
    // breaks on p7zip which doesn't seek the unicode path extra field.
    // So for now, UTF-8 everywhere !
    unicodePathExtraField =
    // Version
    decToHex(1, 1) +
    // NameCRC32
    decToHex(_crc(encodedFileName), 4) +
    // UnicodeName
    utfEncodedFileName;
    extraFields +=
    // Info-ZIP Unicode Path Extra Field
    "\x75\x70" +
    // size
    decToHex(unicodePathExtraField.length, 2) +
    // content
    unicodePathExtraField;
  }
  if (useUTF8ForComment) {
    unicodeCommentExtraField =
    // Version
    decToHex(1, 1) +
    // CommentCRC32
    decToHex(this.crc32(encodedComment), 4) +
    // UnicodeName
    utfEncodedComment;
    extraFields +=
    // Info-ZIP Unicode Path Extra Field
    "\x75\x63" +
    // size
    decToHex(unicodeCommentExtraField.length, 2) +
    // content
    unicodeCommentExtraField;
  }
  var header = "";

  // version needed to extract
  header += "\x0A\x00";
  // general purpose bit flag
  // set bit 11 if utf8
  header += !useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment) ? "\x00\x08" : "\x00\x00";
  // compression method
  header += compressedObject.compressionMethod;
  // last mod file time
  header += decToHex(dosTime, 2);
  // last mod file date
  header += decToHex(dosDate, 2);
  // crc-32
  header += decToHex(compressedObject.crc32, 4);
  // compressed size
  header += decToHex(compressedObject.compressedSize, 4);
  // uncompressed size
  header += decToHex(compressedObject.uncompressedSize, 4);
  // file name length
  header += decToHex(encodedFileName.length, 2);
  // extra field length
  header += decToHex(extraFields.length, 2);
  var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;
  var dirRecord = signature.CENTRAL_FILE_HEADER +
  // version made by (00: DOS)
  decToHex(versionMadeBy, 2) +
  // file header (common to file and central directory)
  header +
  // file comment length
  decToHex(encodedComment.length, 2) +
  // disk number start
  "\x00\x00" +
  // internal file attributes
  "\x00\x00" +
  // external file attributes
  decToHex(extFileAttr, 4) +
  // relative offset of local header
  decToHex(offset, 4) +
  // file name
  encodedFileName +
  // extra field
  extraFields +
  // file comment
  encodedComment;
  return {
    fileRecord: fileRecord,
    dirRecord: dirRecord,
    compressedObject: compressedObject
  };
}
module.exports = out;

;

/***/ }),

/***/ "./es6/signature.js":
/*!**************************!*\
  !*** ./es6/signature.js ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.LOCAL_FILE_HEADER = "PK\x03\x04";
exports.CENTRAL_FILE_HEADER = "PK\x01\x02";
exports.CENTRAL_DIRECTORY_END = "PK\x05\x06";
exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x06\x07";
exports.ZIP64_CENTRAL_DIRECTORY_END = "PK\x06\x06";
exports.DATA_DESCRIPTOR = "PK\x07\x08";

;

/***/ }),

/***/ "./es6/stringReader.js":
/*!*****************************!*\
  !*** ./es6/stringReader.js ***!
  \*****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var DataReader = __webpack_require__(/*! ./dataReader.js */ "./es6/dataReader.js");
var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");
function StringReader(data, optimizedBinaryString) {
  this.data = data;
  if (!optimizedBinaryString) {
    this.data = utils.string2binary(this.data);
  }
  this.length = this.data.length;
  this.index = 0;
  this.zero = 0;
}
StringReader.prototype = new DataReader();
/**
 * @see DataReader.byteAt
 */
StringReader.prototype.byteAt = function (i) {
  return this.data.charCodeAt(this.zero + i);
};
/**
 * @see DataReader.lastIndexOfSignature
 */
StringReader.prototype.lastIndexOfSignature = function (sig) {
  return this.data.lastIndexOf(sig) - this.zero;
};
/**
 * @see DataReader.readData
 */
StringReader.prototype.readData = function (size) {
  this.checkOffset(size);
  // this will work because the constructor applied the "& 0xff" mask.
  var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
  this.index += size;
  return result;
};
module.exports = StringReader;

;

/***/ }),

/***/ "./es6/stringWriter.js":
/*!*****************************!*\
  !*** ./es6/stringWriter.js ***!
  \*****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");

/**
 * An object to write any content to a string.
 * @constructor
 */
function StringWriter() {
  this.data = [];
}
StringWriter.prototype = {
  /**
   * Append any content to the current string.
   * @param {Object} input the content to add.
   */
  append: function append(input) {
    input = utils.transformTo("string", input);
    this.data.push(input);
  },
  /**
   * Finalize the construction an return the result.
   * @return {string} the generated string.
   */
  finalize: function finalize() {
    return this.data.join("");
  }
};
module.exports = StringWriter;

;

/***/ }),

/***/ "./es6/support.js":
/*!************************!*\
  !*** ./es6/support.js ***!
  \************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.base64 = true;
exports.array = true;
exports.string = true;
exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
// contains true if PizZip can read/generate nodejs Buffer, false otherwise.
// Browserify will provide a Buffer implementation for browsers, which is
// an augmented Uint8Array (i.e., can be used as either Buffer or U8).
exports.nodebuffer = typeof Buffer !== "undefined";
// contains true if PizZip can read/generate Uint8Array, false otherwise.
exports.uint8array = typeof Uint8Array !== "undefined";
if (typeof ArrayBuffer === "undefined") {
  exports.blob = false;
} else {
  var buffer = new ArrayBuffer(0);
  try {
    exports.blob = new Blob([buffer], {
      type: "application/zip"
    }).size === 0;
  } catch (e) {
    try {
      var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
      var builder = new Builder();
      builder.append(buffer);
      exports.blob = builder.getBlob("application/zip").size === 0;
    } catch (e) {
      exports.blob = false;
    }
  }
}

;

/***/ }),

/***/ "./es6/uint8ArrayReader.js":
/*!*********************************!*\
  !*** ./es6/uint8ArrayReader.js ***!
  \*********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var ArrayReader = __webpack_require__(/*! ./arrayReader.js */ "./es6/arrayReader.js");
function Uint8ArrayReader(data) {
  if (data) {
    this.data = data;
    this.length = this.data.length;
    this.index = 0;
    this.zero = 0;
  }
}
Uint8ArrayReader.prototype = new ArrayReader();
/**
 * @see DataReader.readData
 */
Uint8ArrayReader.prototype.readData = function (size) {
  this.checkOffset(size);
  if (size === 0) {
    // in IE10, when using subarray(idx, idx), we get the array [0x00] instead of [].
    return new Uint8Array(0);
  }
  var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
  this.index += size;
  return result;
};
module.exports = Uint8ArrayReader;

;

/***/ }),

/***/ "./es6/uint8ArrayWriter.js":
/*!*********************************!*\
  !*** ./es6/uint8ArrayWriter.js ***!
  \*********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");

/**
 * An object to write any content to an Uint8Array.
 * @constructor
 * @param {number} length The length of the array.
 */
function Uint8ArrayWriter(length) {
  this.data = new Uint8Array(length);
  this.index = 0;
}
Uint8ArrayWriter.prototype = {
  /**
   * Append any content to the current array.
   * @param {Object} input the content to add.
   */
  append: function append(input) {
    if (input.length !== 0) {
      // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
      input = utils.transformTo("uint8array", input);
      this.data.set(input, this.index);
      this.index += input.length;
    }
  },
  /**
   * Finalize the construction an return the result.
   * @return {Uint8Array} the generated array.
   */
  finalize: function finalize() {
    return this.data;
  }
};
module.exports = Uint8ArrayWriter;

;

/***/ }),

/***/ "./es6/utf8.js":
/*!*********************!*\
  !*** ./es6/utf8.js ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");
var support = __webpack_require__(/*! ./support.js */ "./es6/support.js");
var nodeBuffer = __webpack_require__(/*! ./nodeBuffer.js */ "./es6/nodeBuffer.js");

/**
 * The following functions come from pako, from pako/lib/utils/strings
 * released under the MIT license, see pako https://github.com/nodeca/pako/
 */

// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new Array(256);
for (var i = 0; i < 256; i++) {
  _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
}
_utf8len[254] = _utf8len[254] = 1; // Invalid sequence start

// convert string to array (typed, when possible)
function string2buf(str) {
  var buf,
    c,
    c2,
    mPos,
    i,
    bufLen = 0;
  var strLen = str.length;

  // count binary size
  for (mPos = 0; mPos < strLen; mPos++) {
    c = str.charCodeAt(mPos);
    if ((c & 0xfc00) === 0xd800 && mPos + 1 < strLen) {
      c2 = str.charCodeAt(mPos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + (c - 0xd800 << 10) + (c2 - 0xdc00);
        mPos++;
      }
    }
    bufLen += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  if (support.uint8array) {
    buf = new Uint8Array(bufLen);
  } else {
    buf = new Array(bufLen);
  }

  // convert
  for (i = 0, mPos = 0; i < bufLen; mPos++) {
    c = str.charCodeAt(mPos);
    if ((c & 0xfc00) === 0xd800 && mPos + 1 < strLen) {
      c2 = str.charCodeAt(mPos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + (c - 0xd800 << 10) + (c2 - 0xdc00);
        mPos++;
      }
    }
    if (c < 0x80) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 0xc0 | c >>> 6;
      buf[i++] = 0x80 | c & 0x3f;
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 0xe0 | c >>> 12;
      buf[i++] = 0x80 | c >>> 6 & 0x3f;
      buf[i++] = 0x80 | c & 0x3f;
    } else {
      /* four bytes */
      buf[i++] = 0xf0 | c >>> 18;
      buf[i++] = 0x80 | c >>> 12 & 0x3f;
      buf[i++] = 0x80 | c >>> 6 & 0x3f;
      buf[i++] = 0x80 | c & 0x3f;
    }
  }
  return buf;
}

// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
function utf8border(buf, max) {
  var pos;
  max = max || buf.length;
  if (max > buf.length) {
    max = buf.length;
  }

  // go back from last position, until start of sequence found
  pos = max - 1;
  while (pos >= 0 && (buf[pos] & 0xc0) === 0x80) {
    pos--;
  }

  // Fuckup - very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) {
    return max;
  }

  // If we came to start of buffer - that means vuffer is too small,
  // return max too.
  if (pos === 0) {
    return max;
  }
  return pos + _utf8len[buf[pos]] > max ? pos : max;
}

// convert array to string
function buf2string(buf) {
  var i, out, c, cLen;
  var len = buf.length;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  var utf16buf = new Array(len * 2);
  for (out = 0, i = 0; i < len;) {
    c = buf[i++];
    // quick process ascii
    if (c < 0x80) {
      utf16buf[out++] = c;
      continue;
    }
    cLen = _utf8len[c];
    // skip 5 & 6 byte codes
    if (cLen > 4) {
      utf16buf[out++] = 0xfffd;
      i += cLen - 1;
      continue;
    }

    // apply mask on first byte
    c &= cLen === 2 ? 0x1f : cLen === 3 ? 0x0f : 0x07;
    // join the rest
    while (cLen > 1 && i < len) {
      c = c << 6 | buf[i++] & 0x3f;
      cLen--;
    }

    // terminated by end of string?
    if (cLen > 1) {
      utf16buf[out++] = 0xfffd;
      continue;
    }
    if (c < 0x10000) {
      utf16buf[out++] = c;
    } else {
      c -= 0x10000;
      utf16buf[out++] = 0xd800 | c >> 10 & 0x3ff;
      utf16buf[out++] = 0xdc00 | c & 0x3ff;
    }
  }

  // shrinkBuf(utf16buf, out)
  if (utf16buf.length !== out) {
    if (utf16buf.subarray) {
      utf16buf = utf16buf.subarray(0, out);
    } else {
      utf16buf.length = out;
    }
  }

  // return String.fromCharCode.apply(null, utf16buf);
  return utils.applyFromCharCode(utf16buf);
}

// That's all for the pako functions.

/**
 * Transform a javascript string into an array (typed if possible) of bytes,
 * UTF-8 encoded.
 * @param {String} str the string to encode
 * @return {Array|Uint8Array|Buffer} the UTF-8 encoded string.
 */
exports.utf8encode = function utf8encode(str) {
  if (support.nodebuffer) {
    return nodeBuffer(str, "utf-8");
  }
  return string2buf(str);
};

/**
 * Transform a bytes array (or a representation) representing an UTF-8 encoded
 * string into a javascript string.
 * @param {Array|Uint8Array|Buffer} buf the data de decode
 * @return {String} the decoded string.
 */
exports.utf8decode = function utf8decode(buf) {
  if (support.nodebuffer) {
    return utils.transformTo("nodebuffer", buf).toString("utf-8");
  }
  buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);

  // return buf2string(buf);
  // Chrome prefers to work with "small" chunks of data
  // for the method buf2string.
  // Firefox and Chrome has their own shortcut, IE doesn't seem to really care.
  var result = [],
    len = buf.length,
    chunk = 65536;
  var k = 0;
  while (k < len) {
    var nextBoundary = utf8border(buf, Math.min(k + chunk, len));
    if (support.uint8array) {
      result.push(buf2string(buf.subarray(k, nextBoundary)));
    } else {
      result.push(buf2string(buf.slice(k, nextBoundary)));
    }
    k = nextBoundary;
  }
  return result.join("");
};

;

/***/ }),

/***/ "./es6/utils.js":
/*!**********************!*\
  !*** ./es6/utils.js ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var support = __webpack_require__(/*! ./support.js */ "./es6/support.js");
var compressions = __webpack_require__(/*! ./compressions.js */ "./es6/compressions.js");
var nodeBuffer = __webpack_require__(/*! ./nodeBuffer.js */ "./es6/nodeBuffer.js");
/**
 * Convert a string to a "binary string" : a string containing only char codes between 0 and 255.
 * @param {string} str the string to transform.
 * @return {String} the binary string.
 */
exports.string2binary = function (str) {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) & 0xff);
  }
  return result;
};
exports.arrayBuffer2Blob = function (buffer, mimeType) {
  exports.checkSupport("blob");
  mimeType = mimeType || "application/zip";
  try {
    // Blob constructor
    return new Blob([buffer], {
      type: mimeType
    });
  } catch (e) {
    try {
      // deprecated, browser only, old way
      var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
      var builder = new Builder();
      builder.append(buffer);
      return builder.getBlob(mimeType);
    } catch (e) {
      // well, fuck ?!
      throw new Error("Bug : can't construct the Blob.");
    }
  }
};
/**
 * The identity function.
 * @param {Object} input the input.
 * @return {Object} the same input.
 */
function identity(input) {
  return input;
}

/**
 * Fill in an array with a string.
 * @param {String} str the string to use.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
 */
function stringToArrayLike(str, array) {
  for (var i = 0; i < str.length; ++i) {
    array[i] = str.charCodeAt(i) & 0xff;
  }
  return array;
}

/**
 * Transform an array-like object to a string.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
 * @return {String} the result.
 */
function arrayLikeToString(array) {
  // Performances notes :
  // --------------------
  // String.fromCharCode.apply(null, array) is the fastest, see
  // see http://jsperf.com/converting-a-uint8array-to-a-string/2
  // but the stack is limited (and we can get huge arrays !).
  //
  // result += String.fromCharCode(array[i]); generate too many strings !
  //
  // This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
  var chunk = 65536;
  var result = [],
    len = array.length,
    type = exports.getTypeOf(array);
  var k = 0,
    canUseApply = true;
  try {
    switch (type) {
      case "uint8array":
        String.fromCharCode.apply(null, new Uint8Array(0));
        break;
      case "nodebuffer":
        String.fromCharCode.apply(null, nodeBuffer(0));
        break;
    }
  } catch (e) {
    canUseApply = false;
  }

  // no apply : slow and painful algorithm
  // default browser on android 4.*
  if (!canUseApply) {
    var resultStr = "";
    for (var i = 0; i < array.length; i++) {
      resultStr += String.fromCharCode(array[i]);
    }
    return resultStr;
  }
  while (k < len && chunk > 1) {
    try {
      if (type === "array" || type === "nodebuffer") {
        result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
      } else {
        result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
      }
      k += chunk;
    } catch (e) {
      chunk = Math.floor(chunk / 2);
    }
  }
  return result.join("");
}
exports.applyFromCharCode = arrayLikeToString;

/**
 * Copy the data from an array-like to an other array-like.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
 */
function arrayLikeToArrayLike(arrayFrom, arrayTo) {
  for (var i = 0; i < arrayFrom.length; i++) {
    arrayTo[i] = arrayFrom[i];
  }
  return arrayTo;
}

// a matrix containing functions to transform everything into everything.
var transform = {};

// string to ?
transform.string = {
  string: identity,
  array: function array(input) {
    return stringToArrayLike(input, new Array(input.length));
  },
  arraybuffer: function arraybuffer(input) {
    return transform.string.uint8array(input).buffer;
  },
  uint8array: function uint8array(input) {
    return stringToArrayLike(input, new Uint8Array(input.length));
  },
  nodebuffer: function nodebuffer(input) {
    return stringToArrayLike(input, nodeBuffer(input.length));
  }
};

// array to ?
transform.array = {
  string: arrayLikeToString,
  array: identity,
  arraybuffer: function arraybuffer(input) {
    return new Uint8Array(input).buffer;
  },
  uint8array: function uint8array(input) {
    return new Uint8Array(input);
  },
  nodebuffer: function nodebuffer(input) {
    return nodeBuffer(input);
  }
};

// arraybuffer to ?
transform.arraybuffer = {
  string: function string(input) {
    return arrayLikeToString(new Uint8Array(input));
  },
  array: function array(input) {
    return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
  },
  arraybuffer: identity,
  uint8array: function uint8array(input) {
    return new Uint8Array(input);
  },
  nodebuffer: function nodebuffer(input) {
    return nodeBuffer(new Uint8Array(input));
  }
};

// uint8array to ?
transform.uint8array = {
  string: arrayLikeToString,
  array: function array(input) {
    return arrayLikeToArrayLike(input, new Array(input.length));
  },
  arraybuffer: function arraybuffer(input) {
    return input.buffer;
  },
  uint8array: identity,
  nodebuffer: function nodebuffer(input) {
    return nodeBuffer(input);
  }
};

// nodebuffer to ?
transform.nodebuffer = {
  string: arrayLikeToString,
  array: function array(input) {
    return arrayLikeToArrayLike(input, new Array(input.length));
  },
  arraybuffer: function arraybuffer(input) {
    return transform.nodebuffer.uint8array(input).buffer;
  },
  uint8array: function uint8array(input) {
    return arrayLikeToArrayLike(input, new Uint8Array(input.length));
  },
  nodebuffer: identity
};

/**
 * Transform an input into any type.
 * The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
 * If no output type is specified, the unmodified input will be returned.
 * @param {String} outputType the output type.
 * @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
 * @throws {Error} an Error if the browser doesn't support the requested output type.
 */
exports.transformTo = function (outputType, input) {
  if (!input) {
    // undefined, null, etc
    // an empty string won't harm.
    input = "";
  }
  if (!outputType) {
    return input;
  }
  exports.checkSupport(outputType);
  var inputType = exports.getTypeOf(input);
  var result = transform[inputType][outputType](input);
  return result;
};

/**
 * Return the type of the input.
 * The type will be in a format valid for PizZip.utils.transformTo : string, array, uint8array, arraybuffer.
 * @param {Object} input the input to identify.
 * @return {String} the (lowercase) type of the input.
 */
exports.getTypeOf = function (input) {
  if (input == null) {
    return;
  }
  if (typeof input === "string") {
    return "string";
  }
  var protoResult = Object.prototype.toString.call(input);
  if (protoResult === "[object Array]") {
    return "array";
  }
  if (support.nodebuffer && nodeBuffer.test(input)) {
    return "nodebuffer";
  }
  if (support.uint8array && protoResult === "[object Uint8Array]") {
    return "uint8array";
  }
  if (support.arraybuffer && protoResult === "[object ArrayBuffer]") {
    return "arraybuffer";
  }
  if (protoResult === "[object Promise]") {
    throw new Error("Cannot read data from a promise, you probably are running new PizZip(data) with a promise");
  }
  if (_typeof(input) === "object" && typeof input.file === "function") {
    throw new Error("Cannot read data from a pizzip instance, you probably are running new PizZip(zip) with a zipinstance");
  }
  if (protoResult === "[object Date]") {
    throw new Error("Cannot read data from a Date, you probably are running new PizZip(data) with a date");
  }
  if (_typeof(input) === "object" && input.crc32 == null) {
    throw new Error("Unsupported data given to new PizZip(data) (object given)");
  }
};

/**
 * Throw an exception if the type is not supported.
 * @param {String} type the type to check.
 * @throws {Error} an Error if the browser doesn't support the requested type.
 */
exports.checkSupport = function (type) {
  var supported = support[type.toLowerCase()];
  if (!supported) {
    throw new Error(type + " is not supported by this browser");
  }
};
exports.MAX_VALUE_16BITS = 65535;
exports.MAX_VALUE_32BITS = -1; // well, "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF" is parsed as -1

/**
 * Prettify a string read as binary.
 * @param {string} str the string to prettify.
 * @return {string} a pretty string.
 */
exports.pretty = function (str) {
  var res = "",
    code,
    i;
  for (i = 0; i < (str || "").length; i++) {
    code = str.charCodeAt(i);
    res += "\\x" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
  }
  return res;
};

/**
 * Find a compression registered in PizZip.
 * @param {string} compressionMethod the method magic to find.
 * @return {Object|null} the PizZip compression object, null if none found.
 */
exports.findCompression = function (compressionMethod) {
  for (var method in compressions) {
    if (!compressions.hasOwnProperty(method)) {
      continue;
    }
    if (compressions[method].magic === compressionMethod) {
      return compressions[method];
    }
  }
  return null;
};
/**
 * Cross-window, cross-Node-context regular expression detection
 * @param  {Object}  object Anything
 * @return {Boolean}        true if the object is a regular expression,
 * false otherwise
 */
exports.isRegExp = function (object) {
  return Object.prototype.toString.call(object) === "[object RegExp]";
};

/**
 * Merge the objects passed as parameters into a new one.
 * @private
 * @param {...Object} var_args All objects to merge.
 * @return {Object} a new object with the data of the others.
 */
exports.extend = function () {
  var result = {};
  var i, attr;
  for (i = 0; i < arguments.length; i++) {
    // arguments is not enumerable in some browsers
    for (attr in arguments[i]) {
      if (arguments[i].hasOwnProperty(attr) && typeof result[attr] === "undefined") {
        result[attr] = arguments[i][attr];
      }
    }
  }
  return result;
};

;

/***/ }),

/***/ "./es6/zipEntries.js":
/*!***************************!*\
  !*** ./es6/zipEntries.js ***!
  \***************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var StringReader = __webpack_require__(/*! ./stringReader.js */ "./es6/stringReader.js");
var NodeBufferReader = __webpack_require__(/*! ./nodeBufferReader.js */ "./es6/nodeBufferReader.js");
var Uint8ArrayReader = __webpack_require__(/*! ./uint8ArrayReader.js */ "./es6/uint8ArrayReader.js");
var ArrayReader = __webpack_require__(/*! ./arrayReader.js */ "./es6/arrayReader.js");
var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");
var sig = __webpack_require__(/*! ./signature.js */ "./es6/signature.js");
var ZipEntry = __webpack_require__(/*! ./zipEntry.js */ "./es6/zipEntry.js");
var support = __webpack_require__(/*! ./support.js */ "./es6/support.js");
//  class ZipEntries {{{
/**
 * All the entries in the zip file.
 * @constructor
 * @param {String|ArrayBuffer|Uint8Array} data the binary stream to load.
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntries(data, loadOptions) {
  this.files = [];
  this.loadOptions = loadOptions;
  if (data) {
    this.load(data);
  }
}
ZipEntries.prototype = {
  /**
   * Check that the reader is on the speficied signature.
   * @param {string} expectedSignature the expected signature.
   * @throws {Error} if it is an other signature.
   */
  checkSignature: function checkSignature(expectedSignature) {
    var signature = this.reader.readString(4);
    if (signature !== expectedSignature) {
      throw new Error("Corrupted zip or bug : unexpected signature " + "(" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
    }
  },
  /**
   * Check if the given signature is at the given index.
   * @param {number} askedIndex the index to check.
   * @param {string} expectedSignature the signature to expect.
   * @return {boolean} true if the signature is here, false otherwise.
   */
  isSignature: function isSignature(askedIndex, expectedSignature) {
    var currentIndex = this.reader.index;
    this.reader.setIndex(askedIndex);
    var signature = this.reader.readString(4);
    var result = signature === expectedSignature;
    this.reader.setIndex(currentIndex);
    return result;
  },
  /**
   * Read the end of the central directory.
   */
  readBlockEndOfCentral: function readBlockEndOfCentral() {
    this.diskNumber = this.reader.readInt(2);
    this.diskWithCentralDirStart = this.reader.readInt(2);
    this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
    this.centralDirRecords = this.reader.readInt(2);
    this.centralDirSize = this.reader.readInt(4);
    this.centralDirOffset = this.reader.readInt(4);
    this.zipCommentLength = this.reader.readInt(2);
    // warning : the encoding depends of the system locale
    // On a linux machine with LANG=en_US.utf8, this field is utf8 encoded.
    // On a windows machine, this field is encoded with the localized windows code page.
    var zipComment = this.reader.readData(this.zipCommentLength);
    var decodeParamType = support.uint8array ? "uint8array" : "array";
    // To get consistent behavior with the generation part, we will assume that
    // this is utf8 encoded unless specified otherwise.
    var decodeContent = utils.transformTo(decodeParamType, zipComment);
    this.zipComment = this.loadOptions.decodeFileName(decodeContent);
  },
  /**
   * Read the end of the Zip 64 central directory.
   * Not merged with the method readEndOfCentral :
   * The end of central can coexist with its Zip64 brother,
   * I don't want to read the wrong number of bytes !
   */
  readBlockZip64EndOfCentral: function readBlockZip64EndOfCentral() {
    this.zip64EndOfCentralSize = this.reader.readInt(8);
    this.versionMadeBy = this.reader.readString(2);
    this.versionNeeded = this.reader.readInt(2);
    this.diskNumber = this.reader.readInt(4);
    this.diskWithCentralDirStart = this.reader.readInt(4);
    this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
    this.centralDirRecords = this.reader.readInt(8);
    this.centralDirSize = this.reader.readInt(8);
    this.centralDirOffset = this.reader.readInt(8);
    this.zip64ExtensibleData = {};
    var extraDataSize = this.zip64EndOfCentralSize - 44;
    var index = 0;
    var extraFieldId, extraFieldLength, extraFieldValue;
    while (index < extraDataSize) {
      extraFieldId = this.reader.readInt(2);
      extraFieldLength = this.reader.readInt(4);
      extraFieldValue = this.reader.readString(extraFieldLength);
      this.zip64ExtensibleData[extraFieldId] = {
        id: extraFieldId,
        length: extraFieldLength,
        value: extraFieldValue
      };
    }
  },
  /**
   * Read the end of the Zip 64 central directory locator.
   */
  readBlockZip64EndOfCentralLocator: function readBlockZip64EndOfCentralLocator() {
    this.diskWithZip64CentralDirStart = this.reader.readInt(4);
    this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
    this.disksCount = this.reader.readInt(4);
    if (this.disksCount > 1) {
      throw new Error("Multi-volumes zip are not supported");
    }
  },
  /**
   * Read the local files, based on the offset read in the central part.
   */
  readLocalFiles: function readLocalFiles() {
    var i, file;
    for (i = 0; i < this.files.length; i++) {
      file = this.files[i];
      this.reader.setIndex(file.localHeaderOffset);
      this.checkSignature(sig.LOCAL_FILE_HEADER);
      file.readLocalPart(this.reader);
      file.handleUTF8();
      file.processAttributes();
    }
  },
  /**
   * Read the central directory.
   */
  readCentralDir: function readCentralDir() {
    var file;
    this.reader.setIndex(this.centralDirOffset);
    while (this.reader.readString(4) === sig.CENTRAL_FILE_HEADER) {
      file = new ZipEntry({
        zip64: this.zip64
      }, this.loadOptions);
      file.readCentralPart(this.reader);
      this.files.push(file);
    }
    if (this.centralDirRecords !== this.files.length) {
      if (this.centralDirRecords !== 0 && this.files.length === 0) {
        // We expected some records but couldn't find ANY.
        // This is really suspicious, as if something went wrong.
        throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
      } else {
        // We found some records but not all.
        // Something is wrong but we got something for the user: no error here.
        // console.warn("expected", this.centralDirRecords, "records in central dir, got", this.files.length);
      }
    }
  },
  /**
   * Read the end of central directory.
   */
  readEndOfCentral: function readEndOfCentral() {
    var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
    if (offset < 0) {
      // Check if the content is a truncated zip or complete garbage.
      // A "LOCAL_FILE_HEADER" is not required at the beginning (auto
      // extractible zip for example) but it can give a good hint.
      // If an ajax request was used without responseType, we will also
      // get unreadable data.
      var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);
      if (isGarbage) {
        throw new Error("Can't find end of central directory : is this a zip file ?");
      } else {
        throw new Error("Corrupted zip : can't find end of central directory");
      }
    }
    this.reader.setIndex(offset);
    var endOfCentralDirOffset = offset;
    this.checkSignature(sig.CENTRAL_DIRECTORY_END);
    this.readBlockEndOfCentral();

    /* extract from the zip spec :
              4)  If one of the fields in the end of central directory
                  record is too small to hold required data, the field
                  should be set to -1 (0xFFFF or 0xFFFFFFFF) and the
                  ZIP64 format record should be created.
              5)  The end of central directory record and the
                  Zip64 end of central directory locator record must
                  reside on the same disk when splitting or spanning
                  an archive.
           */
    if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
      this.zip64 = true;

      /*
               Warning : the zip64 extension is supported, but ONLY if the 64bits integer read from
               the zip file can fit into a 32bits integer. This cannot be solved : Javascript represents
               all numbers as 64-bit double precision IEEE 754 floating point numbers.
               So, we have 53bits for integers and bitwise operations treat everything as 32bits.
               see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
               and http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf section 8.5
               */

      // should look for a zip64 EOCD locator
      offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
      if (offset < 0) {
        throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
      }
      this.reader.setIndex(offset);
      this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
      this.readBlockZip64EndOfCentralLocator();

      // now the zip64 EOCD record
      if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
        // console.warn("ZIP64 end of central directory not where expected.");
        this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
        if (this.relativeOffsetEndOfZip64CentralDir < 0) {
          throw new Error("Corrupted zip : can't find the ZIP64 end of central directory");
        }
      }
      this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
      this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
      this.readBlockZip64EndOfCentral();
    }
    var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
    if (this.zip64) {
      expectedEndOfCentralDirOffset += 20; // end of central dir 64 locator
      expectedEndOfCentralDirOffset += 12 /* should not include the leading 12 bytes */ + this.zip64EndOfCentralSize;
    }
    var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;
    if (extraBytes > 0) {
      // console.warn(extraBytes, "extra bytes at beginning or within zipfile");
      if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {
        // The offsets seem wrong, but we have something at the specified offset.
        // So… we keep it.
      } else {
        // the offset is wrong, update the "zero" of the reader
        // this happens if data has been prepended (crx files for example)
        this.reader.zero = extraBytes;
      }
    } else if (extraBytes < 0) {
      throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
    }
  },
  prepareReader: function prepareReader(data) {
    var type = utils.getTypeOf(data);
    utils.checkSupport(type);
    if (type === "string" && !support.uint8array) {
      this.reader = new StringReader(data, this.loadOptions.optimizedBinaryString);
    } else if (type === "nodebuffer") {
      this.reader = new NodeBufferReader(data);
    } else if (support.uint8array) {
      this.reader = new Uint8ArrayReader(utils.transformTo("uint8array", data));
    } else if (support.array) {
      this.reader = new ArrayReader(utils.transformTo("array", data));
    } else {
      throw new Error("Unexpected error: unsupported type '" + type + "'");
    }
  },
  /**
   * Read a zip file and create ZipEntries.
   * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
   */
  load: function load(data) {
    this.prepareReader(data);
    this.readEndOfCentral();
    this.readCentralDir();
    this.readLocalFiles();
  }
};
// }}} end of ZipEntries
module.exports = ZipEntries;

;

/***/ }),

/***/ "./es6/zipEntry.js":
/*!*************************!*\
  !*** ./es6/zipEntry.js ***!
  \*************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var StringReader = __webpack_require__(/*! ./stringReader.js */ "./es6/stringReader.js");
var utils = __webpack_require__(/*! ./utils.js */ "./es6/utils.js");
var CompressedObject = __webpack_require__(/*! ./compressedObject.js */ "./es6/compressedObject.js");
var pizzipProto = __webpack_require__(/*! ./object.js */ "./es6/object.js");
var support = __webpack_require__(/*! ./support.js */ "./es6/support.js");
var MADE_BY_DOS = 0x00;
var MADE_BY_UNIX = 0x03;

// class ZipEntry {{{
/**
 * An entry in the zip file.
 * @constructor
 * @param {Object} options Options of the current file.
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntry(options, loadOptions) {
  this.options = options;
  this.loadOptions = loadOptions;
}
ZipEntry.prototype = {
  /**
   * say if the file is encrypted.
   * @return {boolean} true if the file is encrypted, false otherwise.
   */
  isEncrypted: function isEncrypted() {
    // bit 1 is set
    return (this.bitFlag & 0x0001) === 0x0001;
  },
  /**
   * say if the file has utf-8 filename/comment.
   * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
   */
  useUTF8: function useUTF8() {
    // bit 11 is set
    return (this.bitFlag & 0x0800) === 0x0800;
  },
  /**
   * Prepare the function used to generate the compressed content from this ZipFile.
   * @param {DataReader} reader the reader to use.
   * @param {number} from the offset from where we should read the data.
   * @param {number} length the length of the data to read.
   * @return {Function} the callback to get the compressed content (the type depends of the DataReader class).
   */
  prepareCompressedContent: function prepareCompressedContent(reader, from, length) {
    return function () {
      var previousIndex = reader.index;
      reader.setIndex(from);
      var compressedFileData = reader.readData(length);
      reader.setIndex(previousIndex);
      return compressedFileData;
    };
  },
  /**
   * Prepare the function used to generate the uncompressed content from this ZipFile.
   * @param {DataReader} reader the reader to use.
   * @param {number} from the offset from where we should read the data.
   * @param {number} length the length of the data to read.
   * @param {PizZip.compression} compression the compression used on this file.
   * @param {number} uncompressedSize the uncompressed size to expect.
   * @return {Function} the callback to get the uncompressed content (the type depends of the DataReader class).
   */
  prepareContent: function prepareContent(reader, from, length, compression, uncompressedSize) {
    return function () {
      var compressedFileData = utils.transformTo(compression.uncompressInputType, this.getCompressedContent());
      var uncompressedFileData = compression.uncompress(compressedFileData);
      if (uncompressedFileData.length !== uncompressedSize) {
        throw new Error("Bug : uncompressed data size mismatch");
      }
      return uncompressedFileData;
    };
  },
  /**
   * Read the local part of a zip file and add the info in this object.
   * @param {DataReader} reader the reader to use.
   */
  readLocalPart: function readLocalPart(reader) {
    // we already know everything from the central dir !
    // If the central dir data are false, we are doomed.
    // On the bright side, the local part is scary  : zip64, data descriptors, both, etc.
    // The less data we get here, the more reliable this should be.
    // Let's skip the whole header and dash to the data !
    reader.skip(22);
    // in some zip created on windows, the filename stored in the central dir contains \ instead of /.
    // Strangely, the filename here is OK.
    // I would love to treat these zip files as corrupted (see http://www.info-zip.org/FAQ.html#backslashes
    // or APPNOTE#4.4.17.1, "All slashes MUST be forward slashes '/'") but there are a lot of bad zip generators...
    // Search "unzip mismatching "local" filename continuing with "central" filename version" on
    // the internet.
    //
    // I think I see the logic here : the central directory is used to display
    // content and the local directory is used to extract the files. Mixing / and \
    // may be used to display \ to windows users and use / when extracting the files.
    // Unfortunately, this lead also to some issues : http://seclists.org/fulldisclosure/2009/Sep/394
    this.fileNameLength = reader.readInt(2);
    var localExtraFieldsLength = reader.readInt(2); // can't be sure this will be the same as the central dir
    this.fileName = reader.readData(this.fileNameLength);
    reader.skip(localExtraFieldsLength);
    if (this.compressedSize === -1 || this.uncompressedSize === -1) {
      throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory " + "(compressedSize == -1 || uncompressedSize == -1)");
    }
    var compression = utils.findCompression(this.compressionMethod);
    if (compression === null) {
      // no compression found
      throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
    }
    this.decompressed = new CompressedObject();
    this.decompressed.compressedSize = this.compressedSize;
    this.decompressed.uncompressedSize = this.uncompressedSize;
    this.decompressed.crc32 = this.crc32;
    this.decompressed.compressionMethod = this.compressionMethod;
    this.decompressed.getCompressedContent = this.prepareCompressedContent(reader, reader.index, this.compressedSize, compression);
    this.decompressed.getContent = this.prepareContent(reader, reader.index, this.compressedSize, compression, this.uncompressedSize);

    // we need to compute the crc32...
    if (this.loadOptions.checkCRC32) {
      this.decompressed = utils.transformTo("string", this.decompressed.getContent());
      if (pizzipProto.crc32(this.decompressed) !== this.crc32) {
        throw new Error("Corrupted zip : CRC32 mismatch");
      }
    }
  },
  /**
   * Read the central part of a zip file and add the info in this object.
   * @param {DataReader} reader the reader to use.
   */
  readCentralPart: function readCentralPart(reader) {
    this.versionMadeBy = reader.readInt(2);
    this.versionNeeded = reader.readInt(2);
    this.bitFlag = reader.readInt(2);
    this.compressionMethod = reader.readString(2);
    this.date = reader.readDate();
    this.crc32 = reader.readInt(4);
    this.compressedSize = reader.readInt(4);
    this.uncompressedSize = reader.readInt(4);
    this.fileNameLength = reader.readInt(2);
    this.extraFieldsLength = reader.readInt(2);
    this.fileCommentLength = reader.readInt(2);
    this.diskNumberStart = reader.readInt(2);
    this.internalFileAttributes = reader.readInt(2);
    this.externalFileAttributes = reader.readInt(4);
    this.localHeaderOffset = reader.readInt(4);
    if (this.isEncrypted()) {
      throw new Error("Encrypted zip are not supported");
    }
    this.fileName = reader.readData(this.fileNameLength);
    this.readExtraFields(reader);
    this.parseZIP64ExtraField(reader);
    this.fileComment = reader.readData(this.fileCommentLength);
  },
  /**
   * Parse the external file attributes and get the unix/dos permissions.
   */
  processAttributes: function processAttributes() {
    this.unixPermissions = null;
    this.dosPermissions = null;
    var madeBy = this.versionMadeBy >> 8;

    // Check if we have the DOS directory flag set.
    // We look for it in the DOS and UNIX permissions
    // but some unknown platform could set it as a compatibility flag.
    this.dir = !!(this.externalFileAttributes & 0x0010);
    if (madeBy === MADE_BY_DOS) {
      // first 6 bits (0 to 5)
      this.dosPermissions = this.externalFileAttributes & 0x3f;
    }
    if (madeBy === MADE_BY_UNIX) {
      this.unixPermissions = this.externalFileAttributes >> 16 & 0xffff;
      // the octal permissions are in (this.unixPermissions & 0x01FF).toString(8);
    }

    // fail safe : if the name ends with a / it probably means a folder
    if (!this.dir && this.fileNameStr.slice(-1) === "/") {
      this.dir = true;
    }
  },
  /**
   * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
   */
  parseZIP64ExtraField: function parseZIP64ExtraField() {
    if (!this.extraFields[0x0001]) {
      return;
    }

    // should be something, preparing the extra reader
    var extraReader = new StringReader(this.extraFields[0x0001].value);

    // I really hope that these 64bits integer can fit in 32 bits integer, because js
    // won't let us have more.
    if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
      this.uncompressedSize = extraReader.readInt(8);
    }
    if (this.compressedSize === utils.MAX_VALUE_32BITS) {
      this.compressedSize = extraReader.readInt(8);
    }
    if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
      this.localHeaderOffset = extraReader.readInt(8);
    }
    if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
      this.diskNumberStart = extraReader.readInt(4);
    }
  },
  /**
   * Read the central part of a zip file and add the info in this object.
   * @param {DataReader} reader the reader to use.
   */
  readExtraFields: function readExtraFields(reader) {
    var start = reader.index;
    var extraFieldId, extraFieldLength, extraFieldValue;
    this.extraFields = this.extraFields || {};
    while (reader.index < start + this.extraFieldsLength) {
      extraFieldId = reader.readInt(2);
      extraFieldLength = reader.readInt(2);
      extraFieldValue = reader.readString(extraFieldLength);
      this.extraFields[extraFieldId] = {
        id: extraFieldId,
        length: extraFieldLength,
        value: extraFieldValue
      };
    }
  },
  /**
   * Apply an UTF8 transformation if needed.
   */
  handleUTF8: function handleUTF8() {
    var decodeParamType = support.uint8array ? "uint8array" : "array";
    if (this.useUTF8()) {
      this.fileNameStr = pizzipProto.utf8decode(this.fileName);
      this.fileCommentStr = pizzipProto.utf8decode(this.fileComment);
    } else {
      var upath = this.findExtraFieldUnicodePath();
      if (upath !== null) {
        this.fileNameStr = upath;
      } else {
        var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
        this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
      }
      var ucomment = this.findExtraFieldUnicodeComment();
      if (ucomment !== null) {
        this.fileCommentStr = ucomment;
      } else {
        var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
        this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
      }
    }
  },
  /**
   * Find the unicode path declared in the extra field, if any.
   * @return {String} the unicode path, null otherwise.
   */
  findExtraFieldUnicodePath: function findExtraFieldUnicodePath() {
    var upathField = this.extraFields[0x7075];
    if (upathField) {
      var extraReader = new StringReader(upathField.value);

      // wrong version
      if (extraReader.readInt(1) !== 1) {
        return null;
      }

      // the crc of the filename changed, this field is out of date.
      if (pizzipProto.crc32(this.fileName) !== extraReader.readInt(4)) {
        return null;
      }
      return pizzipProto.utf8decode(extraReader.readString(upathField.length - 5));
    }
    return null;
  },
  /**
   * Find the unicode comment declared in the extra field, if any.
   * @return {String} the unicode comment, null otherwise.
   */
  findExtraFieldUnicodeComment: function findExtraFieldUnicodeComment() {
    var ucommentField = this.extraFields[0x6375];
    if (ucommentField) {
      var extraReader = new StringReader(ucommentField.value);

      // wrong version
      if (extraReader.readInt(1) !== 1) {
        return null;
      }

      // the crc of the comment changed, this field is out of date.
      if (pizzipProto.crc32(this.fileComment) !== extraReader.readInt(4)) {
        return null;
      }
      return pizzipProto.utf8decode(extraReader.readString(ucommentField.length - 5));
    }
    return null;
  }
};
module.exports = ZipEntry;

;

/***/ }),

/***/ "./node_modules/pako/dist/pako.es5.min.js":
/*!************************************************!*\
  !*** ./node_modules/pako/dist/pako.es5.min.js ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports) {

/*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) */
!function(t,e){ true?e(exports):0}(this,(function(t){"use strict";function e(t){for(var e=t.length;--e>=0;)t[e]=0}var a=256,n=286,i=30,r=15,s=new Uint8Array([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0]),o=new Uint8Array([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]),l=new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7]),h=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),d=new Array(576);e(d);var _=new Array(60);e(_);var f=new Array(512);e(f);var u=new Array(256);e(u);var c=new Array(29);e(c);var w,m,b,g=new Array(i);function p(t,e,a,n,i){this.static_tree=t,this.extra_bits=e,this.extra_base=a,this.elems=n,this.max_length=i,this.has_stree=t&&t.length}function v(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e}e(g);var k=function(t){return t<256?f[t]:f[256+(t>>>7)]},y=function(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255},x=function(t,e,a){t.bi_valid>16-a?(t.bi_buf|=e<<t.bi_valid&65535,y(t,t.bi_buf),t.bi_buf=e>>16-t.bi_valid,t.bi_valid+=a-16):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=a)},z=function(t,e,a){x(t,a[2*e],a[2*e+1])},A=function(t,e){var a=0;do{a|=1&t,t>>>=1,a<<=1}while(--e>0);return a>>>1},E=function(t,e,a){var n,i,s=new Array(16),o=0;for(n=1;n<=r;n++)o=o+a[n-1]<<1,s[n]=o;for(i=0;i<=e;i++){var l=t[2*i+1];0!==l&&(t[2*i]=A(s[l]++,l))}},R=function(t){var e;for(e=0;e<n;e++)t.dyn_ltree[2*e]=0;for(e=0;e<i;e++)t.dyn_dtree[2*e]=0;for(e=0;e<19;e++)t.bl_tree[2*e]=0;t.dyn_ltree[512]=1,t.opt_len=t.static_len=0,t.sym_next=t.matches=0},Z=function(t){t.bi_valid>8?y(t,t.bi_buf):t.bi_valid>0&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0},S=function(t,e,a,n){var i=2*e,r=2*a;return t[i]<t[r]||t[i]===t[r]&&n[e]<=n[a]},U=function(t,e,a){for(var n=t.heap[a],i=a<<1;i<=t.heap_len&&(i<t.heap_len&&S(e,t.heap[i+1],t.heap[i],t.depth)&&i++,!S(e,n,t.heap[i],t.depth));)t.heap[a]=t.heap[i],a=i,i<<=1;t.heap[a]=n},D=function(t,e,n){var i,r,l,h,d=0;if(0!==t.sym_next)do{i=255&t.pending_buf[t.sym_buf+d++],i+=(255&t.pending_buf[t.sym_buf+d++])<<8,r=t.pending_buf[t.sym_buf+d++],0===i?z(t,r,e):(l=u[r],z(t,l+a+1,e),0!==(h=s[l])&&(r-=c[l],x(t,r,h)),i--,l=k(i),z(t,l,n),0!==(h=o[l])&&(i-=g[l],x(t,i,h)))}while(d<t.sym_next);z(t,256,e)},T=function(t,e){var a,n,i,s=e.dyn_tree,o=e.stat_desc.static_tree,l=e.stat_desc.has_stree,h=e.stat_desc.elems,d=-1;for(t.heap_len=0,t.heap_max=573,a=0;a<h;a++)0!==s[2*a]?(t.heap[++t.heap_len]=d=a,t.depth[a]=0):s[2*a+1]=0;for(;t.heap_len<2;)s[2*(i=t.heap[++t.heap_len]=d<2?++d:0)]=1,t.depth[i]=0,t.opt_len--,l&&(t.static_len-=o[2*i+1]);for(e.max_code=d,a=t.heap_len>>1;a>=1;a--)U(t,s,a);i=h;do{a=t.heap[1],t.heap[1]=t.heap[t.heap_len--],U(t,s,1),n=t.heap[1],t.heap[--t.heap_max]=a,t.heap[--t.heap_max]=n,s[2*i]=s[2*a]+s[2*n],t.depth[i]=(t.depth[a]>=t.depth[n]?t.depth[a]:t.depth[n])+1,s[2*a+1]=s[2*n+1]=i,t.heap[1]=i++,U(t,s,1)}while(t.heap_len>=2);t.heap[--t.heap_max]=t.heap[1],function(t,e){var a,n,i,s,o,l,h=e.dyn_tree,d=e.max_code,_=e.stat_desc.static_tree,f=e.stat_desc.has_stree,u=e.stat_desc.extra_bits,c=e.stat_desc.extra_base,w=e.stat_desc.max_length,m=0;for(s=0;s<=r;s++)t.bl_count[s]=0;for(h[2*t.heap[t.heap_max]+1]=0,a=t.heap_max+1;a<573;a++)(s=h[2*h[2*(n=t.heap[a])+1]+1]+1)>w&&(s=w,m++),h[2*n+1]=s,n>d||(t.bl_count[s]++,o=0,n>=c&&(o=u[n-c]),l=h[2*n],t.opt_len+=l*(s+o),f&&(t.static_len+=l*(_[2*n+1]+o)));if(0!==m){do{for(s=w-1;0===t.bl_count[s];)s--;t.bl_count[s]--,t.bl_count[s+1]+=2,t.bl_count[w]--,m-=2}while(m>0);for(s=w;0!==s;s--)for(n=t.bl_count[s];0!==n;)(i=t.heap[--a])>d||(h[2*i+1]!==s&&(t.opt_len+=(s-h[2*i+1])*h[2*i],h[2*i+1]=s),n--)}}(t,e),E(s,d,t.bl_count)},O=function(t,e,a){var n,i,r=-1,s=e[1],o=0,l=7,h=4;for(0===s&&(l=138,h=3),e[2*(a+1)+1]=65535,n=0;n<=a;n++)i=s,s=e[2*(n+1)+1],++o<l&&i===s||(o<h?t.bl_tree[2*i]+=o:0!==i?(i!==r&&t.bl_tree[2*i]++,t.bl_tree[32]++):o<=10?t.bl_tree[34]++:t.bl_tree[36]++,o=0,r=i,0===s?(l=138,h=3):i===s?(l=6,h=3):(l=7,h=4))},I=function(t,e,a){var n,i,r=-1,s=e[1],o=0,l=7,h=4;for(0===s&&(l=138,h=3),n=0;n<=a;n++)if(i=s,s=e[2*(n+1)+1],!(++o<l&&i===s)){if(o<h)do{z(t,i,t.bl_tree)}while(0!=--o);else 0!==i?(i!==r&&(z(t,i,t.bl_tree),o--),z(t,16,t.bl_tree),x(t,o-3,2)):o<=10?(z(t,17,t.bl_tree),x(t,o-3,3)):(z(t,18,t.bl_tree),x(t,o-11,7));o=0,r=i,0===s?(l=138,h=3):i===s?(l=6,h=3):(l=7,h=4)}},F=!1,L=function(t,e,a,n){x(t,0+(n?1:0),3),Z(t),y(t,a),y(t,~a),a&&t.pending_buf.set(t.window.subarray(e,e+a),t.pending),t.pending+=a},N=function(t,e,n,i){var r,s,o=0;t.level>0?(2===t.strm.data_type&&(t.strm.data_type=function(t){var e,n=4093624447;for(e=0;e<=31;e++,n>>>=1)if(1&n&&0!==t.dyn_ltree[2*e])return 0;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return 1;for(e=32;e<a;e++)if(0!==t.dyn_ltree[2*e])return 1;return 0}(t)),T(t,t.l_desc),T(t,t.d_desc),o=function(t){var e;for(O(t,t.dyn_ltree,t.l_desc.max_code),O(t,t.dyn_dtree,t.d_desc.max_code),T(t,t.bl_desc),e=18;e>=3&&0===t.bl_tree[2*h[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e}(t),r=t.opt_len+3+7>>>3,(s=t.static_len+3+7>>>3)<=r&&(r=s)):r=s=n+5,n+4<=r&&-1!==e?L(t,e,n,i):4===t.strategy||s===r?(x(t,2+(i?1:0),3),D(t,d,_)):(x(t,4+(i?1:0),3),function(t,e,a,n){var i;for(x(t,e-257,5),x(t,a-1,5),x(t,n-4,4),i=0;i<n;i++)x(t,t.bl_tree[2*h[i]+1],3);I(t,t.dyn_ltree,e-1),I(t,t.dyn_dtree,a-1)}(t,t.l_desc.max_code+1,t.d_desc.max_code+1,o+1),D(t,t.dyn_ltree,t.dyn_dtree)),R(t),i&&Z(t)},B={_tr_init:function(t){F||(!function(){var t,e,a,h,v,k=new Array(16);for(a=0,h=0;h<28;h++)for(c[h]=a,t=0;t<1<<s[h];t++)u[a++]=h;for(u[a-1]=h,v=0,h=0;h<16;h++)for(g[h]=v,t=0;t<1<<o[h];t++)f[v++]=h;for(v>>=7;h<i;h++)for(g[h]=v<<7,t=0;t<1<<o[h]-7;t++)f[256+v++]=h;for(e=0;e<=r;e++)k[e]=0;for(t=0;t<=143;)d[2*t+1]=8,t++,k[8]++;for(;t<=255;)d[2*t+1]=9,t++,k[9]++;for(;t<=279;)d[2*t+1]=7,t++,k[7]++;for(;t<=287;)d[2*t+1]=8,t++,k[8]++;for(E(d,287,k),t=0;t<i;t++)_[2*t+1]=5,_[2*t]=A(t,5);w=new p(d,s,257,n,r),m=new p(_,o,0,i,r),b=new p(new Array(0),l,0,19,7)}(),F=!0),t.l_desc=new v(t.dyn_ltree,w),t.d_desc=new v(t.dyn_dtree,m),t.bl_desc=new v(t.bl_tree,b),t.bi_buf=0,t.bi_valid=0,R(t)},_tr_stored_block:L,_tr_flush_block:N,_tr_tally:function(t,e,n){return t.pending_buf[t.sym_buf+t.sym_next++]=e,t.pending_buf[t.sym_buf+t.sym_next++]=e>>8,t.pending_buf[t.sym_buf+t.sym_next++]=n,0===e?t.dyn_ltree[2*n]++:(t.matches++,e--,t.dyn_ltree[2*(u[n]+a+1)]++,t.dyn_dtree[2*k(e)]++),t.sym_next===t.sym_end},_tr_align:function(t){x(t,2,3),z(t,256,d),function(t){16===t.bi_valid?(y(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):t.bi_valid>=8&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8)}(t)}},C=function(t,e,a,n){for(var i=65535&t|0,r=t>>>16&65535|0,s=0;0!==a;){a-=s=a>2e3?2e3:a;do{r=r+(i=i+e[n++]|0)|0}while(--s);i%=65521,r%=65521}return i|r<<16|0},M=new Uint32Array(function(){for(var t,e=[],a=0;a<256;a++){t=a;for(var n=0;n<8;n++)t=1&t?3988292384^t>>>1:t>>>1;e[a]=t}return e}()),H=function(t,e,a,n){var i=M,r=n+a;t^=-1;for(var s=n;s<r;s++)t=t>>>8^i[255&(t^e[s])];return-1^t},j={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"},K={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_MEM_ERROR:-4,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8},P=B._tr_init,Y=B._tr_stored_block,G=B._tr_flush_block,X=B._tr_tally,W=B._tr_align,q=K.Z_NO_FLUSH,J=K.Z_PARTIAL_FLUSH,Q=K.Z_FULL_FLUSH,V=K.Z_FINISH,$=K.Z_BLOCK,tt=K.Z_OK,et=K.Z_STREAM_END,at=K.Z_STREAM_ERROR,nt=K.Z_DATA_ERROR,it=K.Z_BUF_ERROR,rt=K.Z_DEFAULT_COMPRESSION,st=K.Z_FILTERED,ot=K.Z_HUFFMAN_ONLY,lt=K.Z_RLE,ht=K.Z_FIXED,dt=K.Z_DEFAULT_STRATEGY,_t=K.Z_UNKNOWN,ft=K.Z_DEFLATED,ut=258,ct=262,wt=42,mt=113,bt=666,gt=function(t,e){return t.msg=j[e],e},pt=function(t){return 2*t-(t>4?9:0)},vt=function(t){for(var e=t.length;--e>=0;)t[e]=0},kt=function(t){var e,a,n,i=t.w_size;n=e=t.hash_size;do{a=t.head[--n],t.head[n]=a>=i?a-i:0}while(--e);n=e=i;do{a=t.prev[--n],t.prev[n]=a>=i?a-i:0}while(--e)},yt=function(t,e,a){return(e<<t.hash_shift^a)&t.hash_mask},xt=function(t){var e=t.state,a=e.pending;a>t.avail_out&&(a=t.avail_out),0!==a&&(t.output.set(e.pending_buf.subarray(e.pending_out,e.pending_out+a),t.next_out),t.next_out+=a,e.pending_out+=a,t.total_out+=a,t.avail_out-=a,e.pending-=a,0===e.pending&&(e.pending_out=0))},zt=function(t,e){G(t,t.block_start>=0?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,xt(t.strm)},At=function(t,e){t.pending_buf[t.pending++]=e},Et=function(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e},Rt=function(t,e,a,n){var i=t.avail_in;return i>n&&(i=n),0===i?0:(t.avail_in-=i,e.set(t.input.subarray(t.next_in,t.next_in+i),a),1===t.state.wrap?t.adler=C(t.adler,e,i,a):2===t.state.wrap&&(t.adler=H(t.adler,e,i,a)),t.next_in+=i,t.total_in+=i,i)},Zt=function(t,e){var a,n,i=t.max_chain_length,r=t.strstart,s=t.prev_length,o=t.nice_match,l=t.strstart>t.w_size-ct?t.strstart-(t.w_size-ct):0,h=t.window,d=t.w_mask,_=t.prev,f=t.strstart+ut,u=h[r+s-1],c=h[r+s];t.prev_length>=t.good_match&&(i>>=2),o>t.lookahead&&(o=t.lookahead);do{if(h[(a=e)+s]===c&&h[a+s-1]===u&&h[a]===h[r]&&h[++a]===h[r+1]){r+=2,a++;do{}while(h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&r<f);if(n=ut-(f-r),r=f-ut,n>s){if(t.match_start=e,s=n,n>=o)break;u=h[r+s-1],c=h[r+s]}}}while((e=_[e&d])>l&&0!=--i);return s<=t.lookahead?s:t.lookahead},St=function(t){var e,a,n,i=t.w_size;do{if(a=t.window_size-t.lookahead-t.strstart,t.strstart>=i+(i-ct)&&(t.window.set(t.window.subarray(i,i+i-a),0),t.match_start-=i,t.strstart-=i,t.block_start-=i,t.insert>t.strstart&&(t.insert=t.strstart),kt(t),a+=i),0===t.strm.avail_in)break;if(e=Rt(t.strm,t.window,t.strstart+t.lookahead,a),t.lookahead+=e,t.lookahead+t.insert>=3)for(n=t.strstart-t.insert,t.ins_h=t.window[n],t.ins_h=yt(t,t.ins_h,t.window[n+1]);t.insert&&(t.ins_h=yt(t,t.ins_h,t.window[n+3-1]),t.prev[n&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=n,n++,t.insert--,!(t.lookahead+t.insert<3)););}while(t.lookahead<ct&&0!==t.strm.avail_in)},Ut=function(t,e){var a,n,i,r=t.pending_buf_size-5>t.w_size?t.w_size:t.pending_buf_size-5,s=0,o=t.strm.avail_in;do{if(a=65535,i=t.bi_valid+42>>3,t.strm.avail_out<i)break;if(i=t.strm.avail_out-i,a>(n=t.strstart-t.block_start)+t.strm.avail_in&&(a=n+t.strm.avail_in),a>i&&(a=i),a<r&&(0===a&&e!==V||e===q||a!==n+t.strm.avail_in))break;s=e===V&&a===n+t.strm.avail_in?1:0,Y(t,0,0,s),t.pending_buf[t.pending-4]=a,t.pending_buf[t.pending-3]=a>>8,t.pending_buf[t.pending-2]=~a,t.pending_buf[t.pending-1]=~a>>8,xt(t.strm),n&&(n>a&&(n=a),t.strm.output.set(t.window.subarray(t.block_start,t.block_start+n),t.strm.next_out),t.strm.next_out+=n,t.strm.avail_out-=n,t.strm.total_out+=n,t.block_start+=n,a-=n),a&&(Rt(t.strm,t.strm.output,t.strm.next_out,a),t.strm.next_out+=a,t.strm.avail_out-=a,t.strm.total_out+=a)}while(0===s);return(o-=t.strm.avail_in)&&(o>=t.w_size?(t.matches=2,t.window.set(t.strm.input.subarray(t.strm.next_in-t.w_size,t.strm.next_in),0),t.strstart=t.w_size,t.insert=t.strstart):(t.window_size-t.strstart<=o&&(t.strstart-=t.w_size,t.window.set(t.window.subarray(t.w_size,t.w_size+t.strstart),0),t.matches<2&&t.matches++,t.insert>t.strstart&&(t.insert=t.strstart)),t.window.set(t.strm.input.subarray(t.strm.next_in-o,t.strm.next_in),t.strstart),t.strstart+=o,t.insert+=o>t.w_size-t.insert?t.w_size-t.insert:o),t.block_start=t.strstart),t.high_water<t.strstart&&(t.high_water=t.strstart),s?4:e!==q&&e!==V&&0===t.strm.avail_in&&t.strstart===t.block_start?2:(i=t.window_size-t.strstart,t.strm.avail_in>i&&t.block_start>=t.w_size&&(t.block_start-=t.w_size,t.strstart-=t.w_size,t.window.set(t.window.subarray(t.w_size,t.w_size+t.strstart),0),t.matches<2&&t.matches++,i+=t.w_size,t.insert>t.strstart&&(t.insert=t.strstart)),i>t.strm.avail_in&&(i=t.strm.avail_in),i&&(Rt(t.strm,t.window,t.strstart,i),t.strstart+=i,t.insert+=i>t.w_size-t.insert?t.w_size-t.insert:i),t.high_water<t.strstart&&(t.high_water=t.strstart),i=t.bi_valid+42>>3,r=(i=t.pending_buf_size-i>65535?65535:t.pending_buf_size-i)>t.w_size?t.w_size:i,((n=t.strstart-t.block_start)>=r||(n||e===V)&&e!==q&&0===t.strm.avail_in&&n<=i)&&(a=n>i?i:n,s=e===V&&0===t.strm.avail_in&&a===n?1:0,Y(t,t.block_start,a,s),t.block_start+=a,xt(t.strm)),s?3:1)},Dt=function(t,e){for(var a,n;;){if(t.lookahead<ct){if(St(t),t.lookahead<ct&&e===q)return 1;if(0===t.lookahead)break}if(a=0,t.lookahead>=3&&(t.ins_h=yt(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==a&&t.strstart-a<=t.w_size-ct&&(t.match_length=Zt(t,a)),t.match_length>=3)if(n=X(t,t.strstart-t.match_start,t.match_length-3),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=3){t.match_length--;do{t.strstart++,t.ins_h=yt(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart}while(0!=--t.match_length);t.strstart++}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=yt(t,t.ins_h,t.window[t.strstart+1]);else n=X(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(n&&(zt(t,!1),0===t.strm.avail_out))return 1}return t.insert=t.strstart<2?t.strstart:2,e===V?(zt(t,!0),0===t.strm.avail_out?3:4):t.sym_next&&(zt(t,!1),0===t.strm.avail_out)?1:2},Tt=function(t,e){for(var a,n,i;;){if(t.lookahead<ct){if(St(t),t.lookahead<ct&&e===q)return 1;if(0===t.lookahead)break}if(a=0,t.lookahead>=3&&(t.ins_h=yt(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=2,0!==a&&t.prev_length<t.max_lazy_match&&t.strstart-a<=t.w_size-ct&&(t.match_length=Zt(t,a),t.match_length<=5&&(t.strategy===st||3===t.match_length&&t.strstart-t.match_start>4096)&&(t.match_length=2)),t.prev_length>=3&&t.match_length<=t.prev_length){i=t.strstart+t.lookahead-3,n=X(t,t.strstart-1-t.prev_match,t.prev_length-3),t.lookahead-=t.prev_length-1,t.prev_length-=2;do{++t.strstart<=i&&(t.ins_h=yt(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart)}while(0!=--t.prev_length);if(t.match_available=0,t.match_length=2,t.strstart++,n&&(zt(t,!1),0===t.strm.avail_out))return 1}else if(t.match_available){if((n=X(t,0,t.window[t.strstart-1]))&&zt(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return 1}else t.match_available=1,t.strstart++,t.lookahead--}return t.match_available&&(n=X(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<2?t.strstart:2,e===V?(zt(t,!0),0===t.strm.avail_out?3:4):t.sym_next&&(zt(t,!1),0===t.strm.avail_out)?1:2};function Ot(t,e,a,n,i){this.good_length=t,this.max_lazy=e,this.nice_length=a,this.max_chain=n,this.func=i}var It=[new Ot(0,0,0,0,Ut),new Ot(4,4,8,4,Dt),new Ot(4,5,16,8,Dt),new Ot(4,6,32,32,Dt),new Ot(4,4,16,16,Tt),new Ot(8,16,32,32,Tt),new Ot(8,16,128,128,Tt),new Ot(8,32,128,256,Tt),new Ot(32,128,258,1024,Tt),new Ot(32,258,258,4096,Tt)];function Ft(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=ft,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new Uint16Array(1146),this.dyn_dtree=new Uint16Array(122),this.bl_tree=new Uint16Array(78),vt(this.dyn_ltree),vt(this.dyn_dtree),vt(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new Uint16Array(16),this.heap=new Uint16Array(573),vt(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new Uint16Array(573),vt(this.depth),this.sym_buf=0,this.lit_bufsize=0,this.sym_next=0,this.sym_end=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}var Lt=function(t){if(!t)return 1;var e=t.state;return!e||e.strm!==t||e.status!==wt&&57!==e.status&&69!==e.status&&73!==e.status&&91!==e.status&&103!==e.status&&e.status!==mt&&e.status!==bt?1:0},Nt=function(t){if(Lt(t))return gt(t,at);t.total_in=t.total_out=0,t.data_type=_t;var e=t.state;return e.pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=2===e.wrap?57:e.wrap?wt:mt,t.adler=2===e.wrap?0:1,e.last_flush=-2,P(e),tt},Bt=function(t){var e,a=Nt(t);return a===tt&&((e=t.state).window_size=2*e.w_size,vt(e.head),e.max_lazy_match=It[e.level].max_lazy,e.good_match=It[e.level].good_length,e.nice_match=It[e.level].nice_length,e.max_chain_length=It[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=2,e.match_available=0,e.ins_h=0),a},Ct=function(t,e,a,n,i,r){if(!t)return at;var s=1;if(e===rt&&(e=6),n<0?(s=0,n=-n):n>15&&(s=2,n-=16),i<1||i>9||a!==ft||n<8||n>15||e<0||e>9||r<0||r>ht||8===n&&1!==s)return gt(t,at);8===n&&(n=9);var o=new Ft;return t.state=o,o.strm=t,o.status=wt,o.wrap=s,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=i+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+3-1)/3),o.window=new Uint8Array(2*o.w_size),o.head=new Uint16Array(o.hash_size),o.prev=new Uint16Array(o.w_size),o.lit_bufsize=1<<i+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new Uint8Array(o.pending_buf_size),o.sym_buf=o.lit_bufsize,o.sym_end=3*(o.lit_bufsize-1),o.level=e,o.strategy=r,o.method=a,Bt(t)},Mt={deflateInit:function(t,e){return Ct(t,e,ft,15,8,dt)},deflateInit2:Ct,deflateReset:Bt,deflateResetKeep:Nt,deflateSetHeader:function(t,e){return Lt(t)||2!==t.state.wrap?at:(t.state.gzhead=e,tt)},deflate:function(t,e){if(Lt(t)||e>$||e<0)return t?gt(t,at):at;var a=t.state;if(!t.output||0!==t.avail_in&&!t.input||a.status===bt&&e!==V)return gt(t,0===t.avail_out?it:at);var n=a.last_flush;if(a.last_flush=e,0!==a.pending){if(xt(t),0===t.avail_out)return a.last_flush=-1,tt}else if(0===t.avail_in&&pt(e)<=pt(n)&&e!==V)return gt(t,it);if(a.status===bt&&0!==t.avail_in)return gt(t,it);if(a.status===wt&&0===a.wrap&&(a.status=mt),a.status===wt){var i=ft+(a.w_bits-8<<4)<<8;if(i|=(a.strategy>=ot||a.level<2?0:a.level<6?1:6===a.level?2:3)<<6,0!==a.strstart&&(i|=32),Et(a,i+=31-i%31),0!==a.strstart&&(Et(a,t.adler>>>16),Et(a,65535&t.adler)),t.adler=1,a.status=mt,xt(t),0!==a.pending)return a.last_flush=-1,tt}if(57===a.status)if(t.adler=0,At(a,31),At(a,139),At(a,8),a.gzhead)At(a,(a.gzhead.text?1:0)+(a.gzhead.hcrc?2:0)+(a.gzhead.extra?4:0)+(a.gzhead.name?8:0)+(a.gzhead.comment?16:0)),At(a,255&a.gzhead.time),At(a,a.gzhead.time>>8&255),At(a,a.gzhead.time>>16&255),At(a,a.gzhead.time>>24&255),At(a,9===a.level?2:a.strategy>=ot||a.level<2?4:0),At(a,255&a.gzhead.os),a.gzhead.extra&&a.gzhead.extra.length&&(At(a,255&a.gzhead.extra.length),At(a,a.gzhead.extra.length>>8&255)),a.gzhead.hcrc&&(t.adler=H(t.adler,a.pending_buf,a.pending,0)),a.gzindex=0,a.status=69;else if(At(a,0),At(a,0),At(a,0),At(a,0),At(a,0),At(a,9===a.level?2:a.strategy>=ot||a.level<2?4:0),At(a,3),a.status=mt,xt(t),0!==a.pending)return a.last_flush=-1,tt;if(69===a.status){if(a.gzhead.extra){for(var r=a.pending,s=(65535&a.gzhead.extra.length)-a.gzindex;a.pending+s>a.pending_buf_size;){var o=a.pending_buf_size-a.pending;if(a.pending_buf.set(a.gzhead.extra.subarray(a.gzindex,a.gzindex+o),a.pending),a.pending=a.pending_buf_size,a.gzhead.hcrc&&a.pending>r&&(t.adler=H(t.adler,a.pending_buf,a.pending-r,r)),a.gzindex+=o,xt(t),0!==a.pending)return a.last_flush=-1,tt;r=0,s-=o}var l=new Uint8Array(a.gzhead.extra);a.pending_buf.set(l.subarray(a.gzindex,a.gzindex+s),a.pending),a.pending+=s,a.gzhead.hcrc&&a.pending>r&&(t.adler=H(t.adler,a.pending_buf,a.pending-r,r)),a.gzindex=0}a.status=73}if(73===a.status){if(a.gzhead.name){var h,d=a.pending;do{if(a.pending===a.pending_buf_size){if(a.gzhead.hcrc&&a.pending>d&&(t.adler=H(t.adler,a.pending_buf,a.pending-d,d)),xt(t),0!==a.pending)return a.last_flush=-1,tt;d=0}h=a.gzindex<a.gzhead.name.length?255&a.gzhead.name.charCodeAt(a.gzindex++):0,At(a,h)}while(0!==h);a.gzhead.hcrc&&a.pending>d&&(t.adler=H(t.adler,a.pending_buf,a.pending-d,d)),a.gzindex=0}a.status=91}if(91===a.status){if(a.gzhead.comment){var _,f=a.pending;do{if(a.pending===a.pending_buf_size){if(a.gzhead.hcrc&&a.pending>f&&(t.adler=H(t.adler,a.pending_buf,a.pending-f,f)),xt(t),0!==a.pending)return a.last_flush=-1,tt;f=0}_=a.gzindex<a.gzhead.comment.length?255&a.gzhead.comment.charCodeAt(a.gzindex++):0,At(a,_)}while(0!==_);a.gzhead.hcrc&&a.pending>f&&(t.adler=H(t.adler,a.pending_buf,a.pending-f,f))}a.status=103}if(103===a.status){if(a.gzhead.hcrc){if(a.pending+2>a.pending_buf_size&&(xt(t),0!==a.pending))return a.last_flush=-1,tt;At(a,255&t.adler),At(a,t.adler>>8&255),t.adler=0}if(a.status=mt,xt(t),0!==a.pending)return a.last_flush=-1,tt}if(0!==t.avail_in||0!==a.lookahead||e!==q&&a.status!==bt){var u=0===a.level?Ut(a,e):a.strategy===ot?function(t,e){for(var a;;){if(0===t.lookahead&&(St(t),0===t.lookahead)){if(e===q)return 1;break}if(t.match_length=0,a=X(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,a&&(zt(t,!1),0===t.strm.avail_out))return 1}return t.insert=0,e===V?(zt(t,!0),0===t.strm.avail_out?3:4):t.sym_next&&(zt(t,!1),0===t.strm.avail_out)?1:2}(a,e):a.strategy===lt?function(t,e){for(var a,n,i,r,s=t.window;;){if(t.lookahead<=ut){if(St(t),t.lookahead<=ut&&e===q)return 1;if(0===t.lookahead)break}if(t.match_length=0,t.lookahead>=3&&t.strstart>0&&(n=s[i=t.strstart-1])===s[++i]&&n===s[++i]&&n===s[++i]){r=t.strstart+ut;do{}while(n===s[++i]&&n===s[++i]&&n===s[++i]&&n===s[++i]&&n===s[++i]&&n===s[++i]&&n===s[++i]&&n===s[++i]&&i<r);t.match_length=ut-(r-i),t.match_length>t.lookahead&&(t.match_length=t.lookahead)}if(t.match_length>=3?(a=X(t,1,t.match_length-3),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(a=X(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),a&&(zt(t,!1),0===t.strm.avail_out))return 1}return t.insert=0,e===V?(zt(t,!0),0===t.strm.avail_out?3:4):t.sym_next&&(zt(t,!1),0===t.strm.avail_out)?1:2}(a,e):It[a.level].func(a,e);if(3!==u&&4!==u||(a.status=bt),1===u||3===u)return 0===t.avail_out&&(a.last_flush=-1),tt;if(2===u&&(e===J?W(a):e!==$&&(Y(a,0,0,!1),e===Q&&(vt(a.head),0===a.lookahead&&(a.strstart=0,a.block_start=0,a.insert=0))),xt(t),0===t.avail_out))return a.last_flush=-1,tt}return e!==V?tt:a.wrap<=0?et:(2===a.wrap?(At(a,255&t.adler),At(a,t.adler>>8&255),At(a,t.adler>>16&255),At(a,t.adler>>24&255),At(a,255&t.total_in),At(a,t.total_in>>8&255),At(a,t.total_in>>16&255),At(a,t.total_in>>24&255)):(Et(a,t.adler>>>16),Et(a,65535&t.adler)),xt(t),a.wrap>0&&(a.wrap=-a.wrap),0!==a.pending?tt:et)},deflateEnd:function(t){if(Lt(t))return at;var e=t.state.status;return t.state=null,e===mt?gt(t,nt):tt},deflateSetDictionary:function(t,e){var a=e.length;if(Lt(t))return at;var n=t.state,i=n.wrap;if(2===i||1===i&&n.status!==wt||n.lookahead)return at;if(1===i&&(t.adler=C(t.adler,e,a,0)),n.wrap=0,a>=n.w_size){0===i&&(vt(n.head),n.strstart=0,n.block_start=0,n.insert=0);var r=new Uint8Array(n.w_size);r.set(e.subarray(a-n.w_size,a),0),e=r,a=n.w_size}var s=t.avail_in,o=t.next_in,l=t.input;for(t.avail_in=a,t.next_in=0,t.input=e,St(n);n.lookahead>=3;){var h=n.strstart,d=n.lookahead-2;do{n.ins_h=yt(n,n.ins_h,n.window[h+3-1]),n.prev[h&n.w_mask]=n.head[n.ins_h],n.head[n.ins_h]=h,h++}while(--d);n.strstart=h,n.lookahead=2,St(n)}return n.strstart+=n.lookahead,n.block_start=n.strstart,n.insert=n.lookahead,n.lookahead=0,n.match_length=n.prev_length=2,n.match_available=0,t.next_in=o,t.input=l,t.avail_in=s,n.wrap=i,tt},deflateInfo:"pako deflate (from Nodeca project)"};function Ht(t){return Ht="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},Ht(t)}var jt=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},Kt=function(t){for(var e=Array.prototype.slice.call(arguments,1);e.length;){var a=e.shift();if(a){if("object"!==Ht(a))throw new TypeError(a+"must be non-object");for(var n in a)jt(a,n)&&(t[n]=a[n])}}return t},Pt=function(t){for(var e=0,a=0,n=t.length;a<n;a++)e+=t[a].length;for(var i=new Uint8Array(e),r=0,s=0,o=t.length;r<o;r++){var l=t[r];i.set(l,s),s+=l.length}return i},Yt=!0;try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(t){Yt=!1}for(var Gt=new Uint8Array(256),Xt=0;Xt<256;Xt++)Gt[Xt]=Xt>=252?6:Xt>=248?5:Xt>=240?4:Xt>=224?3:Xt>=192?2:1;Gt[254]=Gt[254]=1;var Wt=function(t){if("function"==typeof TextEncoder&&TextEncoder.prototype.encode)return(new TextEncoder).encode(t);var e,a,n,i,r,s=t.length,o=0;for(i=0;i<s;i++)55296==(64512&(a=t.charCodeAt(i)))&&i+1<s&&56320==(64512&(n=t.charCodeAt(i+1)))&&(a=65536+(a-55296<<10)+(n-56320),i++),o+=a<128?1:a<2048?2:a<65536?3:4;for(e=new Uint8Array(o),r=0,i=0;r<o;i++)55296==(64512&(a=t.charCodeAt(i)))&&i+1<s&&56320==(64512&(n=t.charCodeAt(i+1)))&&(a=65536+(a-55296<<10)+(n-56320),i++),a<128?e[r++]=a:a<2048?(e[r++]=192|a>>>6,e[r++]=128|63&a):a<65536?(e[r++]=224|a>>>12,e[r++]=128|a>>>6&63,e[r++]=128|63&a):(e[r++]=240|a>>>18,e[r++]=128|a>>>12&63,e[r++]=128|a>>>6&63,e[r++]=128|63&a);return e},qt=function(t,e){var a,n,i=e||t.length;if("function"==typeof TextDecoder&&TextDecoder.prototype.decode)return(new TextDecoder).decode(t.subarray(0,e));var r=new Array(2*i);for(n=0,a=0;a<i;){var s=t[a++];if(s<128)r[n++]=s;else{var o=Gt[s];if(o>4)r[n++]=65533,a+=o-1;else{for(s&=2===o?31:3===o?15:7;o>1&&a<i;)s=s<<6|63&t[a++],o--;o>1?r[n++]=65533:s<65536?r[n++]=s:(s-=65536,r[n++]=55296|s>>10&1023,r[n++]=56320|1023&s)}}}return function(t,e){if(e<65534&&t.subarray&&Yt)return String.fromCharCode.apply(null,t.length===e?t:t.subarray(0,e));for(var a="",n=0;n<e;n++)a+=String.fromCharCode(t[n]);return a}(r,n)},Jt=function(t,e){(e=e||t.length)>t.length&&(e=t.length);for(var a=e-1;a>=0&&128==(192&t[a]);)a--;return a<0||0===a?e:a+Gt[t[a]]>e?a:e};var Qt=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0},Vt=Object.prototype.toString,$t=K.Z_NO_FLUSH,te=K.Z_SYNC_FLUSH,ee=K.Z_FULL_FLUSH,ae=K.Z_FINISH,ne=K.Z_OK,ie=K.Z_STREAM_END,re=K.Z_DEFAULT_COMPRESSION,se=K.Z_DEFAULT_STRATEGY,oe=K.Z_DEFLATED;function le(t){this.options=Kt({level:re,method:oe,chunkSize:16384,windowBits:15,memLevel:8,strategy:se},t||{});var e=this.options;e.raw&&e.windowBits>0?e.windowBits=-e.windowBits:e.gzip&&e.windowBits>0&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new Qt,this.strm.avail_out=0;var a=Mt.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(a!==ne)throw new Error(j[a]);if(e.header&&Mt.deflateSetHeader(this.strm,e.header),e.dictionary){var n;if(n="string"==typeof e.dictionary?Wt(e.dictionary):"[object ArrayBuffer]"===Vt.call(e.dictionary)?new Uint8Array(e.dictionary):e.dictionary,(a=Mt.deflateSetDictionary(this.strm,n))!==ne)throw new Error(j[a]);this._dict_set=!0}}function he(t,e){var a=new le(e);if(a.push(t,!0),a.err)throw a.msg||j[a.err];return a.result}le.prototype.push=function(t,e){var a,n,i=this.strm,r=this.options.chunkSize;if(this.ended)return!1;for(n=e===~~e?e:!0===e?ae:$t,"string"==typeof t?i.input=Wt(t):"[object ArrayBuffer]"===Vt.call(t)?i.input=new Uint8Array(t):i.input=t,i.next_in=0,i.avail_in=i.input.length;;)if(0===i.avail_out&&(i.output=new Uint8Array(r),i.next_out=0,i.avail_out=r),(n===te||n===ee)&&i.avail_out<=6)this.onData(i.output.subarray(0,i.next_out)),i.avail_out=0;else{if((a=Mt.deflate(i,n))===ie)return i.next_out>0&&this.onData(i.output.subarray(0,i.next_out)),a=Mt.deflateEnd(this.strm),this.onEnd(a),this.ended=!0,a===ne;if(0!==i.avail_out){if(n>0&&i.next_out>0)this.onData(i.output.subarray(0,i.next_out)),i.avail_out=0;else if(0===i.avail_in)break}else this.onData(i.output)}return!0},le.prototype.onData=function(t){this.chunks.push(t)},le.prototype.onEnd=function(t){t===ne&&(this.result=Pt(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg};var de={Deflate:le,deflate:he,deflateRaw:function(t,e){return(e=e||{}).raw=!0,he(t,e)},gzip:function(t,e){return(e=e||{}).gzip=!0,he(t,e)},constants:K},_e=16209,fe=function(t,e){var a,n,i,r,s,o,l,h,d,_,f,u,c,w,m,b,g,p,v,k,y,x,z,A,E=t.state;a=t.next_in,z=t.input,n=a+(t.avail_in-5),i=t.next_out,A=t.output,r=i-(e-t.avail_out),s=i+(t.avail_out-257),o=E.dmax,l=E.wsize,h=E.whave,d=E.wnext,_=E.window,f=E.hold,u=E.bits,c=E.lencode,w=E.distcode,m=(1<<E.lenbits)-1,b=(1<<E.distbits)-1;t:do{u<15&&(f+=z[a++]<<u,u+=8,f+=z[a++]<<u,u+=8),g=c[f&m];e:for(;;){if(f>>>=p=g>>>24,u-=p,0===(p=g>>>16&255))A[i++]=65535&g;else{if(!(16&p)){if(0==(64&p)){g=c[(65535&g)+(f&(1<<p)-1)];continue e}if(32&p){E.mode=16191;break t}t.msg="invalid literal/length code",E.mode=_e;break t}v=65535&g,(p&=15)&&(u<p&&(f+=z[a++]<<u,u+=8),v+=f&(1<<p)-1,f>>>=p,u-=p),u<15&&(f+=z[a++]<<u,u+=8,f+=z[a++]<<u,u+=8),g=w[f&b];a:for(;;){if(f>>>=p=g>>>24,u-=p,!(16&(p=g>>>16&255))){if(0==(64&p)){g=w[(65535&g)+(f&(1<<p)-1)];continue a}t.msg="invalid distance code",E.mode=_e;break t}if(k=65535&g,u<(p&=15)&&(f+=z[a++]<<u,(u+=8)<p&&(f+=z[a++]<<u,u+=8)),(k+=f&(1<<p)-1)>o){t.msg="invalid distance too far back",E.mode=_e;break t}if(f>>>=p,u-=p,k>(p=i-r)){if((p=k-p)>h&&E.sane){t.msg="invalid distance too far back",E.mode=_e;break t}if(y=0,x=_,0===d){if(y+=l-p,p<v){v-=p;do{A[i++]=_[y++]}while(--p);y=i-k,x=A}}else if(d<p){if(y+=l+d-p,(p-=d)<v){v-=p;do{A[i++]=_[y++]}while(--p);if(y=0,d<v){v-=p=d;do{A[i++]=_[y++]}while(--p);y=i-k,x=A}}}else if(y+=d-p,p<v){v-=p;do{A[i++]=_[y++]}while(--p);y=i-k,x=A}for(;v>2;)A[i++]=x[y++],A[i++]=x[y++],A[i++]=x[y++],v-=3;v&&(A[i++]=x[y++],v>1&&(A[i++]=x[y++]))}else{y=i-k;do{A[i++]=A[y++],A[i++]=A[y++],A[i++]=A[y++],v-=3}while(v>2);v&&(A[i++]=A[y++],v>1&&(A[i++]=A[y++]))}break}}break}}while(a<n&&i<s);a-=v=u>>3,f&=(1<<(u-=v<<3))-1,t.next_in=a,t.next_out=i,t.avail_in=a<n?n-a+5:5-(a-n),t.avail_out=i<s?s-i+257:257-(i-s),E.hold=f,E.bits=u},ue=15,ce=new Uint16Array([3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0]),we=new Uint8Array([16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78]),me=new Uint16Array([1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0]),be=new Uint8Array([16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64]),ge=function(t,e,a,n,i,r,s,o){var l,h,d,_,f,u,c,w,m,b=o.bits,g=0,p=0,v=0,k=0,y=0,x=0,z=0,A=0,E=0,R=0,Z=null,S=new Uint16Array(16),U=new Uint16Array(16),D=null;for(g=0;g<=ue;g++)S[g]=0;for(p=0;p<n;p++)S[e[a+p]]++;for(y=b,k=ue;k>=1&&0===S[k];k--);if(y>k&&(y=k),0===k)return i[r++]=20971520,i[r++]=20971520,o.bits=1,0;for(v=1;v<k&&0===S[v];v++);for(y<v&&(y=v),A=1,g=1;g<=ue;g++)if(A<<=1,(A-=S[g])<0)return-1;if(A>0&&(0===t||1!==k))return-1;for(U[1]=0,g=1;g<ue;g++)U[g+1]=U[g]+S[g];for(p=0;p<n;p++)0!==e[a+p]&&(s[U[e[a+p]]++]=p);if(0===t?(Z=D=s,u=20):1===t?(Z=ce,D=we,u=257):(Z=me,D=be,u=0),R=0,p=0,g=v,f=r,x=y,z=0,d=-1,_=(E=1<<y)-1,1===t&&E>852||2===t&&E>592)return 1;for(;;){c=g-z,s[p]+1<u?(w=0,m=s[p]):s[p]>=u?(w=D[s[p]-u],m=Z[s[p]-u]):(w=96,m=0),l=1<<g-z,v=h=1<<x;do{i[f+(R>>z)+(h-=l)]=c<<24|w<<16|m|0}while(0!==h);for(l=1<<g-1;R&l;)l>>=1;if(0!==l?(R&=l-1,R+=l):R=0,p++,0==--S[g]){if(g===k)break;g=e[a+s[p]]}if(g>y&&(R&_)!==d){for(0===z&&(z=y),f+=v,A=1<<(x=g-z);x+z<k&&!((A-=S[x+z])<=0);)x++,A<<=1;if(E+=1<<x,1===t&&E>852||2===t&&E>592)return 1;i[d=R&_]=y<<24|x<<16|f-r|0}}return 0!==R&&(i[f+R]=g-z<<24|64<<16|0),o.bits=y,0},pe=K.Z_FINISH,ve=K.Z_BLOCK,ke=K.Z_TREES,ye=K.Z_OK,xe=K.Z_STREAM_END,ze=K.Z_NEED_DICT,Ae=K.Z_STREAM_ERROR,Ee=K.Z_DATA_ERROR,Re=K.Z_MEM_ERROR,Ze=K.Z_BUF_ERROR,Se=K.Z_DEFLATED,Ue=16180,De=16190,Te=16191,Oe=16192,Ie=16194,Fe=16199,Le=16200,Ne=16206,Be=16209,Ce=function(t){return(t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24)};function Me(){this.strm=null,this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new Uint16Array(320),this.work=new Uint16Array(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}var He,je,Ke=function(t){if(!t)return 1;var e=t.state;return!e||e.strm!==t||e.mode<Ue||e.mode>16211?1:0},Pe=function(t){if(Ke(t))return Ae;var e=t.state;return t.total_in=t.total_out=e.total=0,t.msg="",e.wrap&&(t.adler=1&e.wrap),e.mode=Ue,e.last=0,e.havedict=0,e.flags=-1,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new Int32Array(852),e.distcode=e.distdyn=new Int32Array(592),e.sane=1,e.back=-1,ye},Ye=function(t){if(Ke(t))return Ae;var e=t.state;return e.wsize=0,e.whave=0,e.wnext=0,Pe(t)},Ge=function(t,e){var a;if(Ke(t))return Ae;var n=t.state;return e<0?(a=0,e=-e):(a=5+(e>>4),e<48&&(e&=15)),e&&(e<8||e>15)?Ae:(null!==n.window&&n.wbits!==e&&(n.window=null),n.wrap=a,n.wbits=e,Ye(t))},Xe=function(t,e){if(!t)return Ae;var a=new Me;t.state=a,a.strm=t,a.window=null,a.mode=Ue;var n=Ge(t,e);return n!==ye&&(t.state=null),n},We=!0,qe=function(t){if(We){He=new Int32Array(512),je=new Int32Array(32);for(var e=0;e<144;)t.lens[e++]=8;for(;e<256;)t.lens[e++]=9;for(;e<280;)t.lens[e++]=7;for(;e<288;)t.lens[e++]=8;for(ge(1,t.lens,0,288,He,0,t.work,{bits:9}),e=0;e<32;)t.lens[e++]=5;ge(2,t.lens,0,32,je,0,t.work,{bits:5}),We=!1}t.lencode=He,t.lenbits=9,t.distcode=je,t.distbits=5},Je=function(t,e,a,n){var i,r=t.state;return null===r.window&&(r.wsize=1<<r.wbits,r.wnext=0,r.whave=0,r.window=new Uint8Array(r.wsize)),n>=r.wsize?(r.window.set(e.subarray(a-r.wsize,a),0),r.wnext=0,r.whave=r.wsize):((i=r.wsize-r.wnext)>n&&(i=n),r.window.set(e.subarray(a-n,a-n+i),r.wnext),(n-=i)?(r.window.set(e.subarray(a-n,a),0),r.wnext=n,r.whave=r.wsize):(r.wnext+=i,r.wnext===r.wsize&&(r.wnext=0),r.whave<r.wsize&&(r.whave+=i))),0},Qe={inflateReset:Ye,inflateReset2:Ge,inflateResetKeep:Pe,inflateInit:function(t){return Xe(t,15)},inflateInit2:Xe,inflate:function(t,e){var a,n,i,r,s,o,l,h,d,_,f,u,c,w,m,b,g,p,v,k,y,x,z,A,E=0,R=new Uint8Array(4),Z=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]);if(Ke(t)||!t.output||!t.input&&0!==t.avail_in)return Ae;(a=t.state).mode===Te&&(a.mode=Oe),s=t.next_out,i=t.output,l=t.avail_out,r=t.next_in,n=t.input,o=t.avail_in,h=a.hold,d=a.bits,_=o,f=l,x=ye;t:for(;;)switch(a.mode){case Ue:if(0===a.wrap){a.mode=Oe;break}for(;d<16;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if(2&a.wrap&&35615===h){0===a.wbits&&(a.wbits=15),a.check=0,R[0]=255&h,R[1]=h>>>8&255,a.check=H(a.check,R,2,0),h=0,d=0,a.mode=16181;break}if(a.head&&(a.head.done=!1),!(1&a.wrap)||(((255&h)<<8)+(h>>8))%31){t.msg="incorrect header check",a.mode=Be;break}if((15&h)!==Se){t.msg="unknown compression method",a.mode=Be;break}if(d-=4,y=8+(15&(h>>>=4)),0===a.wbits&&(a.wbits=y),y>15||y>a.wbits){t.msg="invalid window size",a.mode=Be;break}a.dmax=1<<a.wbits,a.flags=0,t.adler=a.check=1,a.mode=512&h?16189:Te,h=0,d=0;break;case 16181:for(;d<16;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if(a.flags=h,(255&a.flags)!==Se){t.msg="unknown compression method",a.mode=Be;break}if(57344&a.flags){t.msg="unknown header flags set",a.mode=Be;break}a.head&&(a.head.text=h>>8&1),512&a.flags&&4&a.wrap&&(R[0]=255&h,R[1]=h>>>8&255,a.check=H(a.check,R,2,0)),h=0,d=0,a.mode=16182;case 16182:for(;d<32;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}a.head&&(a.head.time=h),512&a.flags&&4&a.wrap&&(R[0]=255&h,R[1]=h>>>8&255,R[2]=h>>>16&255,R[3]=h>>>24&255,a.check=H(a.check,R,4,0)),h=0,d=0,a.mode=16183;case 16183:for(;d<16;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}a.head&&(a.head.xflags=255&h,a.head.os=h>>8),512&a.flags&&4&a.wrap&&(R[0]=255&h,R[1]=h>>>8&255,a.check=H(a.check,R,2,0)),h=0,d=0,a.mode=16184;case 16184:if(1024&a.flags){for(;d<16;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}a.length=h,a.head&&(a.head.extra_len=h),512&a.flags&&4&a.wrap&&(R[0]=255&h,R[1]=h>>>8&255,a.check=H(a.check,R,2,0)),h=0,d=0}else a.head&&(a.head.extra=null);a.mode=16185;case 16185:if(1024&a.flags&&((u=a.length)>o&&(u=o),u&&(a.head&&(y=a.head.extra_len-a.length,a.head.extra||(a.head.extra=new Uint8Array(a.head.extra_len)),a.head.extra.set(n.subarray(r,r+u),y)),512&a.flags&&4&a.wrap&&(a.check=H(a.check,n,u,r)),o-=u,r+=u,a.length-=u),a.length))break t;a.length=0,a.mode=16186;case 16186:if(2048&a.flags){if(0===o)break t;u=0;do{y=n[r+u++],a.head&&y&&a.length<65536&&(a.head.name+=String.fromCharCode(y))}while(y&&u<o);if(512&a.flags&&4&a.wrap&&(a.check=H(a.check,n,u,r)),o-=u,r+=u,y)break t}else a.head&&(a.head.name=null);a.length=0,a.mode=16187;case 16187:if(4096&a.flags){if(0===o)break t;u=0;do{y=n[r+u++],a.head&&y&&a.length<65536&&(a.head.comment+=String.fromCharCode(y))}while(y&&u<o);if(512&a.flags&&4&a.wrap&&(a.check=H(a.check,n,u,r)),o-=u,r+=u,y)break t}else a.head&&(a.head.comment=null);a.mode=16188;case 16188:if(512&a.flags){for(;d<16;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if(4&a.wrap&&h!==(65535&a.check)){t.msg="header crc mismatch",a.mode=Be;break}h=0,d=0}a.head&&(a.head.hcrc=a.flags>>9&1,a.head.done=!0),t.adler=a.check=0,a.mode=Te;break;case 16189:for(;d<32;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}t.adler=a.check=Ce(h),h=0,d=0,a.mode=De;case De:if(0===a.havedict)return t.next_out=s,t.avail_out=l,t.next_in=r,t.avail_in=o,a.hold=h,a.bits=d,ze;t.adler=a.check=1,a.mode=Te;case Te:if(e===ve||e===ke)break t;case Oe:if(a.last){h>>>=7&d,d-=7&d,a.mode=Ne;break}for(;d<3;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}switch(a.last=1&h,d-=1,3&(h>>>=1)){case 0:a.mode=16193;break;case 1:if(qe(a),a.mode=Fe,e===ke){h>>>=2,d-=2;break t}break;case 2:a.mode=16196;break;case 3:t.msg="invalid block type",a.mode=Be}h>>>=2,d-=2;break;case 16193:for(h>>>=7&d,d-=7&d;d<32;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if((65535&h)!=(h>>>16^65535)){t.msg="invalid stored block lengths",a.mode=Be;break}if(a.length=65535&h,h=0,d=0,a.mode=Ie,e===ke)break t;case Ie:a.mode=16195;case 16195:if(u=a.length){if(u>o&&(u=o),u>l&&(u=l),0===u)break t;i.set(n.subarray(r,r+u),s),o-=u,r+=u,l-=u,s+=u,a.length-=u;break}a.mode=Te;break;case 16196:for(;d<14;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if(a.nlen=257+(31&h),h>>>=5,d-=5,a.ndist=1+(31&h),h>>>=5,d-=5,a.ncode=4+(15&h),h>>>=4,d-=4,a.nlen>286||a.ndist>30){t.msg="too many length or distance symbols",a.mode=Be;break}a.have=0,a.mode=16197;case 16197:for(;a.have<a.ncode;){for(;d<3;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}a.lens[Z[a.have++]]=7&h,h>>>=3,d-=3}for(;a.have<19;)a.lens[Z[a.have++]]=0;if(a.lencode=a.lendyn,a.lenbits=7,z={bits:a.lenbits},x=ge(0,a.lens,0,19,a.lencode,0,a.work,z),a.lenbits=z.bits,x){t.msg="invalid code lengths set",a.mode=Be;break}a.have=0,a.mode=16198;case 16198:for(;a.have<a.nlen+a.ndist;){for(;b=(E=a.lencode[h&(1<<a.lenbits)-1])>>>16&255,g=65535&E,!((m=E>>>24)<=d);){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if(g<16)h>>>=m,d-=m,a.lens[a.have++]=g;else{if(16===g){for(A=m+2;d<A;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if(h>>>=m,d-=m,0===a.have){t.msg="invalid bit length repeat",a.mode=Be;break}y=a.lens[a.have-1],u=3+(3&h),h>>>=2,d-=2}else if(17===g){for(A=m+3;d<A;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}d-=m,y=0,u=3+(7&(h>>>=m)),h>>>=3,d-=3}else{for(A=m+7;d<A;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}d-=m,y=0,u=11+(127&(h>>>=m)),h>>>=7,d-=7}if(a.have+u>a.nlen+a.ndist){t.msg="invalid bit length repeat",a.mode=Be;break}for(;u--;)a.lens[a.have++]=y}}if(a.mode===Be)break;if(0===a.lens[256]){t.msg="invalid code -- missing end-of-block",a.mode=Be;break}if(a.lenbits=9,z={bits:a.lenbits},x=ge(1,a.lens,0,a.nlen,a.lencode,0,a.work,z),a.lenbits=z.bits,x){t.msg="invalid literal/lengths set",a.mode=Be;break}if(a.distbits=6,a.distcode=a.distdyn,z={bits:a.distbits},x=ge(2,a.lens,a.nlen,a.ndist,a.distcode,0,a.work,z),a.distbits=z.bits,x){t.msg="invalid distances set",a.mode=Be;break}if(a.mode=Fe,e===ke)break t;case Fe:a.mode=Le;case Le:if(o>=6&&l>=258){t.next_out=s,t.avail_out=l,t.next_in=r,t.avail_in=o,a.hold=h,a.bits=d,fe(t,f),s=t.next_out,i=t.output,l=t.avail_out,r=t.next_in,n=t.input,o=t.avail_in,h=a.hold,d=a.bits,a.mode===Te&&(a.back=-1);break}for(a.back=0;b=(E=a.lencode[h&(1<<a.lenbits)-1])>>>16&255,g=65535&E,!((m=E>>>24)<=d);){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if(b&&0==(240&b)){for(p=m,v=b,k=g;b=(E=a.lencode[k+((h&(1<<p+v)-1)>>p)])>>>16&255,g=65535&E,!(p+(m=E>>>24)<=d);){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}h>>>=p,d-=p,a.back+=p}if(h>>>=m,d-=m,a.back+=m,a.length=g,0===b){a.mode=16205;break}if(32&b){a.back=-1,a.mode=Te;break}if(64&b){t.msg="invalid literal/length code",a.mode=Be;break}a.extra=15&b,a.mode=16201;case 16201:if(a.extra){for(A=a.extra;d<A;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}a.length+=h&(1<<a.extra)-1,h>>>=a.extra,d-=a.extra,a.back+=a.extra}a.was=a.length,a.mode=16202;case 16202:for(;b=(E=a.distcode[h&(1<<a.distbits)-1])>>>16&255,g=65535&E,!((m=E>>>24)<=d);){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if(0==(240&b)){for(p=m,v=b,k=g;b=(E=a.distcode[k+((h&(1<<p+v)-1)>>p)])>>>16&255,g=65535&E,!(p+(m=E>>>24)<=d);){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}h>>>=p,d-=p,a.back+=p}if(h>>>=m,d-=m,a.back+=m,64&b){t.msg="invalid distance code",a.mode=Be;break}a.offset=g,a.extra=15&b,a.mode=16203;case 16203:if(a.extra){for(A=a.extra;d<A;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}a.offset+=h&(1<<a.extra)-1,h>>>=a.extra,d-=a.extra,a.back+=a.extra}if(a.offset>a.dmax){t.msg="invalid distance too far back",a.mode=Be;break}a.mode=16204;case 16204:if(0===l)break t;if(u=f-l,a.offset>u){if((u=a.offset-u)>a.whave&&a.sane){t.msg="invalid distance too far back",a.mode=Be;break}u>a.wnext?(u-=a.wnext,c=a.wsize-u):c=a.wnext-u,u>a.length&&(u=a.length),w=a.window}else w=i,c=s-a.offset,u=a.length;u>l&&(u=l),l-=u,a.length-=u;do{i[s++]=w[c++]}while(--u);0===a.length&&(a.mode=Le);break;case 16205:if(0===l)break t;i[s++]=a.length,l--,a.mode=Le;break;case Ne:if(a.wrap){for(;d<32;){if(0===o)break t;o--,h|=n[r++]<<d,d+=8}if(f-=l,t.total_out+=f,a.total+=f,4&a.wrap&&f&&(t.adler=a.check=a.flags?H(a.check,i,f,s-f):C(a.check,i,f,s-f)),f=l,4&a.wrap&&(a.flags?h:Ce(h))!==a.check){t.msg="incorrect data check",a.mode=Be;break}h=0,d=0}a.mode=16207;case 16207:if(a.wrap&&a.flags){for(;d<32;){if(0===o)break t;o--,h+=n[r++]<<d,d+=8}if(4&a.wrap&&h!==(4294967295&a.total)){t.msg="incorrect length check",a.mode=Be;break}h=0,d=0}a.mode=16208;case 16208:x=xe;break t;case Be:x=Ee;break t;case 16210:return Re;default:return Ae}return t.next_out=s,t.avail_out=l,t.next_in=r,t.avail_in=o,a.hold=h,a.bits=d,(a.wsize||f!==t.avail_out&&a.mode<Be&&(a.mode<Ne||e!==pe))&&Je(t,t.output,t.next_out,f-t.avail_out),_-=t.avail_in,f-=t.avail_out,t.total_in+=_,t.total_out+=f,a.total+=f,4&a.wrap&&f&&(t.adler=a.check=a.flags?H(a.check,i,f,t.next_out-f):C(a.check,i,f,t.next_out-f)),t.data_type=a.bits+(a.last?64:0)+(a.mode===Te?128:0)+(a.mode===Fe||a.mode===Ie?256:0),(0===_&&0===f||e===pe)&&x===ye&&(x=Ze),x},inflateEnd:function(t){if(Ke(t))return Ae;var e=t.state;return e.window&&(e.window=null),t.state=null,ye},inflateGetHeader:function(t,e){if(Ke(t))return Ae;var a=t.state;return 0==(2&a.wrap)?Ae:(a.head=e,e.done=!1,ye)},inflateSetDictionary:function(t,e){var a,n=e.length;return Ke(t)||0!==(a=t.state).wrap&&a.mode!==De?Ae:a.mode===De&&C(1,e,n,0)!==a.check?Ee:Je(t,e,n,n)?(a.mode=16210,Re):(a.havedict=1,ye)},inflateInfo:"pako inflate (from Nodeca project)"};var Ve=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1},$e=Object.prototype.toString,ta=K.Z_NO_FLUSH,ea=K.Z_FINISH,aa=K.Z_OK,na=K.Z_STREAM_END,ia=K.Z_NEED_DICT,ra=K.Z_STREAM_ERROR,sa=K.Z_DATA_ERROR,oa=K.Z_MEM_ERROR;function la(t){this.options=Kt({chunkSize:65536,windowBits:15,to:""},t||{});var e=this.options;e.raw&&e.windowBits>=0&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(e.windowBits>=0&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),e.windowBits>15&&e.windowBits<48&&0==(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new Qt,this.strm.avail_out=0;var a=Qe.inflateInit2(this.strm,e.windowBits);if(a!==aa)throw new Error(j[a]);if(this.header=new Ve,Qe.inflateGetHeader(this.strm,this.header),e.dictionary&&("string"==typeof e.dictionary?e.dictionary=Wt(e.dictionary):"[object ArrayBuffer]"===$e.call(e.dictionary)&&(e.dictionary=new Uint8Array(e.dictionary)),e.raw&&(a=Qe.inflateSetDictionary(this.strm,e.dictionary))!==aa))throw new Error(j[a])}function ha(t,e){var a=new la(e);if(a.push(t),a.err)throw a.msg||j[a.err];return a.result}la.prototype.push=function(t,e){var a,n,i,r=this.strm,s=this.options.chunkSize,o=this.options.dictionary;if(this.ended)return!1;for(n=e===~~e?e:!0===e?ea:ta,"[object ArrayBuffer]"===$e.call(t)?r.input=new Uint8Array(t):r.input=t,r.next_in=0,r.avail_in=r.input.length;;){for(0===r.avail_out&&(r.output=new Uint8Array(s),r.next_out=0,r.avail_out=s),(a=Qe.inflate(r,n))===ia&&o&&((a=Qe.inflateSetDictionary(r,o))===aa?a=Qe.inflate(r,n):a===sa&&(a=ia));r.avail_in>0&&a===na&&r.state.wrap>0&&0!==t[r.next_in];)Qe.inflateReset(r),a=Qe.inflate(r,n);switch(a){case ra:case sa:case ia:case oa:return this.onEnd(a),this.ended=!0,!1}if(i=r.avail_out,r.next_out&&(0===r.avail_out||a===na))if("string"===this.options.to){var l=Jt(r.output,r.next_out),h=r.next_out-l,d=qt(r.output,l);r.next_out=h,r.avail_out=s-h,h&&r.output.set(r.output.subarray(l,l+h),0),this.onData(d)}else this.onData(r.output.length===r.next_out?r.output:r.output.subarray(0,r.next_out));if(a!==aa||0!==i){if(a===na)return a=Qe.inflateEnd(this.strm),this.onEnd(a),this.ended=!0,!0;if(0===r.avail_in)break}}return!0},la.prototype.onData=function(t){this.chunks.push(t)},la.prototype.onEnd=function(t){t===aa&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=Pt(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg};var da={Inflate:la,inflate:ha,inflateRaw:function(t,e){return(e=e||{}).raw=!0,ha(t,e)},ungzip:ha,constants:K},_a=de.Deflate,fa=de.deflate,ua=de.deflateRaw,ca=de.gzip,wa=da.Inflate,ma=da.inflate,ba=da.inflateRaw,ga=da.ungzip,pa=K,va={Deflate:_a,deflate:fa,deflateRaw:ua,gzip:ca,Inflate:wa,inflate:ma,inflateRaw:ba,ungzip:ga,constants:pa};t.Deflate=_a,t.Inflate=wa,t.constants=pa,t.default=va,t.deflate=fa,t.deflateRaw=ua,t.gzip=ca,t.inflate=ma,t.inflateRaw=ba,t.ungzip=ga,Object.defineProperty(t,"__esModule",{value:!0})}));


;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./es6/index.js");
/******/ 	window.PizZip = __webpack_exports__;
/******/ 	
/******/ })()
;