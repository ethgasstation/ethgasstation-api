/**
 * Maps JSON objects into other ones.
 *
 * Allows for API translation from the backend without needing to change the
 * reports coming from the backend. Presentation in the API shouldn't be reliant
 * on how the JSON really is laid out from the backend too much.
 */

const fs = require('fs');

class JSONMapper {

    constructor(json_file_or_object=null) {
        if (json_file_or_object !== null) {
            this._getObject(json_file_or_object);
        }
    }

    mapKeys (key_pairs, json_file_or_object=null) {
        if (json_file_or_object !== null) {
            this._getObject(json_file_or_object);
        }
        let formedObject = {};
        if(!Array.isArray(key_pairs)) {
            throw new Error("key_pairs array is not an array");
        }
        key_pairs.forEach((key_pair) => {
            if (!Array.isArray(key_pair)) return;
            if (Object.keys(this.json_object).indexOf(key_pair[0]) >= 0) {
                if (key_pair.length === 3) {
                    // conversion step
                    formedObject[key_pair[1]] = this._convert(
                        this.json_object[key_pair[0]], key_pair[2]);
                } else {
                    formedObject[key_pair[1]] = this.json_object[key_pair[0]];
                }
            }
        });
        return formedObject;
    }

    _getObject (json_file_or_object) {
        switch (typeof json_file_or_object) {
            case 'string':
                if (json_file_or_object[0] === '{') {
                    try {
                        this.json_object = JSON.parse(json_file_or_object);
                    }
                    catch (e) {
                        throw new Error("Could not parse incoming JSON object.");
                    }
                } else {
                    // careful here
                    // TODO force whitelist readable directories to prevent
                    // arbitrary file reads
                    if (fs.existsSync(json_file_or_object)) {
                        try {
                            let contents = fs.readFileSync(json_file_or_object, 'utf-8');
                            this.json_object = JSON.parse(contents);
                        }
                        catch (e) {
                            throw new Error("Could not read/parse specified JSON file.")
                        }
                    } else {
                        throw new Error("Could not read specified filepath")
                    }
                }
                break;
            case 'object':
                this.json_object = json_file_or_object;
                break;
            default:
                throw new Error("Unparseable type " + typeof json_file_or_object)
                break;
        }
    }

    _convert (data, conversion_type) {
        switch(conversion_type) {
            case '10gwei_to_gwei':
                return parseFloat(data) * 10.0;
            case 'to_int':
                return parseInt(data);
            default:
                return conversion_type;
        }
    }

}

module.exports = JSONMapper;