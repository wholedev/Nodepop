'use strict';

var mongoose = require('mongoose');
var ErrorMessage = mongoose.model('ErrorMessage');
var express = require('express');

/** @function getErrorMessagesFromCollection
 * @description Get Error from messages
 * @param rows
 * @returns {Promise}
 */
function getErrorMessagesFromCollection(rows) {
    var errorMessageEnum = {};
    var promise = new Promise(function(result, reject) {
        rows.forEach(function(element, index) {
            try {
                errorMessageEnum[element.identifier] = element.id;
            }catch (err) {
                reject(err);
            }
            if (index == rows.length - 1) {
                result(errorMessageEnum);
            }
        });
    });
    return promise;
}

function getEnums() {
    ErrorMessage.listIdentifiers()
        .then(getErrorMessagesFromCollection)
        .then(function(res) { express.errorMessageEnum = res; })
        .catch(function(err) { console.error(err); });
}

getEnums();

function extractLanguageForRequest(req) {
    let header;
    if (req.headers.lang) {
        switch (req.headers.lang) {
            case 'es':
                header = 'es';
                break;
            case 'en':
                header = 'en';
                break;
            default:
                header = 'en';
        }
    } else {
        header = 'en';
    }
    return header;
}

function errorAPIHandler(err, req, res, next) {
    if (err) {
        var language = extractLanguageForRequest(req);
        ErrorMessage.getErrorMessage(err.message,language)
            .then(function(errorMessage) {
                res.status(errorMessage.statusCode);
                res.json({
                    success: false,
                    message: {id: errorMessage.identifier,
                        status: errorMessage.statusCode,
                        description: errorMessage.messages[0].message}
                });
                return;
            })
            .catch(function(err) {
                console.error(err);
                next();
            });
    }
}
module.exports = errorAPIHandler;
