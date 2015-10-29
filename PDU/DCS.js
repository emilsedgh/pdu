'use strict';

var PDU     = require('../pdu'),
    sprintf = require('sprintf');
    
function DCS()
{
    /**
     * type encoding group
     * @var integer
     */
    this._encodeGroup = 0x00;
    
    /**
     * specific data for encoding
     * @var integer
     */
    this._dataEncoding = 0x00;
    
    /**
     * is compressed text
     * @var boolean
     */
    this._compressedText = true;
    
    /**
     * Text alphabet
     * @var integer
     */
    this._alphabet = DCS.ALPHABET_DEFAULT;
    
    /**
     * use message class
     * @var boolean
     */
    this._useMessageClass = false;
    
    /**
     * current class message
     * @var integer
     */
    this._classMessage = DCS.CLASS_NONE;
    
    /**
     * Discard Message
     * @var boolean
     */
    this._discardMessage = false;
    
    /**
     * Store Message
     * @var boolean
     */
    this._storeMessage = false;
    
    /**
     * Store Message UCS2
     * @var boolean
     */
    this._storeMessageUCS2 = false;
    
    /**
     * set 4-7 bits to 1 why for this, dont know
     * @var boolean
     */
    this._dataCodingAndMessageClass = false;
    
    /**
     * Message indication
     * @var integer
     */
    this._messageIndication = false;
    
    /**
     * set message type
     * @var integer
     */
    this._messageIndicationType = false;
}

/**
 * GSM 03.38 V7.0.0 (1998-07).
 */
    
DCS.CLASS_NONE                 = 0x00;
DCS.CLASS_MOBILE_EQUIPMENT     = 0x01;
DCS.CLASS_SIM_SPECIFIC_MESSAGE = 0x02;
DCS.CLASS_TERMINAL_EQUIPMENT   = 0x03;

DCS.INDICATION_TYPE_VOICEMAIL  = 0x00;
DCS.INDICATION_TYPE_FAX        = 0x01;
DCS.INDICATION_TYPE_EMAIL      = 0x02;
DCS.INDICATION_TYPE_OTHER      = 0x03;

DCS.ALPHABET_DEFAULT           = 0x00;
DCS.ALPHABET_8BIT              = 0x01;
DCS.ALPHABET_UCS2              = 0x02; // 16 bit unicode
DCS.ALPHABET_RESERVED          = 0x03;


/**
 * parse pdu string
 * @return DCS
 */
DCS.parse = function()
{
    var dcs    = new DCS(),
        buffer = new Buffer(PDU.getPduSubstr(2), 'hex'),
        byte   = buffer[0];
    
    dcs._encodeGroup  = 0x0F&(byte>>4);
    dcs._dataEncoding = 0x0F&byte;
    
    dcs._alphabet     = (3 & (dcs._dataEncoding>>2));
    dcs._classMessage = (3 & dcs._dataEncoding);
    
    switch(dcs._encodeGroup){
        case 0x0C: dcs._discardMessage            = true; break;
        case 0x0D: dcs._storeMessage              = true; break;
        case 0x0E: dcs._storeMessageUCS2          = true; break;
        case 0x0F: 
            dcs._dataCodingAndMessageClass = true; 
            
            if(dcs._dataEncoding & (1<<2)){
                dcs._alphabet = DCS.ALPHABET_8BIT;
            }
            
            break;
        
        default:
            
            if(dcs._encodeGroup & (1<<4)){
                dcs._useMessageClass = true;
            }
            
            if(dcs._encodeGroup & (1<<5)){
                dcs._compressedText = true;
            }
    }
    
    if(dcs._discardMessage || dcs._storeMessage || dcs._storeMessageUCS2){
        
        if(dcs._dataEncoding & (1<<3)){
            dcs._messageIndication     = true;
            dcs._messageIndicationType = (3 & dcs._dataEncoding);
        }
        
    }
    
    return dcs;
};

/**
 * getter byte value
 * @return integer
 */
DCS.prototype.getValue = function()
{
    this._encodeGroup = 0x00;
    
    // set data encoding, from alphabet and message class
    this._dataEncoding = (this._alphabet<<2)|(this._classMessage);
    
    // set message class bit
    if(this._useMessageClass){
        this._encodeGroup |= (1<<4);
    } else {
        this._encodeGroup &= ~(1<<4);
    }
    
    // set is compressed bit
    if(this._compressedText){
        this._encodeGroup |= (1<<5);
    } else {
        this._encodeGroup &= ~(1<<5);
    }
    
    // change encoding format
    if(this._discardMessage || this._storeMessage || this._storeMessageUCS2){
        this._dataEncoding = 0x00;
        
        // set indication
        if(this._messageIndication){
            this._dataEncoding |= (1<<3);
            
            // set message indication type
            this._dataEncoding |= this._messageIndicationType;
        }
        
    }
    
    // Discard Message
    if(this._discardMessage){
        this._encodeGroup = 0x0C;
    }
    
    // Store Message
    if(this._storeMessage){
        this._encodeGroup = 0x0D;
    }
    
    // Store Message UCS2
    if(this._storeMessageUCS2){
        this._encodeGroup = 0x0E;
    }
    
    // Data Coding and Message Class
    if(this._dataCodingAndMessageClass){
        // set bits to 1
        this._encodeGroup = 0x0F;
        
        // only class message
        this._dataEncoding = 0x03&this._classMessage;
        
        // check encoding
        switch(this._alphabet){
            case DCS.ALPHABET_8BIT:
                this._dataEncoding |= (1<<2);
                break;
            case DCS.ALPHABET_DEFAULT:
                // bit is set to 0
                break;
            default:
                
                break;
                
        }
    }
    
    // return byte value
    return ((0x0F&this._encodeGroup)<<4) | (0x0F&this._dataEncoding);
};

/**
 * method for cast to string
 * @return string
 */
DCS.prototype.toString = function()
{
    return sprintf("%02X", this.getValue());
};

/**
 * Set store message
 * @return \self
 */
DCS.prototype.setStoreMessage = function()
{
    this._storeMessage = true;
    return this;
};

/**
 * Set store message UCS2
 * @return \self
 */
DCS.prototype.setStoreMessageUCS2 = function()
{
    this._storeMessageUCS2 = true;
    return this;
};

/**
 * set message indication
 * @param integer $indication
 * @return \self
 */
DCS.prototype.setMessageIndication = function(indication)
{
    this._messageIndication = (1 & indication);
    return this;
};

/**
 * set message indication type
 * @param integer $type
 * @return \self
 * @throws Error
 */
DCS.prototype.setMessageIndicationType = function(type)
{
    this._messageIndicationType = 0x03&type;
    
    switch(this._messageIndicationType){
        case DCS.INDICATION_TYPE_VOICEMAIL: 
            
            break;
        
        case DCS.INDICATION_TYPE_FAX:
            
            break;
        
        case DCS.INDICATION_TYPE_EMAIL:
            
            break;
        
        case DCS.INDICATION_TYPE_OTHER:
            
            break;
        
        default:
            throw new Error("Wrong indication type");
    }
    
    return this;
};

/**
 * Set discard message
 * @return \self
 */
DCS.prototype.setDiscardMessage = function()
{
    this._discardMessage = true;
    return this;
};


/**
 * set text is compressed
 * @param boolean $compressed
 * @return \self
 */
DCS.prototype.setTextCompressed = function(compressed)
{
    if(compressed === undefined){
        compressed = true;
    }
    
    this._compressedText = compressed;
    return this;
};

/**
 * get text is compressed
 * @return boolean
 */
DCS.prototype.getTextCompressed = function()
{
    return !!this._compressedText;
};

/**
 * set text alphabet
 * @param integer $alphabet
 * @return \self
 * @throws Exception
 */
DCS.prototype.setTextAlphabet = function(alphabet)
{
    this._alphabet = (0x03&alphabet);
    
    switch(this._alphabet){
        case DCS.ALPHABET_DEFAULT:
            this.setTextCompressed();
            break;
        
        case DCS.ALPHABET_8BIT:
            
            break;
        
        case DCS.ALPHABET_UCS2:
            
            break;
        
        case DCS.ALPHABET_RESERVED:
            
            break;
        
        default:
            throw new Error("Wrong alphabet");
    }
    
    return this;
};

/**
 * getter text alphabet
 * @return integer
 */
DCS.prototype.getTextAlphabet = function()
{
    return this._alphabet;
};

/**
 * change message class
 * @param integer $class
 * @return \self
 * @throws Exception
 */
DCS.prototype.setClass = function(cls)
{
    this.setUseMessageClass();
    this._classMessage = (0x03&cls);
    
    switch(this._classMessage){
        case DCS.CLASS_NONE: 
            this.setUseMessageClass(false); 
            break;
        
        case DCS.CLASS_MOBILE_EQUIPMENT: 
            
            break;
        
        case DCS.CLASS_SIM_SPECIFIC_MESSAGE: 
            
            break;
        
        case DCS.CLASS_TERMINAL_EQUIPMENT: 
            
            break;
        
        default: 
            throw new Error("Wrong class type");
    }
    
    return this;
};

/**
 * set use message class
 * @return \self
 * @param boolean $use
 */
DCS.prototype.setUseMessageClass = function(use)
{
    if(use === undefined){
        use = true;
    }
    
    this._useMessageClass = use;
    return this;
};

module.exports = DCS;