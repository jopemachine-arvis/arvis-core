'use strict';
const COMMAND_TOKEN_REGEXP = /\B["'][^"']*["']\B|\S+/g;

const joinCommand = (file, args = []) => {
	if (!Array.isArray(args)) {
		return file;
	}

	return [file, ...args].join(' ');
};

// Handle `execa.command()`
const parseCommand = command => {
	const tokens = [];
	const tokenGen = command.match(new RegExp(COMMAND_TOKEN_REGEXP));
	for (const token of tokenGen) {
		tokens.push(token);
	}

	return tokens;
};

module.exports = {
	joinCommand,
	parseCommand
};
