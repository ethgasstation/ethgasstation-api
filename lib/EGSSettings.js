/**
 * Read the EthGasStation global settings file.
 *
 * This is a JavaScript implementation of ethgasstation-backend's egs.settings
 * and is meant to maintain feature parity.
 */

const ini  = require('ini');
const fs   = require('fs');
const path = require('path');

const DEFAULT_INI_LOCATIONS = [
        '/etc/ethgasstation/settings.conf',
        '/etc/ethgasstation.conf',
        '/etc/default/ethgasstation.conf',
        '/opt/ethgasstation/settings.conf'
    ];

let instance = null;

class EGSSettings {

    constructor(autoload=true) {
        if (instance === null) {
            instance = this;
            this.settings = {};
            this.loaded = false;

            if (autoload === true) {
                this.settings_filepath = this.getSettingsFilepath();
                this.loadSettings(this.settings_filepath);
            }
        }
        return instance;
    }

    /**
     * Returns a boolean if the settings file has been loaded.
     * @returns {Boolean}
     */
    settingsFileLoaded() {
        return (this.loaded === true);
    }

    /**
     * Retrieves a setting from the ini file.
     * @param {String} section Section of INI file to read from
     * @param {String} name Name of data in section.
     * @returns {*}
     */
    getSetting(section, name) {
        if (Object.keys(this.settings).indexOf(section) === -1 ||
            Object.keys(this.settings[section]).indexOf(name) === -1) {
            let setting = section + '.' + name;
            throw new Error("Cannot find setting " + setting +
                            " in configuration.");
        } else {
            return this.settings[section][name];
        }
    }

    /**
     * Get an absolute filepath to the settings INI file.
     */
    getSettingsFilepath() {
        // development override in .env
        if (process.env.NODE_ENV === 'development' &&
            process.env.SETTINGS_FILE &&
            fs.existsSync(process.env.SETTINGS_FILE)) {
            console.warn("WARN: Settings file override in dev.");
            console.warn("Using settings file " + process.env.SETTINGS_FILE);
            return path.normalize(process.env.SETTINGS_FILE);
        }

        for (let i = 0; i < DEFAULT_INI_LOCATIONS.length; i++ ) {
            let candidateLocation = DEFAULT_INI_LOCATIONS[i];
            if (fs.existsSync(candidateLocation)) {
                return path.normalize(candidateLocation);
            }
        }

        throw new Error("Could not find configuration file.");
    }

    /**
     * Load settings from an external file into instance variable.
     * @param {String} settingsFile Absolute path to settings ini file.
     */
    loadSettings(settingsFile=null) {
        if (settingsFile === null) {
            settingsFile = this.getSettingsFilepath();
            this.settings_filepath = settingsFile;
        }
        this.settings = ini.parse(fs.readFileSync(settingsFile, 'utf-8'));
        this.loaded = true;
        return this.settings;
    }

}

module.exports = new EGSSettings(true);