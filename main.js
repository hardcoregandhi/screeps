require("manage.GUI");
require("manage.baseBuilding");
require("manage.deadCreepCleanup");
require("manage.defenders");
require("manage.spawns");
require("manage.createCreeps");
require("manage.structs");
require("manage.towers");
require("manage.creeps");
require("manage.renew");
require("manage.roads");
require("manage.utilityFunctions");
require("manage.creepTracking");
require("manage.roomTracking");
require("manage.roomExpansion");
require("manage.creepReduction");
require("manage.market");
require("manage.factory");
require("role.common");
require("global.logging");

var roleHarvester = require("role.harvester");
var roleHarvSup = require("role.harvesterSup");
var roleHarvesterExt = require("role.harvesterExt");
var roleHarvesterDeposit = require("role.harvesterDeposit");
var roleHarvesterMineral = require("role.harvesterMineral");
var roleUpgrader = require("role.upgrader");
var roleBuilder = require("role.builder");
var roleBuilderExt = require("role.builderExt");
var roleTower = require("tower");
var roleClaimer = require("role.claimer");
var roleMover = require("role.mover");
var roleMoverExt = require("role.moverExt");
var roleMoverExtRepair = require("role.moverExtRepair");
var roleMoverLink = require("role.moverLink");
var roleDefence = require("role.defense");
var roleScavenger = require("role.scavenger");
var roleTraveller = require("role.traveller");
var roleTrucker = require("role.trucker");
var roleSoldier = require("role.soldier");
var roleGunner = require("role.gunner");
var roleSieger = require("role.sieger");
var rolePowHarvester = require("role.powHarvester");
var rolePowMover = require("role.powMover");
var roleDoctor = require("role.doctor");
var roleHealer = require("role.healer");
var roleHealerChase = require("role.healerChase");
var roleInvader = require("role.invader");
var roleExplorer = require("role.explorer");
var roleCleaner = require("role.cleaner");
var roleEngineer = require("role.engineer");
var roleRaider = require("role.raider");
var roleWanderer = require("role.wanderer");
var roleRepairer = require("role.repairer");
var roleCourier = require("role.courier");

PathFinder.use(true);

focusHealing = false;
global.myRooms = {};

while (Memory.myRooms == undefined || Memory.myRooms.length == 0) {
    for (const i in Game.spawns) {
        Memory.myRooms = [];
        if (Memory.myRooms.indexOf(Game.spawns[i].room.name) === -1) {
            Memory.myRooms.push(Game.spawns[i].room.name);
        }
    }
}

myRooms[Game.shard.name] = Memory.myRooms;

// myRooms["shard3"] = ["W6S1", "W3S2", "W6S2"];
// myRooms["shard2"] = ["W11S5"];
global.creepRoomMap = new Map();
global.nextCreepRoomMapRefreshInterval = 60;
global.nextCreepRoomMapRefreshTime = Game.time;
global.refreshCreepTrackingNextTick = false;

global.roomTrackingRefreshInterval = 120;
global.nextRoomTrackingRefreshTime = Game.time;
global.refreshRoomTrackingNextTick = false;

global.roomRefreshMap = {};
for (s of Object.keys(myRooms)) {
    for (r of myRooms[s]) {
        roomRefreshMap[r] = nextRoomTrackingRefreshTime;
    }
}

global.creepsToKill = [];

Memory.RoomVisualData = {};

/*
calls	time		avg		function
1106	398.3		0.360		Creep.moveTo
677		270.5		0.400		roleMoverExt.run
386		191.7		0.497		RoomPosition.findPathTo
386		188.2		0.488		Room.findPath
171		169.6		0.992		roleHarvesterExt.run
967		167.0		0.173		Creep.move
583		111.8		0.192		Creep.moveByPath
130		54.2		0.417		roleUpgrader.run
558		26.4		0.047		Creep.transfer
50		25.8		0.516		roleBuilder.run
8785	23.3		0.003		Room.find
143		22.9		0.160		Creep.harvest
58		22.3		0.384		roleMover.run
60		18.8		0.313		roleClaimer.run
220		16.8		0.076		roleExplorer.run
304		10.3		0.034		Creep.withdraw
60		8.8	    	0.146		Creep.reserveController
30		8.7	    	0.289		roleHarvSup.run
30		8.5	    	0.285		towers
61		7.3	    	0.119		Creep.repair
30		6.3	    	0.211		Creep.heal
20		6.2	    	0.308		roleSoldier.run
10		5.7	    	0.567		roomTracking
10		4.9 		0.486		renew
20		4.3	    	0.216		Spawn.renewCreep
1964	3.9	    	0.002		RoomPosition.getRangeTo
4		3.5	    	0.877		resetSourceContainerTracking
Avg: 88.59	Total: 708.72	Ticks: 8
*/

// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
global.profiler = require("screeps-profiler");

// This line monkey patches the global prototypes.
profiler.enable();

// Line to run profiling from: https://github.com/screepers/screeps-profiler
// Game.profiler.profile(10)

try {
    // runBaseBuilder = profiler.registerFN(runBaseBuilder, "runBaseBuilder");
    // runRenew = profiler.registerFN(runRenew, "renew");
    // runRoads = profiler.registerFN(runRoads, "roads");
    // runStructs = profiler.registerFN(runStructs, "structs");
    // runTowers = profiler.registerFN(runTowers, "towers");
    // runCreeps = profiler.registerFN(runCreeps, "runCreeps");
    // runSpawns = profiler.registerFN(runSpawns, "spawns");
    // spawnCreep = profiler.registerFN(spawnCreep, "spawnCreep");
    // cloneCreep = profiler.registerFN(cloneCreep, "cloneCreep");
    // upgradeCreep = profiler.registerFN(upgradeCreep, "upgradeCreep");
    // creepTracking = profiler.registerFN(creepTracking, "creepTracking");
    // roomTracking = profiler.registerFN(roomTracking, "roomTracking");
    // creepReduction = profiler.registerFN(creepReduction, "creepReduction");
    // runRenew = profiler.registerFN(runRenew, "runRenew");
    // resetSourceContainerTracking = profiler.registerFN(resetSourceContainerTracking, "resetSourceContainerTracking");

    profiler.registerObject(roleHarvester, "roleHarvester");
    profiler.registerObject(roleHarvSup, "roleHarvSup");
    profiler.registerObject(roleHarvesterExt, "roleHarvesterExt");
    profiler.registerObject(roleUpgrader, "roleUpgrader");
    profiler.registerObject(roleBuilder, "roleBuilder");
    profiler.registerObject(roleBuilderExt, "roleBuilderExt");
    profiler.registerObject(roleClaimer, "roleClaimer");
    profiler.registerObject(roleMover, "roleMover");
    profiler.registerObject(roleMoverExt, "roleMoverExt");
    profiler.registerObject(roleMoverLink, "roleMoverLink");
    profiler.registerObject(roleDefence, "roleDefence");
    profiler.registerObject(roleScavenger, "roleScavenger");
    profiler.registerObject(roleTraveller, "roleTraveller");
    profiler.registerObject(roleTrucker, "roleTrucker");
    profiler.registerObject(roleSoldier, "roleSoldier");
    profiler.registerObject(roleGunner, "roleGunner");
    profiler.registerObject(roleSieger, "roleSieger");
    profiler.registerObject(rolePowHarvester, "rolePowHarvester");
    profiler.registerObject(rolePowMover, "rolePowMover");
    profiler.registerObject(roleDoctor, "roleDoctor");
    profiler.registerObject(roleExplorer, "roleExplorer");
    profiler.registerObject(roleCleaner, "roleCleaner");
} catch (e) {
    console.log(`${e}`);
}

module.exports.loop = function () {
    profiler.wrap(function () {
        // Cleanup
        deadCreepCleanup();

        // Event logging
        // _.forEach(Game.rooms, (room) => {
        //     let eventLog = room.getEventLog();
        //     let attackEvents = _.filter(eventLog, { event: EVENT_ATTACK });
        //     attackEvents.forEach((event) => {
        //         let target = Game.getObjectById(event.data.targetId);
        //         if (target && target.my) {
        //             console.log(event);
        //         }
        //     });
        // });

        // _.forEach(Game.rooms, (r) => {
        //     _.forEach(Memory.rooms[r.name].sources, (s) => {
        //         if(Game.getObjectById(s.id) == null) {
        //             console.log("deleting ", s.id)
        //             delete Memory.rooms[r.name].sources[s]
        //         }
        //         if(Game.getObjectById(s.id).room != r) {
        //             console.log("wrong room ", s.id)
        //             delete Memory.rooms[r.name].sources[s]
        //         }
        //     })

        // })

        if (creepRoomMap.size == 0 || Game.time >= nextCreepRoomMapRefreshTime || refreshCreepTrackingNextTick) {
            // console.log("Refreshing CreepRoomMap");
            creepTracking();
            resetSourceContainerTracking();
            nextCreepRoomMapRefreshTime = Game.time + nextCreepRoomMapRefreshInterval;
        }

        if (refreshRoomTrackingNextTick) {
            console.log("refreshRoomTrackingNextTick is true. Refreshing forced.");
        }

        // if (Game.time >= nextRoomTrackingRefreshTime || refreshRoomTrackingNextTick) {
        // console.log("Refreshing Room Tracking");
        try {
            roomTracking();
        } catch (e) {
            console.log(`roomTracking() failed: ${e}`);
        }
        nextRoomTrackingRefreshTime = Game.time + roomTrackingRefreshInterval;
        // }

        try {
            // Also includes struct resets
            runStructs();
        } catch (e) {
            console.log(`runStructs() failed: ${e}`);
            for (var b in e) {
                console.log(b);
            }
        }

        try {
            runCreeps();
        } catch (e) {
            console.log(`runCreeps() failed: ${e}`);
        }

        try {
            // Must be ran after creeps that will have set healingRequested
            myRooms[Game.shard.name].forEach((r) => {
                room = Game.rooms[r];
                runTowers(room);
            });
        } catch (e) {
            console.log(`runTowers() failed: ${e}`);
        }

        try {
            // Must be ran after creeps that will have set renewRequested
            runRenew();
        } catch (e) {
            console.log(`runRenew() failed: ${e}`);
        }
        
        try {
            // Must be after renew so healing can cancel spawns
            runSpawns();
        } catch (e) {
            console.log(`runSpawns() failed: ${e}`);
        }

        try {
            runBaseBuilder();
        } catch (e) {
            console.log(`runBaseBuilder() failed: ${e}`);
        }
        
        // try {
        //     roomExpansion();
        // } catch (e) {
        //     console.log(`roomExpansion() failed: ${e}`);
        // }

        try {
            drawGUI();
        } catch (e) {
            console.log(`drawGUI() failed: ${e}`);
        }
        

        // runRoads();

        // createRoadBetweenTargets(Game.getObjectById("6147ee1a74690ff102592dd3"), Game.getObjectById("5bbcac7f9099fc012e635904"), false)

        // Memory.prevMemory = Object.assign({}, Memory)
    });
};
