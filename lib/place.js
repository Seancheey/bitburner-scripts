/** @param {NS} ns **/

function getPlaceToGainExp(ns, options, allowNoMoney = false) {
	const money = ns.getServerMoneyAvailable('home')
	const player = ns.getPlayer()
	const moneyAvailableMultiplier = 1000000
	const availablePlaces = options.filter(op => {
		if (money < 200000 && op.city != player.city) {
			return false
		}
		return money > moneyAvailableMultiplier * op.costMult
	})
	if (availablePlaces.length == 0) {
		return null
	}
	return availablePlaces.reduce((a, b) => a.expMult - b.expMult, availablePlaces[0])
}

export function getWorkoutPlace(ns, stat) {
	return getPlaceToGainExp(ns, [
		{ city: "Aevum", name: "Crush Fitness Gym", expMult: 2, costMult: 3 },
		{ city: "Aevum", name: "Snap Fitness Gym", expMult: 5, costMult: 10 },
		{ city: "Sector-12", name: "Powerhouse Gym", expMult: 10, costMult: 20 },
		{ city: "Sector-12", name: "Iron Gym", expMult: 1, costMult: 1 },
		{ city: "Volhaven", name: "Millenium Fitness Gym", expMult: 4, costMult: 7 },
	])
}

export function getLearnPlace(ns, stat) {
	return getPlaceToGainExp(ns, [
		{ city: "Sector-12", costMult: 3, expMult: 2, name: "Rothman University" },
		{ city: "Volhaven", costMult: 5, expMult: 4, name: "ZB Institute of Technology" },
		{ city: "Aevum", costMult: 4, expMult: 3, name: "Summit University" },
	], stat == "Hacking")
}