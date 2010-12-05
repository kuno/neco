var StringDecoder = exports.StringDecoder = function (encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/,'');
  if (this.encoding === 'utf8') {
    this.charBuffer = new Buffer(4);
    this.charReceived = 0;
    this.charLength = 0;
  }
};


StringDecoder.prototype.write = function (buffer) {
  // If not utf8...
  if (this.encoding !== 'utf8') {
    return buffer.toString(this.encoding);
  }

  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  if (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var i = (buffer.length >= this.charLength - this.charReceived)
      ? this.charLength - this.charReceived
      : buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, i);
    this.charReceived += i;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString();
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (i == buffer.length) return charStr;

    // otherwise cut off the characters end from the beginning of this buffer
    buffer = buffer.slice(i, buffer.length);
  }


  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // figure out if one of the last i bytes of our buffer announces an incomplete char
  for (; i > 0; i--) {
    c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }

  if (!this.charLength) {
    // no incomplete char at the end of this buffer, emit the whole thing
    return charStr + buffer.toString();
  }

  // buffer the incomplete character bytes we got
  buffer.copy(this.charBuffer, 0, buffer.length - i, buffer.length);
  this.charReceived = i;

  if (buffer.length - i > 0) {
    // buffer had more bytes before the incomplete char, emit them
    return charStr + buffer.toString('utf8', 0, buffer.length - i);
  }

  // or just emit the charStr
  return charStr;
};
