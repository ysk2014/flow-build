const Ajv = require("ajv");
const schema = require("./optionsSchema.json");
const BaseError = require("../BaseError");

const ajv = new Ajv({
	errorDataPath: "configuration",
	allErrors: true,
	verbose: true,
	useDefaults: true
});

const filterErrors = (errors) => {
	let newErrors = [];
	errors.forEach((err) => {
		const dataPath = err.dataPath;
		let children = [];
		newErrors = newErrors.filter((oldError) => {
			if(oldError.dataPath.includes(dataPath)) {
				if(oldError.children) {
					children = children.concat(oldError.children.slice(0));
				}
				oldError.children = undefined;
				children.push(oldError);
				return false;
			}
			return true;
		});
		if(children.length) {
			err.children = children;
		}
		newErrors.push(err);
	});

	return newErrors;
}

const getSchemaPart = (path, parents, additionalPath) => {
	parents = parents || 0;
	path = path.split("/");
	path = path.slice(0, path.length - parents);
	if(additionalPath) {
		additionalPath = additionalPath.split("/");
		path = path.concat(additionalPath);
	}
	let schemaPart = schema;
	for(let i = 1; i < path.length; i++) {
		const inner = schemaPart[path[i]];
		if(inner)
			schemaPart = inner;
	}
	return schemaPart;
};

const getSchemaPartText = (schemaPart, additionalPath) => {
	if(additionalPath) {
		for(let i = 0; i < additionalPath.length; i++) {
			const inner = schemaPart[additionalPath[i]];
			if(inner)
				schemaPart = inner;
		}
	}
	while(schemaPart.$ref) schemaPart = getSchemaPart(schemaPart.$ref);
	let schemaText = OptionsValidationError.formatSchema(schemaPart);
	if(schemaPart.description)
		schemaText += `\n-> ${schemaPart.description}`;
	return schemaText;
};

const getSchemaPartDescription = schemaPart => {
	while(schemaPart.$ref) schemaPart = getSchemaPart(schemaPart.$ref);
	if(schemaPart.description)
		return `\n-> ${schemaPart.description}`;
	return "";
};

const filterChildren = children => {
	return children.filter(err => err.keyword !== "anyOf" && err.keyword !== "allOf" && err.keyword !== "oneOf");
};

const indent = (str, prefix, firstLine) => {
	if(firstLine) {
		return prefix + str.replace(/\n(?!$)/g, "\n" + prefix);
	} else {
		return str.replace(/\n(?!$)/g, `\n${prefix}`);
	}
};

class OptionsValidationError extends BaseError {
	constructor(validationErrors) {
		super();

		this.name = "OptionsValidationError";
		this.message = "Invalid configuration object. " +
			"Flow has been initialised using a configuration object that does not match the API schema.\n" +
			validationErrors.map(err => " - " + indent(OptionsValidationError.formatValidationError(err), "   ", false)).join("\n");
		this.validationErrors = validationErrors;

		Error.captureStackTrace(this, this.constructor);
	}

	static formatSchema(schema, prevSchemas) {
		prevSchemas = prevSchemas || [];

		const formatInnerSchema = (innerSchema, addSelf) => {
			if(!addSelf) return OptionsValidationError.formatSchema(innerSchema, prevSchemas);
			if(prevSchemas.indexOf(innerSchema) >= 0) return "(recursive)";
			return OptionsValidationError.formatSchema(innerSchema, prevSchemas.concat(schema));
		};

		if(schema.type === "string") {
			if(schema.minLength === 1)
				return "non-empty string";
			else if(schema.minLength > 1)
				return `string (min length ${schema.minLength})`;
			return "string";
		} else if(schema.type === "boolean") {
			return "boolean";
		} else if(schema.type === "number") {
			return "number";
		} else if(schema.type === "object") {
			if(schema.properties) {
				const required = schema.required || [];
				return `object { ${Object.keys(schema.properties).map(property => {
					if(required.indexOf(property) < 0) return property + "?";
					return property;
				}).concat(schema.additionalProperties ? ["..."] : []).join(", ")} }`;
			}
			if(schema.additionalProperties) {
				return `object { <key>: ${formatInnerSchema(schema.additionalProperties)} }`;
			}
			return "object";
		} else if(schema.type === "array") {
			return `[${formatInnerSchema(schema.items)}]`;
		}

		switch(schema.instanceof) {
			case "Function":
				return "function";
			case "RegExp":
				return "RegExp";
		}
		if(schema.$ref) return formatInnerSchema(getSchemaPart(schema.$ref), true);
		if(schema.allOf) return schema.allOf.map(formatInnerSchema).join(" & ");
		if(schema.oneOf) return schema.oneOf.map(formatInnerSchema).join(" | ");
		if(schema.anyOf) return schema.anyOf.map(formatInnerSchema).join(" | ");
		if(schema.enum) return schema.enum.map(item => JSON.stringify(item)).join(" | ");
		return JSON.stringify(schema, 0, 2);
	}

	static formatValidationError(err) {
		const dataPath = `configuration${err.dataPath}`;
		if(err.keyword === "additionalProperties") {
			const baseMessage = `${dataPath} has an unknown property '${err.params.additionalProperty}'. These properties are valid:\n${getSchemaPartText(err.parentSchema)}`;
			return baseMessage;
		} else if(err.keyword === "oneOf" || err.keyword === "anyOf") {
			if(err.children && err.children.length > 0) {
				if(err.schema.length === 1) {
					const lastChild = err.children[err.children.length - 1];
					const remainingChildren = err.children.slice(0, err.children.length - 1);
					return OptionsValidationError.formatValidationError(Object.assign({}, lastChild, {
						children: remainingChildren,
						parentSchema: Object.assign({}, err.parentSchema, lastChild.parentSchema)
					}));
				}
				return `${dataPath} should be one of these:\n${getSchemaPartText(err.parentSchema)}\n` +
					`Details:\n${filterChildren(err.children).map(err => " * " + indent(OptionsValidationError.formatValidationError(err), "   ", false)).join("\n")}`;
			}
			return `${dataPath} should be one of these:\n${getSchemaPartText(err.parentSchema)}`;

		} else if(err.keyword === "enum") {
			if(err.parentSchema && err.parentSchema.enum && err.parentSchema.enum.length === 1) {
				return `${dataPath} should be ${getSchemaPartText(err.parentSchema)}`;
			}
			return `${dataPath} should be one of these:\n${getSchemaPartText(err.parentSchema)}`;
		} else if(err.keyword === "allOf") {
			return `${dataPath} should be:\n${getSchemaPartText(err.parentSchema)}`;
		} else if(err.keyword === "type") {
			switch(err.params.type) {
				case "object":
					return `${dataPath} should be an object.${getSchemaPartDescription(err.parentSchema)}`;
				case "string":
					return `${dataPath} should be a string.${getSchemaPartDescription(err.parentSchema)}`;
				case "boolean":
					return `${dataPath} should be a boolean.${getSchemaPartDescription(err.parentSchema)}`;
				case "number":
					return `${dataPath} should be a number.${getSchemaPartDescription(err.parentSchema)}`;
				case "array":
					return `${dataPath} should be an array:\n${getSchemaPartText(err.parentSchema)}`;
			}
			return `${dataPath} should be ${err.params.type}:\n${getSchemaPartText(err.parentSchema)}`;
		} else if(err.keyword === "instanceof") {
			return `${dataPath} should be an instance of ${getSchemaPartText(err.parentSchema)}`;
		} else if(err.keyword === "required") {
			const missingProperty = err.params.missingProperty.replace(/^\./, "");
			return `${dataPath} misses the property '${missingProperty}'.\n${getSchemaPartText(err.parentSchema, ["properties", missingProperty])}`;
		} else if(err.keyword === "minimum") {
			return `${dataPath} ${err.message}.${getSchemaPartDescription(err.parentSchema)}`;
		} else if(err.keyword === "uniqueItems") {
			return `${dataPath} should not contain the item '${err.data[err.params.i]}' twice.${getSchemaPartDescription(err.parentSchema)}`;
		} else if(err.keyword === "minLength" || err.keyword === "minItems" || err.keyword === "minProperties") {
			if(err.params.limit === 1)
				return `${dataPath} should not be empty.${getSchemaPartDescription(err.parentSchema)}`;
			else
				return `${dataPath} ${err.message}${getSchemaPartDescription(err.parentSchema)}`;
		} else if(err.keyword === "absolutePath") {
			const baseMessage = `${dataPath}: ${err.message}${getSchemaPartDescription(err.parentSchema)}`;
			if(dataPath === "configuration.output.filename") {
				return `${baseMessage}\n` +
					"Please use output.path to specify absolute path and output.filename for the file name.";
			}
			return baseMessage;
		} else {
			// eslint-disable-line no-fallthrough
			return `${dataPath} ${err.message} (${JSON.stringify(err, 0, 2)}).\n${getSchemaPartText(err.parentSchema)}`;
		}
	}
}

module.exports = (options) => {
	const validate = ajv.compile(schema);
	const valid = validate(options);

	if (!valid) {
		let errors = filterErrors(validate.errors);

		throw new OptionsValidationError(errors);

		process.exit();
	}
};