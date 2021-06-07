'use strict';
const SPACES_REGEXP = /\B["']\b[^"'\n]*\b["']\B|\S+/g;

const joinCommand = (file, args = []) => {
	if (!Array.isArray(args)) {
		return file;
	}

	return [file, ...args].join(' ');
};

// Handle `execa.command()`
const parseCommand = command => {
	const tokens = [];
	const tokenGen = command.match(new RegExp(SPACES_REGEXP));
	for (const token of tokenGen) {
		tokens.push(token);
	}

	return tokens;
};

module.exports = {
	joinCommand,
	parseCommand
};
