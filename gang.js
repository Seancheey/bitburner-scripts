/** @param {NS} ns **/

export function recruit(ns) {
	let i = 1
	while (ns.gang.canRecruitMember()) {
		while (!ns.gang.recruitMember("guy" + i)) {
			i++;
		}
		ns.gang.setMemberTask("guy" + i, "Train Hacking")
	}
}

export function ascend(ns, ascendThreshold) {
	const members = ns.gang.getMemberNames()
	members.forEach(m => {
		ns.print(m)
		const resultMultipliers = ns.gang.getAscensionResult(m)
		if (resultMultipliers != undefined) {
			delete resultMultipliers.respect
			if (Object.values(resultMultipliers).some(mult => mult > ascendThreshold)) {
				const result = ns.gang.ascendMember(m)
				ns.gang.setMemberTask(m, "Train Hacking")
				ns.print("Ascend " + m + ". Result: ")
				ns.print(result)
			}
		}
	})
}

function setTask(ns, name, shouldReduceWanted) {
	if (shouldReduceWanted) {
		ns.gang.setMemberTask(name, "Ethical Hacking")
		return
	}
	const info = ns.gang.getMemberInformation(name)
	if (info.hacking < 1000 || Math.random() < 0.3) {
		ns.gang.setMemberTask(name, "Train Hacking")
	} else if (info.hacking < 5000) {
		ns.gang.setMemberTask(name, "Plant Virus")
	} else {
		ns.gang.setMemberTask(name, "Money Laundering")
	}
}

export function adjustTasks(ns) {
	const info = ns.gang.getGangInformation()
	const reduceWantedThreshold = 0.05
	const shouldReduceWanted = info.wantedPenalty < (1 - reduceWantedThreshold)
	// ns.toast(info.wantedPenalty + " " + shouldReduceWanted)
	const names = ns.gang.getMemberNames()
	for (const name of names) {
		setTask(ns, name, shouldReduceWanted)
	}
	// TODO:
	// constraints: 
	// Wanted Level delta <= 0
	// argmax(action) respect
}

export function purchaseAugs(ns, threshouldMult = 0.01) {
	const names = ns.gang.getEquipmentNames()
	const toBuyList = []
	for (const name of names) {
		if (ns.gang.getEquipmentStats(name).hack) {
			toBuyList.push(name)
		}
	}

	for (const toBuy of toBuyList) {
		const cost = ns.gang.getEquipmentCost(toBuy)
		if (cost < ns.getPlayer().money * threshouldMult) {
			for(const member of ns.gang.getMemberNames()){
				ns.gang.purchaseEquipment(member, toBuy)
			}
		}
	}
}

export async function main(ns) {
	if (!ns.gang.inGang()) {
		ns.gang.createGang("The Black Hand")
		return
	}
	const ascendThreshold = 2
	recruit(ns)
	ascend(ns, ascendThreshold)
	adjustTasks(ns)
	purchaseAugs(ns)
}