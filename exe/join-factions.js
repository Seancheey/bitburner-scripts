/** @param {NS} ns */
const conflictingFactions = [
	"Sector-12",
	"Chongqing",
	"New Tokyo",
	"Ishima",
	"Aevum",
	"Volhaven"
]

export function joinFactions(ns) {
	ns.checkFactionInvitations()
		.filter(
			faction => !conflictingFactions.includes(faction) || ns.getAugmentationsFromFaction(faction).length > 1
		)
		.forEach(
			faction => ns.joinFaction(faction)
		)
}

export async function main(ns) {
	joinFactions(ns)
}