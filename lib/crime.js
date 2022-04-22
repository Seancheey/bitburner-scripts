/** @param {NS} ns */

export default function findBestProfitCrime(ns, player) {
	let bestCrime = "Shoplift"
	let maxProfit = 0
	for (const c of Object.keys(Crimes)) {
		let chance = player.crimeChance(ns, c)
		const stat = ns.getCrimeStats(c)
		const profit = chance * stat.money / stat.time
		if (profit > maxProfit) {
			bestCrime = c
			maxProfit = profit
		}
	}
	return bestCrime
}

class Crime {
	constructor(name = "", time = 0, money = 0, difficulty = 0, karma = 0, params = {}) {
		this.name = name;
		this.time = time;
		this.money = money;
		this.difficulty = difficulty;
		this.karma = karma;
		this.hacking_success_weight = params.hacking_success_weight ? params.hacking_success_weight : 0;
		this.strength_success_weight = params.strength_success_weight ? params.strength_success_weight : 0;
		this.defense_success_weight = params.defense_success_weight ? params.defense_success_weight : 0;
		this.dexterity_success_weight = params.dexterity_success_weight ? params.dexterity_success_weight : 0;
		this.agility_success_weight = params.agility_success_weight ? params.agility_success_weight : 0;
		this.charisma_success_weight = params.charisma_success_weight ? params.charisma_success_weight : 0;
		this.hacking_exp = params.hacking_exp ? params.hacking_exp : 0;
		this.strength_exp = params.strength_exp ? params.strength_exp : 0;
		this.defense_exp = params.defense_exp ? params.defense_exp : 0;
		this.dexterity_exp = params.dexterity_exp ? params.dexterity_exp : 0;
		this.agility_exp = params.agility_exp ? params.agility_exp : 0;
		this.charisma_exp = params.charisma_exp ? params.charisma_exp : 0;
		this.intelligence_exp = params.intelligence_exp ? params.intelligence_exp : 0;
		this.kills = params.kills ? params.kills : 0;
	}

	successRate(p) {
		// This is my simplified formula. Intelligence influence is stripped from formula.
		let chance =
			this.hacking_success_weight * p.hacking +
			this.strength_success_weight * p.strength +
			this.defense_success_weight * p.defense +
			this.dexterity_success_weight * p.dexterity +
			this.agility_success_weight * p.agility +
			this.charisma_success_weight * p.charisma;
		chance /= 975;
		chance /= this.difficulty;
		chance *= p.crime_success_mult;

		return Math.min(chance, 1);
	}
}

export const Crimes = {
	Shoplift: new Crime("Shoplift", 2e3, 15e3, 1 / 20, 0.1, {
		dexterity_success_weight: 1,
		agility_success_weight: 1,

		dexterity_exp: 2,
		agility_exp: 2,
	}),

	RobStore: new Crime("Rob Store", 60e3, 400e3, 1 / 5, 0.5, {
		hacking_exp: 30,
		dexterity_exp: 45,
		agility_exp: 45,

		hacking_success_weight: 0.5,
		dexterity_success_weight: 2,
		agility_success_weight: 1,

		intelligence_exp: 7.5 * 0.05,
	}),

	Mug: new Crime("Mug", 4e3, 36e3, 1 / 5, 0.25, {
		strength_exp: 3,
		defense_exp: 3,
		dexterity_exp: 3,
		agility_exp: 3,

		strength_success_weight: 1.5,
		defense_success_weight: 0.5,
		dexterity_success_weight: 1.5,
		agility_success_weight: 0.5,
	}),

	Larceny: new Crime("Larceny", 90e3, 800e3, 1 / 3, 1.5, {
		hacking_exp: 45,
		dexterity_exp: 60,
		agility_exp: 60,

		hacking_success_weight: 0.5,
		dexterity_success_weight: 1,
		agility_success_weight: 1,

		intelligence_exp: 15 * 0.05,
	}),

	DealDrugs: new Crime("Deal Drugs", 10e3, 120e3, 1, 0.5, {
		dexterity_exp: 5,
		agility_exp: 5,
		charisma_exp: 10,

		charisma_success_weight: 3,
		dexterity_success_weight: 2,
		agility_success_weight: 1,
	}),

	BondForgery: new Crime("Bond Forgery", 300e3, 4.5e6, 1 / 2, 0.1, {
		hacking_exp: 100,
		dexterity_exp: 150,
		charisma_exp: 15,

		hacking_success_weight: 0.05,
		dexterity_success_weight: 1.25,

		intelligence_exp: 60 * 0.05,
	}),

	TraffickArms: new Crime("Traffick Arms", 40e3, 600e3, 2, 1, {
		strength_exp: 20,
		defense_exp: 20,
		dexterity_exp: 20,
		agility_exp: 20,
		charisma_exp: 40,

		charisma_success_weight: 1,
		strength_success_weight: 1,
		defense_success_weight: 1,
		dexterity_success_weight: 1,
		agility_success_weight: 1,
	}),

	Homicide: new Crime("Homicide", 3e3, 45e3, 1, 3, {
		strength_exp: 2,
		defense_exp: 2,
		dexterity_exp: 2,
		agility_exp: 2,

		strength_success_weight: 2,
		defense_success_weight: 2,
		dexterity_success_weight: 0.5,
		agility_success_weight: 0.5,

		kills: 1,
	}),

	GrandTheftAuto: new Crime("Grand Theft Auto", 80e3, 1.6e6, 8, 5, {
		strength_exp: 20,
		defense_exp: 20,
		dexterity_exp: 20,
		agility_exp: 80,
		charisma_exp: 40,

		hacking_success_weight: 1,
		strength_success_weight: 1,
		dexterity_success_weight: 4,
		agility_success_weight: 2,
		charisma_success_weight: 2,

		intelligence_exp: 16 * 0.05,
	}),

	Kidnap: new Crime("Kidnap", 120e3, 3.6e6, 5, 6, {
		strength_exp: 80,
		defense_exp: 80,
		dexterity_exp: 80,
		agility_exp: 80,
		charisma_exp: 80,

		charisma_success_weight: 1,
		strength_success_weight: 1,
		dexterity_success_weight: 1,
		agility_success_weight: 1,

		intelligence_exp: 26 * 0.05,
	}),

	Assassination: new Crime("Assassination", 300e3, 12e6, 8, 10, {
		strength_exp: 300,
		defense_exp: 300,
		dexterity_exp: 300,
		agility_exp: 300,

		strength_success_weight: 1,
		dexterity_success_weight: 2,
		agility_success_weight: 1,

		intelligence_exp: 65 * 0.05,

		kills: 1,
	}),

	Heist: new Crime("Heist", 600e3, 120e6, 18, 15, {
		hacking_exp: 450,
		strength_exp: 450,
		defense_exp: 450,
		dexterity_exp: 450,
		agility_exp: 450,
		charisma_exp: 450,

		hacking_success_weight: 1,
		strength_success_weight: 1,
		defense_success_weight: 1,
		dexterity_success_weight: 1,
		agility_success_weight: 1,
		charisma_success_weight: 1,

		intelligence_exp: 130 * 0.05,
	}),
};