/**
 * @fileoverview Validates rule options.
 * @author Brandon Mills
 * @copyright 2015 Brandon Mills
 */

"use strict";

var rules = require("./rules"),
    validator = require("is-my-json-valid");

var validators = Object.create(null); // Cache generated schema validators

/**
 * Converts a rule's exported, abbreviated schema into a full schema.
 * @param {object} options Exported schema from a rule.
 * @returns {object} Full schema ready for validation.
 */
function makeSchema(options) {
    var items;

    if (!options) {
        return {
            "type": "array",
            "items": [
                {
                    "enum": [0, 1, 2]
                }
            ],
            "minItems": 1
        };
    }

    items = options.items || options;

    return {
        "type": "array",
        "items": [
            {
                "enum": [0, 1, 2]
            }
        ].concat(items),
        "minItems": (options.minItems || 0) + 1,
        "maxItems": items.length + 1
    };
}

/**
 * Validates a rule's options against its schema.
 * @param {string} id The rule's unique name.
 * @param {object} config The given options for the rule.
 * @param {string} source The name of the configuration source.
 * @returns {void}
 */
module.exports = function (id, config, source) {
    var level, message, rule, validate;

    // Skip plugin rules, as they may not be available.
    if (id.indexOf("/") >= 0) {
        return;
    }

    level = typeof config === "number" ? config : config[0];
    if (!(0 <= level && level <= 2)) {
        throw new Error([
            source, ":\n",
            "\tConfiguration for rule \"", id, "\" is invalid:\n",
            "\tWarning level must be between 0 (off) and 2 (error).\n"
        ].join(""));
    }

    validate = validators[id];
    if (!validate) {
        rule = rules.get(id);

        if (!rule) {
            throw new Error([
                source, ":\n",
                "\tDefinition for rule \"", id, "\" was not found.\n"
            ].join(""));
        }

        validate = validator(makeSchema(rule.schema), { verbose: true });
        validators[id] = validate;
    }

    if (typeof config === "number") {
        return;
    }

    validate(config);

    if (validate.errors) {
        message = [
            source, ":\n",
            "\tConfiguration for rule \"", id, "\" is invalid:\n"
        ];
        validate.errors.forEach(function (error) {
            message.push(
                "\tValue \"", error.value, "\" ", error.message, ".\n"
            );
        });

        throw new Error(message.join(""));
    }
};
