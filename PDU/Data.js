'use strict';

var PDU     = require('../pdu'),
    sprintf = require('sprintf');
    
function Data(pdu)
{
    /**
     * data length
     * @var integer
     */
    this._size;
    
    /**
     * text message
     * @var string
     */
    this._data;
    
    /**
     * parts sms
     * @var array
     */
    this._parts = [];
    
    /**
     * text message is unicode
     * @var boolean
     */
    this._isUnicode = false;
    
    /**
     * message object
     * @var PDU
     */
    this._pdu = pdu;
}

Data.HEADER_SIZE = 7; //UDHL + UDH

/**
 * parse pdu string
 * @param PDU $pdu
 * @return \self
 */
Data.parse = function(pdu)
{
    var DCS  = PDU.getModule('PDU/DCS'),
        Part = PDU.getModule('PDU/Data/Part');
    var data = new Data(pdu);
    
    if(pdu.getDcs().getTextAlphabet() === DCS.ALPHABET_UCS2){
        data._isUnicode = true;
    }
    
    var tmp = Part.parse(data);
    data._data = tmp[0];
    data._size = tmp[1];
    var part   = tmp[2];
    
    data._parts.push(part);
    
    return data;
};

/**
 * merge parts
 * @param PDU $pdu
 */
Data.prototype.append = function(pdu)
{
    pdu.getParts().forEach(function(part){
        if( ! this._partExists(part)){
            this._parts.push(part);
        }
    });
    
    this._sortParts();
};

/**
 * check exists new part
 * @param Data\Part $part
 * @throws Exception if not equals pointers
 * @return boolean
 */
Data.prototype._partExists = function(part)
{
    var result = false;
    this._parts.forEach(function(_part){
        if(part.getHeader().getPointer() !== _part.getHeader().getPointer()){
            throw new Error("Part from different message");
        }
        
        if(_part.getHeader().getCurrent() === part.getHeader().getCurrent()){
            result = false;
            return false;
        }
    });
    
    return result;
};

/**
 * sorting parts
 */
Data.prototype._sortParts = function()
{
    this._parts.sort(function(part1, part2){
        var index1 = part1.getHeader().getCurrent(),
            index2 = part2.getHeader().getCurrent();
        
        return index1 > index2 ? 1 : -1;
    });
    
    this._data = this._parts.map(function(part){
        return part.getText();
    }).join('');
};

/**
 * set text message
 * @param string $data
 */
Data.prototype.setData = function(data)
{
    this._data = data;
    
    // encode message
    this._checkData();
    
    // preapre parts
    this._prepareParts();
};

/**
 * check message
 */
Data.prototype._checkData = function()
{
    var Helper = PDU.getModule('PDU/Helper');
    
    // set is unicode to false
    this._isUnicode = false;
    // set zero size
    this._size = 0;
    
    // check message
    for(var i = 0; i < this._data.length; i++){
        // get byte
        var byte = Helper.order(this._data.substr(i, 1));
        
        if(byte > 0xC0){
            this._isUnicode = true;
        }
        
        this._size++;
    }
    
};
    
/**
 * prepare parts of message
 * @throws Exception
 */
Data.prototype._prepareParts = function()
{
    var DCS        = PDU.getModule('PDU/DCS'),
        Helper     = PDU.getModule('PDU/Helper'),
        Part       = PDU.getModule('PDU/Data/Part');
    var headerSize = Data.HEADER_SIZE;
    var max        = Helper.getLimit('normal');
    
    if(this._isUnicode){
        // max length sms to unicode
        max = Helper.getLimit('unicode');
        // can't compress message
        this.getPdu()
            .getDcs()
            .setTextCompressed(false)               // no compress
            .setTextAlphabet(DCS.ALPHABET_UCS2);    // type alphabet is UCS2
    }
    
    // if message is compressed
    if(this.getPdu().getDcs().getTextCompressed()){
        max = Helper.getLimit('compress');
        headerSize++;
    }
    
    var parts  = this._splitMessage(max, headerSize),
        header = (parts.length > 1),
        uniqid = Math.floor(Math.random() * 0xFFFF);
    
    // message will be splited, need headers
    if(header){
        this.getPdu().getType().setUdhi(1);
    }
    
    var self = this;
    parts.forEach(function(text, index){
        
        PDU.debug("Part: [" + index + "] " + text);
        var params = (header ? {'SEGMENTS': parts.length,'CURRENT': (index+1),'POINTER': uniqid} : undefined);
        
        var part = null,
            size = 0,
            tmp;
        
        switch(self.getPdu().getDcs().getTextAlphabet()){
            
            case DCS.ALPHABET_DEFAULT:
                PDU.debug("Helper.encode7bit(text)");
                tmp = Helper.encode7bit(text);
                break;
            
            case DCS.ALPHABET_8BIT:
                PDU.debug("Helper.encode8Bit(text)");
                tmp = Helper.encode8Bit(text);
                break;
            
            case DCS.ALPHABET_UCS2:
                PDU.debug("Helper.encode16Bit(text)");
                tmp = Helper.encode16Bit(text);
                break;
            
            default:
                throw new Eerror("Unknown alphabet");
        }
        
        size = tmp[0];
        part = tmp[1];
        
        if(header){
            size += headerSize;
        }
        
        self._parts.push(new Part(self, part, size, params));
    });
    
};

/**
 * split message
 * @param integer $max
 * @return array
 */
Data.prototype._splitMessage = function(max, header)
{
    if(header === undefined){
        header = Data.HEADER_SIZE;
    }
    
    // size less or equal max
    if(this.getSize() <= max){
        return [this._data];
    }
    
    // parts of message
    var data   = [],
        offset = 0,
        size   = max - header;
    
    while(true)
    {
        var part = this._data.substr(offset, size);
        data.push(part);
        offset += size;
        
        if(offset >= this.getSize()){
            break;
        }
        
    }
    
    return data;
};


/**
 * getter text message
 * @return string
 */
Data.prototype.getData = function()
{
    return this._data;
};

/**
 * getter pdu
 * @return PDU
 */
Data.prototype.getPdu = function()
{
    return this._pdu;
};

/**
 * getter data size
 * @return integer
 */
Data.prototype.getSize = function()
{
    return this._size;
};

/**
 * get message parts
 * @return array
 */
Data.prototype.getParts = function()
{
    return this._parts;
};

module.exports = Data;