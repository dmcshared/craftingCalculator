import { start } from 'node:repl';
import clr from 'kleur';
import { appendFileSync, readFileSync } from 'node:fs';
import { solveRecipe, solveRecipe1, solveRecipe2 } from './solveCraft.js';

const material = clr.yellow;
const tag = clr.cyan;
const baseTag = clr.green;
const num = clr.blue;
const dark = clr.gray;

/** @param {string} cmd */
let saveLine = (cmd) => {};

/**
 * @type {{
 * 		tags: Record<string, {infinite: boolean}>,
 * 		materials: Record<string, {tag: string}>,
 * 		recipes: Record<string, {ingredients: {amount: number, name: string}[], results: {amount: number, name: string}[]}[]>,
 * }}
 */
let state = {
	tags: {},
	materials: {},
	recipes: {},
};

/**
 * @param {string} rawIngredient
 */
function parseIngredient(rawIngredient) {
	let match;
	if ((match = rawIngredient.match(/^(?<amount>\d+) (?<name>.*)$/))) {
		return { amount: Number(match.groups.amount), name: match.groups.name };
	}
	return { amount: 1, name: rawIngredient };
}

/**
 * @param {string} cmdRaw
 *
 *
 * - [ ] `tag <tag>`: Defines a tag.
 * - [ ] `basetag <tag>`: Specifies that resources with this tag are infinite.
 * - [ ] `define <tag> <name>`: Defines a resource with the given tag and name.
 * - [ ] `recipe <ingredients> -> <result>`: Defines a recipe with the given ingredients and result. Ingredients are plus separated.
 * - [ ] `query <amount> <resource>`: Queries the amount of the given resource.
 * - [ ] `query <amount> <resource> with <ingredients>`: Queries the amount of the given resource with the given ingredients. Ingredients are plus separated.
 */
async function parseCommand(cmdRaw) {
	/** @type {RegExpMatchArray} */
	let m;

	const cmd = cmdRaw.trim();

	if ((m = cmd.match(/^tag (?<tagName>.*)$/))) {
		state.tags[m.groups.tagName] = { infinite: false };
		saveLine(cmd);
		return `Tag ${tag(m.groups.tagName)} added.`;
	}

	if ((m = cmd.match(/^basetag (?<tagName>.*)$/))) {
		state.tags[m.groups.tagName] = { infinite: true };
		saveLine(cmd);
		return `Tag ${baseTag(m.groups.tagName)} added as base tag.`;
	}

	if ((m = cmd.match(/^define (?<tagName>[^\s]*) (?<name>.*)$/))) {
		state.materials[m.groups.name] = { tag: m.groups.tagName };
		saveLine(cmd);
		return `Material ${material(m.groups.name)} added.`;
	}

	if ((m = cmd.match(/^recipe (?<ingredients>.*) -> (?<result>.*)$/))) {
		const ingredients = m.groups.ingredients
			.split(' + ')
			.map((x) => x.trim())
			.map(parseIngredient);
		const results = m.groups.result
			.split(' + ')
			.map((x) => x.trim())
			.map(parseIngredient);

		for (const ingredient of ingredients) {
			if (!state.materials[ingredient.name]) {
				return `Unknown material ${material(ingredient.name)}.`;
			}
		}

		for (const res of results) {
			if (!state.materials[res.name]) {
				return `Unknown material ${material(res.name)}.`;
			}
		}

		for (const res of results) {
			const orderedResults = [...results];
			orderedResults.sort((a, b) => (a.name == res.name ? -1 : 1));

			state.recipes[res.name] = state.recipes[res.name] ?? [];
			state.recipes[res.name].push({ ingredients, results: orderedResults });
		}

		saveLine(cmd);
		return `Recipe added for ${results
			.map((x) => material(x.name))
			.join(', ')}.`;
	}

	if ((m = cmd.match(/^query (?<items>.+)$/))) {
		const items = m.groups.items.split(' + ').map(parseIngredient);

		const sol = Object.entries(solveRecipe1(items, state, {}));

		return `You need:\n${sol
			.map((x) => `\t${num(x[1])}x\t${material(x[0])}`)
			.join('\n')}`;
	}

	if ((m = cmd.match(/^steps (?<items>.+?)(?: with (?<inventory>.+))?$/))) {
		const items = m.groups.items.split(' + ').map(parseIngredient);
		const inventoryList = m.groups.inventory
			? m.groups.inventory.split(' + ').map(parseIngredient)
			: [];

		/** @type {Record<string, number>} */
		const inventory = {};
		for (const item of inventoryList) {
			inventory[item.name] = (inventory[item.name] ?? 0) + item.amount;
		}

		const res = solveRecipe(items, state, inventory);

		// console.log(res);
		// return `Initial Resources:\n`;

		let out = [];

		// out += 'Initial Resources:\n';
		out.push('Initial Resources:');

		out.push(
			...inventoryList.map((x) => `\t${num(x.amount)}x\t${material(x.name)}`),
			''
		);

		out.push('Base Resources:');
		out.push(
			...Object.entries(res.baseResources).map(
				(x) => `\t${num(x[1])}x\t${material(x[0])}`
			),
			''
		);

		out.push('Steps:');
		for (const step of res.steps.reverse()) {
			// 4x	2 Iron Ore + 1 Work -> 1 Iron Ingot

			out.push(
				`\t` +
					step.recipe.ingredients
						.map((x) => `${num(x.amount * step.times)} ${material(x.name)}`)
						.join(' + ') +
					' -> ' +
					step.recipe.results
						.map((x) => `${num(x.amount * step.times)} ${material(x.name)}`)
						.join(' + ')
			);
		}
		out.push('');

		out.push('Leftovers:');
		out.push(
			...Object.entries(res.inventory)
				.filter(([name, amount]) => amount > 0)
				.map(([name, amount]) => `\t${num(amount)}x\t${material(name)}`)
		);

		// out += `  `;
		// out += `${num(step.times)}x `;
		// out += dark(
		// 	step.recipe.ingredients
		// 		.map((x) => `${x.amount} ${x.name}`)
		// 		.join(' + ') +
		// 		' -> ' +
		// 		step.recipe.results.map((x) => `${x.amount} ${x.name}`).join(' + ')
		// );

		// return JSON.stringify(res, null, 2);
		return out.join('\n');
	}

	return cmd;
}

(async function () {
	if (process.argv[2]) {
		const lines = readFileSync('./workspaces/' + process.argv[2], 'utf-8')
			.split('\n')
			.map((x) => x.trim())
			.filter((x) => x);

		for (const line of lines) {
			const out = await parseCommand(line);
			console.log(out);
		}

		saveLine = (cmd) => {
			appendFileSync('./workspaces/' + process.argv[2], cmd + '\n');
		};
	}

	const repl = start({
		prompt: '> ',
		useColors: true,
		completer: (/** @type {string} */ line) => {
			if (line.split(' ').length == 1) {
				const completions = 'basetag tag define recipe query steps'
					.split(' ')
					.map((x) => x + ' ');
				const hits = completions.filter((c) => c.startsWith(line));
				// Show all completions if none found
				return [hits.length ? hits : completions, line];
			}

			if (line.startsWith('define ') && line.split(' ').length == 2) {
				const completions = Object.keys(state.tags).map((x) => x + ' ');
				const hits = completions.filter((c) =>
					('define ' + c).startsWith(line)
				);
				// Show all completions if none found
				return [hits.length ? hits : completions, line.slice(7)];
			}

			if (
				line.startsWith('recipe ') ||
				line.startsWith('query ') ||
				line.startsWith('steps ')
			) {
				if (line.startsWith('recipe ')) {
					if (line.slice(-1) == '-') return [['-> '], '-'];
					if (line.slice(-2) == '->') return [['-> '], '->'];
					if (line.slice(-1) == '+') return [['+ '], '+'];
				}

				const match = line.match(/^[a-z]+ .*?(?:\d+ )?([a-zA-Z ]*)$/);
				if (match) {
					const allComps = Object.keys(state.materials).map((x) => x + ' ');
					const completions = allComps.filter((x) => x.startsWith(match[1]));

					if (completions.length == 1 && completions[0] == match[1]) {
						return [['+ ', '-> '], ''];
					}

					return [completions.length ? completions : allComps, match[1]];
				}
			}
			return [[], line];
		},
		eval: (cmd, context, filename, callback) => {
			parseCommand(cmd)
				.then((x) => callback(null, x))
				.catch((e) => callback(e));
		},
		writer: (output) => {
			return output;
		},
	});
})();
