/** @param {NS} ns */

import { Crimes } from "/lib/crime.js"

export function iSleeve(sleeveId) {
	return {
		currentCity: (ns) => ns.sleeve.getInformation(sleeveId).city,
		travelTo: (ns, city) => ns.sleeve.travel(sleeveId, city),
		workout: (ns, statName, gymName, focus) => ns.sleeve.setToGymWorkout(sleeveId, gymName, statName),
		study: (ns, university, course, focus) => ns.sleeve.setToUniversityCourse(sleeveId, university, course),
		crime: (ns, crime) => {
			const curTask = ns.sleeve.getTask(sleeveId)
			return (curTask.task != 'Crime' || curTask.crime != crime) ? ns.sleeve.setToCommitCrime(sleeveId, crime) : true
		},
		factionWork: (ns, faction, work, focus) => {
			const numSleeves = ns.sleeve.getNumSleeves()
			for (let i = 0; i < numSleeves; i++) {
				const task = ns.sleeve.getTask(i)
				if (task.task == 'Faction' && task.location == faction && i != sleeveId) {
					ns.print("Can't work for " + task.location + " since some other sleeve has taken this work.")
					return false
				}
			}
			return ns.sleeve.setToFactionWork(sleeveId, faction, work)
		},
		companyWork: (ns, company, focus) => {
			const numSleeves = ns.sleeve.getNumSleeves()
			for (let i = 0; i < numSleeves; i++) {
				const task = ns.sleeve.getTask(i)
				if (task.task == 'Company' && task.location == company && i != sleeveId) {
					ns.print("Can't work for " + task.location + " since some other sleeve has taken this work.")
					return false
				}
			}
			return ns.sleeve.setToCompanyWork(sleeveId, company)
		},
		currentTask: (ns) => ns.sleeve.getTask(sleeveId),
		stats: (ns) => ns.sleeve.getSleeveStats(sleeveId),
		mult: (ns, stat) => ns.sleeve.getInformation(sleeveId).mult[stat],
		expMult: (ns, stat) => ns.sleeve.getInformation(sleeveId).mult[stat + "Exp"],
		crimeChance: (ns, crime) => {
			const crimeDef = Crimes[crime]
			if (crimeDef.name == crime) {
				const stat = ns.sleeve.getSleeveStats(sleeveId)
				stat['crime_success_mult'] = ns.sleeve.getInformation(sleeveId).mult.crimeSuccess
				return crimeDef.successRate(stat)
			}
			return 0
		},
		type: "sleeve",
		name: "sleeve" + sleeveId,
	}
}