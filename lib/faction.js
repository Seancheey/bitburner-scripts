/** @param {NS} ns **/
import findBestProfitCrime from "/lib/crime.js"
import { iPlayer } from "/lib/iplayer.js"

const K = 1000
const M = K * 1000
const B = M * 1000

export function tryWorkForCompany(ns, company, focus, player) {
	if (!Object.keys(ns.getPlayer().jobs).includes(company) || player.type == "player") {
		ns.applyToCompany(company, "Software")
	}
	player.companyWork(ns, company, focus)
}

export function tryWorkForFaction(ns, faction, focus, player) {
	for (const work of getFactionWorkTypeOrder(ns, player)) {
		// ns.print("factionWork(" + faction + "," + work + ")")
		const result = player.factionWork(ns, faction, work, focus)
		// ns.print(player)
		// ns.print(result)
		if (result) {
			// ns.toast("Work for " + faction + " focus = " + focus + " sleeve = " + player + " work = " + work)
			return true
		}
	}
	return false
}

function toTitleCase(str) {
	return str.replace(
		/\w\S*/g,
		function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		}
	);
}

export function expToLevelUp(ns, level, mult, stat) {
	const bitnodeMults = ns.getBitNodeMultipliers()
	const levelMult = bitnodeMults[toTitleCase(stat) + "LevelMultiplier"]
	const normLevel = level / levelMult

	return ns.formulas.skills.calculateExp(normLevel + 1, mult) - ns.formulas.skills.calculateExp(normLevel, mult)
}

export function tryTrain(ns, stat, targetLvl, focus, player, shouldTargetPlayerLevel, maxExpToLevel) {
	const moneyAvailable = ns.getServerMoneyAvailable('home')
	const cheapMode = moneyAvailable < 50 * M
	const maxNormalizedExpToLevelUp = (maxExpToLevel || (stat == 'hacking' ? 600 : 500)) / (cheapMode ? 10 : 1) * (targetLvl == Infinity ? 1 : 1.5)
	const targetPlayer = shouldTargetPlayerLevel ? iPlayer : player
	const curLevel = targetPlayer.stats(ns)[stat]
	const mult = targetPlayer.mult(ns, stat)
	const exp = expToLevelUp(ns, targetLvl == Infinity ? curLevel : targetLvl, mult, stat)
	const expMult = targetPlayer.expMult(ns, stat)
	const normExp = exp / expMult
	if (normExp > maxNormalizedExpToLevelUp) {
		// if (stat == 'hacking' && player.name == iPlayer.name) {
		// 	ns.toast("Give up leveling up " + stat + ", since normalized exp = " + normExp + ", max = " + maxNormalizedExpToLevelUp, "success", 20000)
		// }
		return false
	}
	if (curLevel >= targetLvl) {
		// ns.print("Player's " + statName + " already satisfies need.")
		return false;
	}
	if (stat != 'hacking' && stat != 'charisma') {
		if (player.currentCity(ns) != 'Sector-12') {
			if (moneyAvailable < 200 * K) {
				return false
			}
			player.travelTo(ns, 'Sector-12')
		}
		const gymName = cheapMode ? "Iron Gym" : "Powerhouse Gym"
		return player.workout(ns, stat, gymName, focus)
	} else {
		const city = cheapMode ? 'Sector-12' : 'Volhaven'
		const univ = cheapMode ? 'Rothman University' : 'ZB Institute of Technology'
		const course = stat == 'hacking' ? (cheapMode ? 'Study Computer Science' : "Algorithms") : "Leadership"
		if (player.currentCity(ns) != city) {
			if (moneyAvailable < 200 * K) {
				return false
			}
			player.travelTo(ns, city)
		}
		// ns.print("maxNormExp = " + maxNormalizedExpToLevelUp + ", normExp = " + normExp)
		// ns.print("exp = " + exp)
		// ns.print("mult = " + expMult)
		// ns.print("level = " + curLevel)
		// ns.print("single exp = " + ns.formulas.skills.calculateExp(curLevel, mult))
		return player.study(ns, univ, course, focus)
	}
}

function getFactionWorkTypeOrder(ns, player) {
	const p = player.stats(ns)
	p.intelligence = p.intelligence || 0
	const order = [
		{ name: "Hacking", repEst: p.hacking + p.intelligence / 3, },
		{ name: "Security", repEst: 0.9 * (p.strength + p.defense + p.dexterity + p.agility) / 4.5, },
		{ name: "Field", repEst: 0.9 * (p.strength + p.defense + p.dexterity + p.agility + p.charisma) / 5.5, },
	].sort((a, b) => b.repEst - a.repEst)
	// ns.print(order)
	// ns.toast(order, 'info', 20000)
	return order.map(x => x.name)
}

class Faction {
	constructor(name, opts) {
		this.name = name
		this.hackLvl = opts.hackLvl
		this.combatLvl = opts.combatLvl
		this.money = opts.money
		this.location = opts.location
		this.karma = opts.karma
		this.peopleKilled = opts.peopleKilled
		this.augmentNum = opts.augmentNum
		this.companyName = opts.companyRep ? (opts.companyName || name) : undefined
		this.companyRep = opts.companyRep
		this.backdoorServer = opts.backdoorServer
		this.conflictFactions = opts.conflictFactions
		this.ceo = opts.ceo
	}

	joinBenefit(ns) {
		// TODO: Naive implementation.
	}

	difficultyToJoin(ns) {

	}

	isJoined(ns) {
		return ns.getPlayer().factions.includes(this.name)
	}

	getUnboughtAugmentations(ns, excludeInfiniteAug = true) {
		const allAugs = ns.getAugmentationsFromFaction(this.name)
		const ownedAugs = ns.getOwnedAugmentations(true)
		return allAugs.filter(aug => !ownedAugs.includes(aug) && (!excludeInfiniteAug || aug != "NeuroFlux Governor"))
	}

	async workToJoin(ns, focus, player) {
		// return: if player got a work to do
		const playerInfo = ns.getPlayer()
		if (this.isJoined(ns)) {
			ns.print("Already joined faction " + this.name)
			return false
		}

		if (this.getUnboughtAugmentations(ns).length == 0) {
			// no need to join
			ns.print("aug == 0, no need to join")
			return false
		}

		if (this.conflictFactions && playerInfo.factions.some(f => this.conflictFactions.includes(f))) {
			return false
		}

		if (this.augmentNum && ns.getOwnedAugmentations().length < this.augmentNum) {
			// noop, augment can't be worked to resolve
			return false
		}

		if (this.money && playerInfo.money < this.money) {
			// noop, money is hard to be worked to resolve
			ns.print("not enough money to join")
			return false
		}

		if (this.hackLvl && playerInfo.hacking < this.hackLvl) {
			// noop, hacking grow by it own, hard to be worked to resolve
			return tryTrain(ns, "hacking", this.hackLvl, focus, player, true)
		}

		if (this.combatLvl) {
			for (const stat of ["strength", "defense", "dexterity", "agility"]) {
				if (playerInfo[stat] < this.combatLvl) {
					if (tryTrain(ns, stat, this.combatLvl, focus, player, true)) {
						ns.print("training " + stat + " to join " + this.name)
						return true
					}
				} else {
					return false
				}
			}
		}

		if (this.backdoorServer) {
			const server = ns.getServer(this.backdoorServer)
			if (!server.hasAdminRights) {
				return false
			}
			if (!server.backdoorInstalled) {
				// Other scripts will help with backdoor
				return false
			}
		}

		if (this.companyName) {
			if (ns.getCompanyRep(this.companyName) < this.companyRep && playerInfo.hacking >= 250) {
				return tryWorkForCompany(ns, this.companyName, focus, player)
			}
		}

		if (this.ceo) {
			const maxRepCompany = findMaxRepCompany(ns)
			if (maxRepCompany == null || maxRepCompany == "") {
				ns.toast("No company to work for??", 'error')
				return
			}
			if (playerInfo.hacking < 875) {
				return tryTrain(ns, 'hacking', 875, focus, player, true)
			}
			if (playerInfo.charisma < 475) {
				return tryTrain(ns, 'charisma', 475, focus, player, true)
			}
			if (ns.getCompanyRep(maxRepCompany) < 400 * K) {
				return tryWorkForCompany(ns, maxRepCompany, focus, player)
			}
		}

		if (this.location && this.location != playerInfo.location && player.type == 'player') {
			ns.print("Travel to " + this.location + " to join faction: " + this.name)
			ns.travelToCity(this.location)
		}

		if (((this.karma && ns.heart.break() > this.karma) || this.peopleKilled) && player.type == 'player') {
			// people killed is tricky to get.. so always perform the operation if still can't join...
			ns.commitCrime("Homicide")
			return true
		}

		return false
	}

	tryWorkForFaction(ns, focus, player) {
		// return: if a player got a work to do
		if (!this.isJoined(ns)) {
			ns.print("Not joined the faction yet")
			return false
		}
		const unboughtAugs = this.getUnboughtAugmentations(ns)
		if (unboughtAugs.length == 0) {
			ns.print("Augs length == 0")
			return false
		}
		if (ns.gang.inGang() && ns.gang.getGangInformation().faction == this.name) {
			ns.print("Unable to work for my gang's faction")
			return false
		}

		const favorToDonate = ns.getBitNodeMultipliers().RepToDonateToFaction * 150

		if (ns.getFactionFavorGain(this.name) + ns.getFactionFavor(this.name) >= favorToDonate) {
			ns.print("Rep already exceeded favor to donate")
			return false
		}

		let maxRepRequirement = 0
		for (const aug of unboughtAugs) {
			maxRepRequirement = Math.max(ns.getAugmentationRepReq(aug), maxRepRequirement)
		}

		if (ns.getFactionRep(this.name) >= maxRepRequirement) {
			ns.print("reputation already satisfied to buy max rep aug")
			return false
		}


		return tryWorkForFaction(ns, this.name, focus, player)
	}

}

export const factions = [
	new Faction("CyberSec", { backdoorServer: "CSEC" }),
	new Faction("Tian Di Hui", { money: 1 * M, hackLvl: 50, location: "Chongqing" }),
	new Faction("NiteSec", { backdoorServer: "avmnite-02h" }),
	new Faction("Sector-12", { money: 15 * M, location: "Sector-12", conflictFactions: ["Chongqing", "New Tokyo", "Ishima", "Volhaven"] }),
	new Faction("Chongqing", { money: 20 * M, location: "Chongqing", conflictFactions: ["Aevum", "Sector-12", "Volhaven"] }),
	new Faction("New Tokyo", { money: 20 * M, location: "New Tokyo", conflictFactions: ["Aevum", "Sector-12", "Volhaven"] }),
	new Faction("Aevum", { money: 40 * M, location: "Aevum", conflictFactions: ["Chongqing", "New Tokyo", "Ishima", "Volhaven"] }),
	new Faction("Ishima", { money: 30 * M, location: "Ishima", conflictFactions: ["Aevum", "Sector-12", "Volhaven"] }),
	new Faction("Volhaven", { money: 50 * M, location: "Volhaven", conflictFactions: ["Aevum", "Sector-12", "Chongqing", "New Tokyo", "Ishima"] }),
	new Faction("The Black Hand", { backdoorServer: "I.I.I.I" }),
	new Faction("Slum Snakes", { combatLvl: 30, karma: -9, money: 1 * M }),
	new Faction("BitRunners", { backdoorServer: "run4theh111z" }),
	new Faction("Daedalus", { augmentNum: 30, money: 100 * B, hackLvl: 2500 }),
	new Faction("NWO", { companyRep: 200 * K }),
	new Faction("Tetrads", { combatLvl: 75, karma: -18, location: "Chongqing" }),
	new Faction("ECorp", { companyRep: 200 * K }),
	new Faction("The Syndicate", { money: 10 * M, hackLvl: 200, combatLvl: 200, karma: -90, location: "Sector-12" }),
	new Faction("Fulcrum Secret Technologies", { companyName: "Fulcrum Technologies", companyRep: 250 * K, backdoorServer: "fulcrumassets" }),
	new Faction("Speakers for the Dead", { hackLvl: 100, combatLvl: 300, karma: -45, peopleKilled: 30 }),
	new Faction("The Dark Army", { hackLvl: 300, combatLvl: 300, karma: -45, location: "Chongqing", peopleKilled: 5 }),
	new Faction("The Covenant", { augmentNum: 20, money: 75 * B, hackLvl: 850, combatLvl: 850 }),
	new Faction("Illuminati", { augmentNum: 30, money: 150 * B, hackLvl: 1500, combatLvl: 1200 }),
	new Faction("MegaCorp", { companyRep: 200 * K }),
	new Faction("OmniTek Incorporated", { companyRep: 200 * K }),
	new Faction("KuaiGong International", { companyRep: 200 * K }),
	new Faction("Four Sigma", { companyRep: 200 * K }),
	new Faction("Blade Industries", { companyRep: 200 * K }),
	new Faction("Bachman & Associates", { companyRep: 200 * K }),
	new Faction("Clarke Incorporated", { companyRep: 200 * K }),
	new Faction("Silhouette", { karma: -22, money: 15 * M, ceo: true }),
]

function findMaxRepCompany(ns) {
	let maxRep = -1
	let maxRepCompany = null
	for (const f of factions) {
		if (f.companyName) {
			const rep = ns.getCompanyRep(f.companyName)
			if (rep > maxRep) {
				maxRep = rep
				maxRepCompany = f.companyName
			}
		}
	}
	return maxRepCompany
}

export function getWorkRepGain(ns, company, position) {
	const companyPositionName = this.jobs[this.companyName];
	const companyPosition = CompanyPositions[companyPositionName];
	if (company == null || companyPosition == null) {
		return 0;
	}

	let jobPerformance = companyPosition.calculateJobPerformance(
		this.hacking,
		this.strength,
		this.defense,
		this.dexterity,
		this.agility,
		this.charisma,
	);

	//Intelligence provides a flat bonus to job performance
	jobPerformance += this.intelligence / 975;

	//Update reputation gain rate to account for company favor
	let favorMult = 1 + company.favor / 100;
	if (isNaN(favorMult)) {
		favorMult = 1;
	}
	return jobPerformance * ns.getPlayer().company_rep_mult * favorMult;
}

async function reportAction(ns, action, player) {
	ns.toast(player.name + ": " + action, 'success')
	// await ns.writePort(2, playerName(player) + ": " + action)
}

export function shouldEarnMoney(ns, player) {
	const c = findBestProfitCrime(ns, player)
	const compareCrime = ns.getCrimeStats(c)
	const hackMoneyTooSlow = ns.getScriptIncome()[0] * 0.1 < compareCrime.money / compareCrime.time * player.crimeChance(ns, c) * 1000
	// ns.print("script income = " + ns.getScriptIncome()[0])
	// ns.print("crime income = " + compareCrime.money / compareCrime.time * crimeChance(ns, c, player) * 1000)
	return hackMoneyTooSlow
}

export function getFactionWorks(ns, focus, player) {
	const works = []
	for (const faction of factions) {
		works.push({
			message: "work for " + faction.name,
			cond: () => faction.tryWorkForFaction(ns, focus, player)
		})
		works.push({
			message: "joining " + faction.name,
			cond: () => faction.workToJoin(ns, focus, player)
		})
	}
	return works
}

export async function setTask(ns, focus, player) {
	const works = getFactionWorks(ns, focus, player)
	for (const work of works) {
		ns.print("==try " + work.message)
		if (await work.cond()) {
			await reportAction(ns, work.message, player)
			if (work.action) {
				work.action()
			}
			return true;
		}
	}

	return false;
}