/** @param {NS} ns **/
import { setTask, tryWorkForFaction, tryTrain } from "/lib/faction.js"

import { iPlayer } from "lib/iplayer.js"

function workForMaxRepFaction(ns, focus) {
	const factions = ns.getPlayer().factions
	const faction = factions.reduce((a, b) => (a == null || ns.getFactionRep(b) > ns.getFactionRep(a)) ? b : a, null)
	if (faction) {
		tryWorkForFaction(ns, faction, focus, iPlayer)
	}
}

export async function adjustLongtermWork(ns, alwaysDontFocus) {
	let focus = !ns.getOwnedAugmentations().includes("Neuroreceptor Management Implant")
	if (alwaysDontFocus) {
		focus = false
	}
	if (tryTrain(ns, 'hacking', Infinity, focus, iPlayer, false)) {
		return true;
	}
	const success = await setTask(ns, focus, iPlayer)
	if (!success) {
		ns.print("Unable to find any work to do for player. Work for faction with highest rep.")
		workForMaxRepFaction(ns, focus)
	}
}


export async function main(ns) {
	ns.clearLog()
	ns.disableLog('ALL')
	const alwaysDontFocus = ns.args[0] || false

	await adjustLongtermWork(ns, alwaysDontFocus)
}