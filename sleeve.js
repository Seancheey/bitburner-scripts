/** @param {NS} ns **/

import { setTask, tryTrain, shouldEarnMoney } from "/lib/faction.js"
import findBestProfitCrime from '/lib/crime.js'
import { iSleeve } from '/lib/isleeve.js'

export function tryBuySleeveAugment(ns, sleeveId, buyAugNumThreshold = 5) {
	const stats = ns.sleeve.getSleeveStats(sleeveId)
	if (stats.shock > 0) {
		return
	}
	let purchasableAugs = ns.sleeve.getSleevePurchasableAugs(sleeveId)
	if (buyAugNumThreshold > purchasableAugs.length) {
		return
	}
	purchasableAugs.sort((a, b) => a.cost - b.cost)

	const allowedMaxCost = Math.min(ns.getScriptIncome()[0] * 600, ns.getServerMoneyAvailable('home') / 5)


	let totalCost = 0
	let buyNum = 0
	for (buyNum = 1; buyNum <= purchasableAugs.length; buyNum++) {
		const i = buyNum - 1
		if (totalCost + purchasableAugs[i].cost > allowedMaxCost) {
			break
		}
		totalCost += purchasableAugs[i].cost
	}
	if (buyNum > purchasableAugs.length) {
		buyNum = purchasableAugs.length
	}
	if (buyNum < buyAugNumThreshold) {
		ns.print("Only able to buy " + buyNum + " augs for sleeve " + sleeveId + ". Allowable cost = " + allowedMaxCost)
		return;
	}

	ns.toast("Purchasing " + buyNum + " augmentations for sleeve " + sleeveId, 'success', 60000)
	for (let i = 0; i < buyNum; i++) {
		ns.sleeve.purchaseSleeveAug(sleeveId, purchasableAugs[i].name)
	}
}

export function needToImprove(ns, stat) {
	const player = ns.getPlayer()
	const level = player[stat.toLowerCase()]
	const skillMult = player[stat.toLowerCase() + "_exp_mult"]
	if (ns.fileExists("Formulas.exe", "home")) {
		ns.formulas.skills.calculateExp(level + 1, skillMult) - ns.formulas.skills.calculateExp(level, skillMult)
	}
}

export async function setSleeveWork(ns, sleeveId) {
	const stats = ns.sleeve.getSleeveStats(sleeveId)
	const isleeve = iSleeve(sleeveId)

	const works = []

	works.push({
		message: "sync",
		cond: () => stats.sync < 100,
		action: () => ns.sleeve.setToSynchronize(sleeveId)
	})
	works.push({
		message: "shock recover",
		cond: () => stats.shock > Math.random() * 100,
		action: () => ns.sleeve.setToShockRecovery(sleeveId)
	})
	works.push({
		message: "train hacking for self",
		cond: () => tryTrain(ns, 'hacking', Infinity, false, isleeve, false, 2000)
	})
	for (const stat of ['strength', 'defense', 'dexterity', 'agility']) {
		works.push({
			message: "train " + stat + " for self",
			cond: () => tryTrain(ns, stat, Infinity, false, isleeve, false, 100)
		})
		works.push({
			message: "train " + stat + " for player",
			cond: () => tryTrain(ns, stat, Infinity, true, isleeve, true)
		})
	}
	works.push({
		message: "train charisma for player",
		cond: () => tryTrain(ns, 'charisma', Infinity, false, isleeve, true, 50)
	})
	works.push({
		message: "Earn money",
		cond: () => shouldEarnMoney(ns, isleeve),
		action: () => isleeve.crime(ns, findBestProfitCrime(ns, isleeve))
	})
	works.push({
		message: "normal task",
		cond: async () => await setTask(ns, false, iSleeve(sleeveId))
	})
	works.push({
		message: "train more hacking",
		cond: () => tryTrain(ns, 'hacking', Infinity, false, isleeve, false, 8000)
	})
	works.push({
		message: "Decrease karma to form gang",
		cond: () => ns.heart.break() > -54000,
		action: () => isleeve.crime(ns, "Homicide")
	})
	works.push({
		message: "Do Crime Infinitely",
		cond: () => true,
		action: () => isleeve.crime(ns, findBestProfitCrime(ns, isleeve))
	})

	for (const work of works) {
		if (await work.cond()) {
			ns.print("Set sleeve " + sleeveId + " to: " + work.message)
			if (work.action) {
				work.action()
			}
			return true;
		}
	}
	ns.print("Failed to set task for sleeve " + sleeveId + " ????")
	return false
}



export async function adjustSleeves(ns) {
	for (let sleeveId = 0; sleeveId < ns.sleeve.getNumSleeves(); sleeveId++) {
		ns.print("Setting up sleeve" + sleeveId + "..")
		tryBuySleeveAugment(ns, sleeveId)
		await setSleeveWork(ns, sleeveId)
	}
}

export async function main(ns) {
	ns.disableLog('ALL')
	await adjustSleeves(ns)
}