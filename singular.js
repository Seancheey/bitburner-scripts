/** @param {NS} ns **/

// instant actions:
// buy TOR
// buy PC RAM/Core
// backdoor
// join faction that has aug not installed

// buy Aug

import { trySellStocks, getTotalMoneyInStock } from '/exe/tix.js'

function getUnboughtAugmentations(ns, faction, excludeInfiniteAug = true) {
	const allAugs = ns.getAugmentationsFromFaction(faction)
	const ownedAugs = ns.getOwnedAugmentations(true)
	return allAugs.filter(aug => !ownedAugs.includes(aug) && (!excludeInfiniteAug || aug != "NeuroFlux Governor"))
}

function repFromDonation(ns, amount) {
	return (amount / 1e6) * ns.getPlayer().faction_rep_mult
}

function amountForRep(ns, rep) {
	return rep / ns.getPlayer().faction_rep_mult * 1e6
}

function donate(ns) {
	const favorToDonate = ns.getFavorToDonate()
	const repSatisfiedAugs = getSatisfiedRepAugmentations(ns)
	for (const faction of ns.getPlayer().factions) {
		if (ns.getFactionFavor(faction) < favorToDonate) {
			continue;
		}
		const unboughtAugs = getUnboughtAugmentations(ns, faction)
		for (const aug of unboughtAugs) {
			const factionRep = ns.getFactionRep(faction)
			const augRepRequirement = ns.getAugmentationRepReq(aug)
			const amountNeed = amountForRep(ns, augRepRequirement - factionRep)
			if (augRepRequirement > factionRep && amountNeed <= ns.getServerMoneyAvailable('home') / 2 && !repSatisfiedAugs.includes(aug)) {
				ns.print("donating " + amountNeed + " to have augmentation: " + aug)
				ns.donateToFaction(faction, amountNeed)
			}
		}
	}
}

function getSatisfiedRepAugmentations(ns) {
	const factions = ns.getPlayer().factions
	const factionAugs = []
	for (const faction of factions) {
		for (const aug of getUnboughtAugmentations(ns, faction)) {
			if (ns.getAugmentationRepReq(aug) <= ns.getFactionRep(faction)) {
				factionAugs.push({ faction: faction, aug: aug })
			}
		}
	}

	// dedup
	const seenAugs = new Set()
	const uniqueAugs = []
	for (const factionAug of factionAugs) {
		if (!seenAugs.has(factionAug.aug)) {
			uniqueAugs.push(factionAug)
			seenAugs.add(factionAug.aug)
		}
	}

	return uniqueAugs
}

function purchaseAugmentations(ns, minNumsToBuy = 6) {
	if (minNumsToBuy <= 0) {
		return true
	}
	const myAugs = ns.getOwnedAugmentations(true)
	const moneyLeft = ns.getServerMoneyAvailable('home') + getTotalMoneyInStock(ns)
	// sort buyable aug from low to high price
	// see if we can buy first N augs
	const buyableAugs = getSatisfiedRepAugmentations(ns)
	const depAugs = buyableAugs.concat(myAugs)
	const buyableDepSatisfiedAugs = buyableAugs.filter(fa => ns.getAugmentationPrereq(fa.aug).every(aug => depAugs.includes(aug))).sort((a, b) => ns.getAugmentationCost(a.aug)[1] - ns.getAugmentationCost(b.aug)[1])
	const toPurchase = []

	const files = ns.getOwnedSourceFiles()
	let node11Level = 0
	files.filter(x => x.n == 11).forEach(x => node11Level = x.lvl)
	const priceIncreaseMultiplier = 1.9 * [1, 0.96, 0.94, 0.93][node11Level]
	let totalCost = 0
	for (const factionAug of buyableDepSatisfiedAugs) {
		const aug = factionAug.aug
		const extraCost = totalCost * (priceIncreaseMultiplier - 1) + ns.getAugmentationCost(aug)[1]
		if (moneyLeft < totalCost + extraCost) {
			ns.print("money not enough")
			break;
		}
		if (!ns.getAugmentationPrereq(factionAug.aug).every(aug => myAugs.includes(aug))) {
			// TODO: aug should be bought next to it's dep
			continue
		}
		toPurchase.push(factionAug)
		myAugs.push(aug)
		totalCost += extraCost
	}
	if (toPurchase.length < minNumsToBuy) {
		if (toPurchase.length > 0) {
			ns.toast("avaliable augmentations: ['" + toPurchase.map(fa => fa.faction + " - " + fa.aug).join("', '") + "'].", 'info', 10000)
		}
		return false
	}
	while (trySellStocks(ns, 0)) { }
	// buy from most expensive to cheapest
	toPurchase.sort((a, b) => ns.getAugmentationCost(b.aug)[1] - ns.getAugmentationCost(a.aug)[1])
	ns.toast("Purchasing augmentations: " + toPurchase.map(x => x.aug + " " + (ns.getAugmentationCost(x.aug)[1] / 1000000) + "M$").join(", "), 'success', 100000)
	toPurchase.forEach(factionAug => ns.purchaseAugmentation(factionAug.faction, factionAug.aug));
	return true
}

export async function buyMaxGovernor(ns) {
	const aug = "NeuroFlux Governor"
	let maxFaction = null
	let maxRep = -1

	let donatableFaction = null
	let maxDonatableRep = -1

	const factions = ns.getPlayer().factions
	for (const faction of factions) {
		const rep = ns.getFactionRep(faction)
		const favor = ns.getFactionFavor(faction)
		if (rep > maxRep) {
			maxRep = rep
			maxFaction = faction
		}
		if (favor >= 150 && rep > maxDonatableRep) {
			maxDonatableRep = rep
			donatableFaction = faction
		}
	}
	if (maxFaction == null) {
		return
	}
	if (donatableFaction != null) {
		maxFaction = donatableFaction
	}

	while (true) {
		const costTup = ns.getAugmentationCost(aug)
		const repCost = costTup[0]
		const moneyCost = costTup[1]
		const factionRep = ns.getFactionRep(maxFaction)

		if (repCost > factionRep) {
			if (donatableFaction == null) {
				break
			}
			const amountNeed = amountForRep(ns, repCost - factionRep)
			if (amountNeed > ns.getServerMoneyAvailable('home')) {
				break
			}
			ns.toast("donating " + amountNeed + " to have augmentation: " + aug)
			ns.donateToFaction(maxFaction, amountNeed)
		}

		if (moneyCost > ns.getServerMoneyAvailable('home')) {
			break
		}

		if (!ns.purchaseAugmentation(maxFaction, aug)) {
			break
		}
		ns.toast("Purchased NeuroFlux Governor")
		await ns.sleep(2000)
	}
}

export async function performOneTimeActions(ns, minAugNumToInstall) {
	donate(ns)

	const numPurchased = ns.getOwnedAugmentations(true).length - ns.getOwnedAugmentations(false).length
	const hasBought = purchaseAugmentations(ns, minAugNumToInstall - numPurchased)

	if (hasBought) {
		// just to make sure we buy all augs.. (dep to aug dep issues..)
		purchaseAugmentations(ns)
		await buyMaxGovernor(ns)
		ns.installAugmentations('main.js')
	}
}

export async function main(ns) {
	const minAugNumToInstall = ns.args[0] || 6

	await performOneTimeActions(ns, minAugNumToInstall)
}