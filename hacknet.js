/** @param {NS} ns **/

import { findBestServerToHack } from '/lib/find-best-server-to-hack.js'

const unifiedActions = [
	{
		func: "Level",
		paramPos: 0
	},
	{
		func: "Ram",
		paramPos: 1
	},
	{
		func: "Core",
		paramPos: 2
	},
]

function getActions(ns) {
	const gainRateFunc = unlockedHacknetServer(ns) ? (l, r, c, m) => ns.formulas.hacknetServers.hashGainRate(l, 0, r, c, m) * 250e3 : ns.formulas.hacknetNodes.moneyGainRate
	return unifiedActions.map(tup => {
		return {
			name: tup.func,
			cost: (ns, i) => ns.hacknet["get" + tup.func + "UpgradeCost"](i, 1),
			gain: (ns, params) => {
				const curGain = gainRateFunc(...params);
				params[tup.paramPos] += 1;
				const newGain = gainRateFunc(...params)
				return newGain - curGain
			},
			upgrade: (ns, i) => ns.hacknet["upgrade" + tup.func](i, 1)
		}
	})
}

export function getTotalMoneyGainRate(ns) {
	return ns.getScriptIncome()[0] + getHacknetGainRate(ns) * (unlockedHacknetServer(ns) ? 250e3 : 1)
}

function unlockedHacknetServer(ns) {
	return ns.hacknet.getHashUpgrades().length > 0
}

export function findBestUpgradeOption(ns, targetMoney) {
	const money = ns.getPlayer().money
	if (money > targetMoney) {
		return null
	}
	const currentMoneyGainRate = getTotalMoneyGainRate(ns) * 2 // mult by 2 to assume gain rate will double in the following time
	const unlockServer = unlockedHacknetServer(ns)
	if (unlockServer) {
		// TODO: find hacknet with max RAM and see if we can upgrade it's RAM in 5min.

	}
	const noActionTimeNeed = (targetMoney - money) / currentMoneyGainRate

	const numNodes = ns.hacknet.numNodes()
	const playerMult = ns.getPlayer().hacknet_node_money_mult
	const newTimeNeeds = []
	const actions = getActions(ns)
	for (let i = 0; i < numNodes; i++) {
		const stat = ns.hacknet.getNodeStats(i)
		for (const action of actions) {
			const cost = action.cost(ns, i)
			if (cost > money) {
				continue
			}
			const gain = action.gain(ns, [stat.level, stat.ram, stat.cores, playerMult])
			const unitGain = gain / cost
			ns.print(action.name + " gain/cost for node " + i + " is " + unitGain + " gain = " + gain)
			const time = (targetMoney - money + cost) / (gain + currentMoneyGainRate)
			if (time > noActionTimeNeed) {
				continue
			}
			newTimeNeeds.push({ action: action, time: time, node: i, unitGain: unitGain })
		}
	}

	newTimeNeeds.sort((a, b) => b.unitGain - a.unitGain)

	if (newTimeNeeds.length > 0) {
		return newTimeNeeds[0]
	} else {
		return null
	}
}

export function buyHacknetNodeTo(ns, maxNodeNum) {
	const nodeNum = ns.hacknet.numNodes()
	if (nodeNum >= maxNodeNum) {
		return
	}
	ns.hacknet.purchaseNode()
}

export function getHacknetGainRate(ns) {
	let prod = 0
	for (let i = 0; i < ns.hacknet.numNodes(); i++) {
		prod += ns.hacknet.getNodeStats(i).production
	}
	if (unlockedHacknetServer(ns)) {
		return prod
	}
}

const hashUpgrades = ["Sell for Money", "Sell for Corporation Funds", "Reduce Minimum Security", "Increase Maximum Money", "Improve Studying", "Improve Gym Training", "Exchange for Corporation Research", "Exchange for Bladeburner Rank", "Exchange for Bladeburner SP", "Generate Coding Contract"]

export function spendHash(ns, maxSaveMoneyTime) {
	const serverTarget = findBestServerToHack(ns)
	const currentGainRate = getHacknetGainRate(ns)
	const upgradeActions = [
		{ name: "Improve Studying", cond: () => currentGainRate > 5 },
		{ name: "Improve Gym Training", cond: () => currentGainRate > 20 },
		{ name: "Increase Maximum Money", target: (ns) => serverTarget, cond: () => currentGainRate > 20 },
		{ name: "Reduce Minimum Security", target: (ns) => serverTarget, cond: (ns) => currentGainRate > 20 && ns.getServerMinSecurityLevel(serverTarget) > 2 },
		{ name: "Sell for Money" }
	]
	let continueFind = true
	const spendActions = new Set()
	while (continueFind) {
		continueFind = false
		for (const action of upgradeActions) {
			if ((!action.cond || action.cond(ns))) {
				const numHash = ns.hacknet.numHashes()
				if (numHash > ns.hacknet.hashCost(action.name)) {
					spendActions.add(action.name)
					if (action.target) {
						const target = action.target(ns)
						ns.print("Spend hash on " + action.name + " => " + target)
						ns.hacknet.spendHashes(action.name, target)
					} else {
						ns.print("Spend hash on " + action.name)
						ns.hacknet.spendHashes(action.name)
					}
					continueFind = true
				} else if (numHash <= getHacknetGainRate(ns) * maxSaveMoneyTime) {
					ns.print("Save up Hash to invest on " + action.name)
					continueFind = false
					break
				}
			}
		}
	}
	if (spendActions.size > 0) {
		ns.toast("Spent hash on [" + Array.from(spendActions.values()) + "]", 'success', 10000)
	}
}

function tryUpgradeCache(ns, maxSaveMoneyTime) {
	const currentGainRate = getHacknetGainRate(ns)
	const hashCapacityNeed = currentGainRate * maxSaveMoneyTime
	if (ns.hacknet.hashCapacity() < hashCapacityNeed) {
		ns.toast("Need to upgrade hash capacity")
		const money = ns.getPlayer().money
		const numNodes = ns.hacknet.numNodes()

		let bestCachePerDollor = 0
		let bestInd = -1
		for (let i = 0; i < numNodes; i++) {
			const cost = ns.hacknet.getCacheUpgradeCost(index, 1)
			if (cost > money) {
				continue
			}
			const cacheGain = 2 ** ns.hacknet.getNodeStats(i).cache * 256
			const cachePerDollor = cacheGain / cost
			if (cachePerDollor > bestCachePerDollor) {
				bestInd = i
				bestCachePerDollor = cachePerDollor
			}
		}

		if (bestInd >= 0) {
		}
	}
}

export async function main(ns) {
	ns.clearLog()
	ns.disableLog('ALL')
	const maxSaveMoneyTime = 30
	const serverUnlocked = unlockedHacknetServer(ns)
	const targetMoney = serverUnlocked ? 100e9 : 10e9 // 10B
	buyHacknetNodeTo(ns, serverUnlocked ? 12 : 8)
	if (serverUnlocked) {
		tryUpgradeCache(ns, maxSaveMoneyTime)
		spendHash(ns, maxSaveMoneyTime)
	}
	let upgradeNums = 0
	while (true) {
		let result = findBestUpgradeOption(ns, targetMoney)
		if (result != null) {
			result.action.upgrade(ns, result.node)
		} else {
			ns.print("No action are worth investing")
			break
		}
	}
	if (upgradeNums > 0) {
		ns.toast("Leveled " + upgradeNums + " upgrades", "success", 3000)
	}
}