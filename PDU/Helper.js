'use strict';

var PDU     = require('./pdu'),
	Type    = require('./Type'),
	sprintf = require('sprintf');
	
function Helper()
{
	
}

Helper._limitNormal   = 140;
Helper._limitCompress = 160;
Helper._limitUnicode  = 70;

/**
 * set limit
 * @param integer $limit
 * @param string $type
 */
Helper.setlimit = function(limit, type)
{
	//self::${'_limit' . ucfirst($type)} = $limit;
};

/**
 * getter for limit
 * @param string $type
 * @return integer
 */
Helper.getlimit = function(type)
{
	//return self::${'_limit' . ucfirst($type)};
};

/**
 * ord() for unicode
 * @param string $char
 * @param string $encoding
 * @return integer
 */
Helper.order = function(char, encoding) // = "UTF-8"
{
	//$char = mb_convert_encoding($char, "UCS-4BE", $encoding);
	//$order = unpack("N", $char);
	//return ($order ? $order[1] : null);
};

/**
 * chr() for unicode
 * @param integer $order
 * @param string $encoding
 * @return string
 */
Helper.char = function(order, encoding) //  = "UTF-8"
{
	//$order = pack("N", $order);
	//$char = mb_convert_encoding($order, $encoding, "UCS-4BE");
	//return $char;
};
	
/**
 * decode message from unicode
 * @param string $text
 * @return srting
 */
Helper.decode16Bit = function(text)
{
	/*
	return implode(
		"",
		array_map(
			array('self', 'char'),
			array_map(
				'hexdec',
				str_split(
					$text, 
					4
				)
			)
		)
	);
	*/
};
	
/**
 * decode message
 * @param string $text
 * @return string
 */
Helper.decode8Bit = function(text)
{
	/*
	var buffer = new Buffer(text, "ascii");
	
	return implode(
		"",
		array_map(
			array('self', 'char'),
			array_map(
				'hexdec',
				str_split(
					$text, 
					2
				)
			)
		)
	);
	*/
};

/**
 * decode message from 7bit
 * @param string $text
 * @return string
 */
Helper.decode7bit = function(text)
{
	var ret = [],
		data = new Buffer(text, "hex"),
		mask = 0xFF,
		shift = 0,
		carry = 0;
	
	for(var i = 0; i < data.length; i++){
		var char = data[i];
		if(shift == 7){
			ret.push(carry);
			carry = 0;
			shift = 0;
		}
		
		var a = (mask >> (shift+1)) & 0xFF,
			b = a ^ 0xFF;

		var digit = (carry) | ((char & a) << (shift)) & 0xFF;
		carry = (char & b) >> (7-shift);
		ret.push(digit);

		shift++;
	}
	
	if (carry){
		ret.push(carry);
	}
	
	return (new Buffer(ret, "binary")).toString();
}

/**
 * encode message
 * @param string $text
 * @return array
 */
Helper.encode8Bit = function(text)
{
	var length = 0,
		pdu    = '',
		buffer = new Buffer(text, "ascii");

	for(var i = 0; i < buffer.length; i++){
		pdu += sprintf("%02X", buffer[i]);
		length++;
	}
	
	return [length, pdu];
};

/**
 * encode message
 * @param string $text
 * @return array
 */
Helper.encode7bit = function(text)
{
	var ret   = ["%02X"],
		data  = new Buffer(text, "utf-8"),
		mask  = 0xFF,
		shift = 0,
		len   = data.length;
	
	for (var i = 0; i < len; i++) {
		
		var char     = data[i] & 0x7F,
			nextChar = (i+1 < len) ? (data[i+1] & 0x7F) : 0;
		
		if (shift == 7) { shift = 0; continue; }
		
		var carry  = (nextChar & (((mask << (shift+1)) ^ 0xFF) & 0xFF)),
			digit  = ((carry << (7-shift)) | (char >> shift) ) & 0xFF;
	
		ret.push(digit);
		
		shift++;
	}
	
	return [len, sprintf.apply(undefined, ret)];
};

/**
 * encode message
 * @param string $text
 * @return array
 */
Helper.encode16Bit = function(text)
{
	var length = 0,
		pdu    = '';
	
	for(var i = 0; i < text.length; i++){
		var byte    = Helper.order(text.substr(i, 1));
			pdu    += sprintf("%04X", byte);
			length += 2;
	}
	
	return [length, pdu];
};
	
/**
 * get pdu object by type
 * @return Deliver|Submit|Report
 * @throws Exception
 */
Helper.getPduByType = function()
{
	// parse type of sms
	var type = Type.parse(),
		self = null;
	
	switch(type.getMti()){
		case Type.SMS_DELIVER:
			self = new Deliver();
			break;
	
		case Type.SMS_SUBMIT:
			self = new Submit();
			
			var buffer = new Buffer(PDU.getPduSubstr(2), 'hex');
			// get mr
			self.setMr(buffer[0]);
			break;
		
		case Type.SMS_REPORT:
			self = new Report();
	
			var buffer = new Buffer(PDU.getPduSubstr(2), 'hex');
			// get reference
			self.setReference(buffer[0]);
			break;
		
		default:
			throw new Error("Unknown sms type");
			
	}
	
	// set type
	self.setType(type);
	
	return self;
};

Helper.initVars = function(pdu)
{
	// if is the report status
	if(pdu.getType() instanceof require('./Type/Report')){
		// parse timestamp
		pdu.setDateTime(SCTS.parse());
		
		// parse discharge
		pdu.setDischarge(SCTS.parse());
		
		var buffer = new Buffer(PDU.getPduSubstr(2), 'hex');
		// get status
		pdu.setStatus(buffer[0]);
	} else {
		// get pid
		pdu.setPid(PID.parse());

		// parse dcs
		pdu.setDcs(DCS.parse());

		// if this submit sms
		if(pdu.getType() instanceof require('./Type/Submit')){
			// parse vp
			pdu.setVp(VP.parse(pdu));
		} else {
			// parse scts
			pdu.setScts(SCTS.parse());
		}

		var buffer = new Buffer(PDU.getPduSubstr(2), 'hex');
		// get data length
		pdu.setUdl(buffer[0]);

		// parse data
		pdu.setData(Data.parse(pdu));
	}
		
	return pdu;
};

modules.export = Helper;