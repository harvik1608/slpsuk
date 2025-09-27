const bcrypt = require("bcrypt");
const moment = require("moment");
const crypto = require('crypto');

const secretKey = '12345678901234567890123456789012';

module.exports = {
    ParamValidation: async (paramArray, data) => {
        let NovalueParam = [];

        // Check if data is a valid object
        if (typeof data !== 'object' || data === null) {
            data = {};
        }

        paramArray.forEach(val => {
            if (!Object.prototype.hasOwnProperty.call(data, val) || data[val] === '') {
                NovalueParam.push(val);
            }
        });

        return NovalueParam;
    },

    encryptId: (id) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
        let encrypted = cipher.update(id.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    },

    decryptId: (encryptedData) => {
        const [ivHex, encrypted] = encryptedData.split(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), Buffer.from(ivHex, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    },

    format_date: (date) => {
        return moment(date).format("DD MMM, YYYY");
    },

    day: (date) => {
        return moment(date).format("dddd");
    },

    format_time: (time) => {
        return moment(time).format("hh:mm A");
    },
};