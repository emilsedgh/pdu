'use strict';

var PDU     = require('../../pdu'),
    sprintf = require('sprintf');
    
function Part(parent, data, size, header)
{
    /**
     * header message
     * @var \Header
     */
    this._header;
    
    /**
     * data in pdu format
     * @var string
     */
    this._data = data;
    
    /**
     * text message
     * @var string
     */
    this._text;
    
    /**
     * size this part
     * @var integer
     */
    this._size = size;
    
    /**
     * pdu data
     * @var \Data
     */
    this._parent = parent;
    
    // have params for header
    if(header){
        var Header = PDU.getModule('PDU/Data/Header');
        // create header
        this._header = new Header(header);
    }
};

/**
 * parse pdu string
 * @param Data data
 * @return array [decoded text, text size, self object]
 * @throws Error
 */
Part.parse = function(data)
{
    var Header = PDU.getModule('PDU/Data/Header'),
        Helper = PDU.getModule('PDU/Helper'),
        DCS    = PDU.getModule('PDU/DCS');
    
    var alphabet = data.getPdu().getDcs().getTextAlphabet(),
        header   = null,
        length   = data.getPdu().getUdl() * (alphabet === DCS.ALPHABET_UCS2 ? 4 : 2),
        text     = undefined;
    
    if(data.getPdu().getType().getUdhi()){
        PDU.debug("Header.parse()");
        header = Header.parse();
    }
    
    var hex = PDU.getPduSubstr(length);
    
    switch(alphabet){
        case DCS.ALPHABET_DEFAULT:
            text = Helper.decode7bit(hex);
            break;
        
        case DCS.ALPHABET_8BIT:
            text = Helper.decode8bit(hex);
            break;
        
        case DCS.ALPHABET_UCS2:
            text = Helper.decode16Bit(hex);
            break;
        
        default:
            throw new Error("Unknown alpabet");
    }
    
    var size = text.length,
        self = new Part(data, hex, size, header);
    
    self._text = text;
    
    return [text, size, self];
};

/**
 * getter for text message
 * @return string
 */
Part.prototype.getText = function()
{
    return this._text;
};

/**
 * getter data
 * @return string
 */
Part.prototype.getData = function()
{
    return this._data;
};

/**
 * getter header
 * @return Header
 */
Part.prototype.getHeader = function()
{
    return this._header;
};

/**
 * getter parent of part
 * @return \Data
 */
Part.prototype.getParent = function()
{
    return this._parent;
};

/**
 * getter size
 * @return integer
 */
Part.prototype.getSize = function()
{
    return this._size;
};

/**
 * convert pdu to srting
 * @return string
 */
Part.prototype._getPduString = function()
{
    return this._parent.getPdu().getStart().toString();
};

/**
 * to hex
 * @return string
 */
Part.prototype._getPartSize = function()
{
    return sprintf("%02X", this._size);
};

/**
 * magic method for cast part to string
 * @return string
 */
Part.prototype.toString = function()
{
    PDU.debug("_getPduString() " + this._getPduString());
    PDU.debug("_getPartSize() "  + this._getPartSize());
    PDU.debug("getHeader() "     + this.getHeader());
    PDU.debug("getData() "       + this.getData());
        
    // concate pdu, size of part, headers, data
    return '' + 
           (this._getPduString() || '') + 
           (this._getPartSize()  || '') + 
           (this.getHeader()     || '') +
           (this.getData()       || '');
};

module.exports = Part;