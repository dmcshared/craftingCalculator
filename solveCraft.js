/**
 * Crafting Strategies:
 * 1. Craft using the first recipe with infinite recursion. (This can crash if first recipe loop is recursive).
 * 2. Craft using a bfs-like algorithm to find a solution with the least amount of steps.
 * 3. Craft using a bfs-like algorithm to find a "perfect" solution with no extra results. (This can also crash).
 * 4. Craft using a bfs-like algorithm to find a solution with the most efficiency. (Longest as it has to find every possible solution and rank them.)
 *
 * @typedef {{amount: number, name: string}} Item
 */

/**
 * @typedef {{ingredients: Item[], results: Item[]}} Recipe
 *
 * @typedef {{
 * 		tags: Record<string, {infinite: boolean}>,
 * 		materials: Record<string, {tag: string}>,
 * 		recipes: Record<string, Recipe[]>,
 * }} State
 */

/**
 * @param {Item[]} results
 * @param {State} state
 * @param {Record<string, number>} inventory
 *
 * @returns {Record<string, number>}
 */
export function solveRecipe1(results, state, inventory) {
	// Find the first recipe that can be used to craft the results.

	/** @type {Record<string, number>} */
	const out = {};

	for (const result of results) {
		const recipe = state.recipes[result.name][0];

		if (!recipe) throw new Error(`No recipe for ${result.name}`);

		const timesNeeded = Math.ceil(result.amount / recipe.results[0].amount);

		for (const ingredient of recipe.ingredients) {
			const amount = ingredient.amount * timesNeeded;
			if (state.materials[ingredient.name]) {
				const tag = state.materials[ingredient.name].tag;
				if (state.tags[tag].infinite) {
					if (out[ingredient.name]) {
						out[ingredient.name] += amount;
					} else {
						out[ingredient.name] = amount;
					}
				} else {
					const newInventory = solveRecipe1(
						[{ amount, name: ingredient.name }],
						state,
						inventory
					);
					for (const key in newInventory) {
						if (out[key]) {
							out[key] += newInventory[key];
						} else {
							out[key] = newInventory[key];
						}
					}
				}
			}
		}
	}

	return out;
}
/**
 * @param {Item[]} results
 * @param {State} state
 * @param {Record<string, number>} inventory
 */
export function solveRecipe2(results, state, inventory) {
	throw new Error('Unimplemented.');
}
/**
 * @param {Item[]} results
 * @param {State} state
 * @param {Record<string, number>} inventory
 */
export function solveRecipe3(results, state, inventory) {
	throw new Error('Unimplemented.');
}
/**
 * @param {Item[]} results
 * @param {State} state
 * @param {Record<string, number>} inventory
 */
export function solveRecipe4(results, state, inventory) {
	throw new Error('Unimplemented.');
}

/**
 * @param {Item[]} results
 * @param {State} state
 * @param {Record<string, number>} inventory
 */
export function solveRecipe(results, state, inventory) {
	/**
	 * @typedef {{recipe: Recipe, times: number}} Step
	 *
	 * @type {{
	 * 		steps: Step[],
	 * 		inventory: Record<string, number>,
	 * 		baseResources: Record<string, number>,
	 * }[]}
	 */
	const stack = [
		{
			steps: [],
			inventory: { ...inventory },
			baseResources: {},
		},
	];

	for (const res of results) {
		stack[0].inventory[res.name] =
			(stack[0].inventory[res.name] || 0) - res.amount;
	}

	while (stack.length) {
		const current = stack.pop();

		let activeItem = null;
		for (const key in current.inventory) {
			if (current.inventory[key] < 0) {
				activeItem = key;
				break;
			}
		}
		if (!activeItem) {
			return current;
		}

		const recipes = state.recipes[activeItem];
		if (!recipes) throw new Error(`No recipe for ${activeItem}`);

		for (const recipe of recipes) {
			const times = Math.ceil(
				-current.inventory[activeItem] / recipe.results[0].amount
			);

			const newInventory = { ...current.inventory };
			const newBaseResources = { ...current.baseResources };
			for (const ingredient of recipe.ingredients) {
				if (state.tags[state.materials[ingredient.name].tag].infinite) {
					newInventory[ingredient.name] =
						(newInventory[ingredient.name] || 0) - ingredient.amount * times;

					if (newInventory[ingredient.name] < 0) {
						newBaseResources[ingredient.name] =
							(newBaseResources[ingredient.name] || 0) -
							newInventory[ingredient.name];

						newInventory[ingredient.name] = 0;
					}
				} else
					newInventory[ingredient.name] =
						(newInventory[ingredient.name] || 0) - ingredient.amount * times;
			}

			for (const result of recipe.results) {
				newInventory[result.name] =
					(newInventory[result.name] || 0) + result.amount * times;
			}

			stack.unshift({
				steps: [
					...current.steps,
					{
						recipe,
						times,
					},
				],
				inventory: newInventory,
				baseResources: newBaseResources,
			});
		}
	}

	throw new Error('Unimplemented.');
}
