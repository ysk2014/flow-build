/**
 * 所有错误处理的基础类
 */
"use strict";

module.exports = class BaseError extends Error {
	inspect() {
		return this.stack + (this.details ? `\n${this.details}` : "");
	}
};
