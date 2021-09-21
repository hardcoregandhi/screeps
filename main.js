require("manage.baseBuilding");
require("manage.spawns");
require("manage.createCreeps");
require("manage.structs");
require("manage.creeps");
require("manage.renew");
require("manage.roads");
require("manage.utilityFunctions");
require("manage.creepTracking");
require("manage.roomTracking");
require("role.common");
require("global.logging");

var roleHarvester = require("role.harvester");
var roleHarvSup = require("role.harvesterSup");
var roleHarvesterExt = require("role.harvesterExt");
var roleUpgrader = require("role.upgrader");
var roleBuilder = require("role.builder");
var roleBuilderExt = require("role.builderExt");
var roleTower = require("tower");
var roleClaimer = require("role.claimer");
var roleMover = require("role.mover");
var roleMoverExt = require("role.moverExt");
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
var roleInvader = require("role.invader");
var roleExplorer = require("role.explorer");
var roleCleaner = require("role.cleaner");

PathFinder.use(true);

focusHealing = false;
global.myRooms = ["W6S1", "W3S2", "W6S2"];

/*
calls		time		avg	    	function
9574		200.1		0.021		Room.find
33199		58.1		0.002		RoomPosition.inRangeTo
1100		4.6	    	0.004		Room.lookForAt
300	     	4.0	    	0.013		RoomPosition.findClosestByRange
13	    	3.2	    	0.245		Spawn.renewCreep
24	    	1.6	    	0.067		Creep.move
175	    	0.9	    	0.005		Room.getTerrain
4	    	0.5	    	0.115		Spawn.spawnCreep
26	    	0.2	    	0.008		RoomPosition.getRangeTo
13	    	0.1	    	0.006		RoomPosition.isNearTo
13	    	0.0	    	0.003		Creep.cancelOrder
Avg: 15.11	Total: 347.42	Ticks: 23


calls		time		avg		function
2005		42.3		0.021		Room.find
6465		11.6		0.002		RoomPosition.inRangeTo
220	    	0.7 		0.003		Room.lookForAt
60		    0.7	    	0.012		RoomPosition.findClosestByRange
35	    	0.2	    	0.005		Room.getTerrain
Avg: 23.08	Total: 69.24	Ticks: 3


calls		time		avg		function
9574		200.1		0.021		Room.find
33199		58.1		0.002		RoomPosition.inRangeTo
1100		4.6 		0.004		Room.lookForAt
300	    	4.0	    	0.013		RoomPosition.findClosestByRange
13	    	3.2		    0.245		Spawn.renewCreep
24	    	1.6 		0.067		Creep.move
175	    	0.9 		0.005		Room.getTerrain
4	    	0.5 		0.115		Spawn.spawnCreep
26	    	0.2 		0.008		RoomPosition.getRangeTo
13	    	0.1 		0.006		RoomPosition.isNearTo
13  		0.0 		0.003		Creep.cancelOrder
Avg: 15.11	Total: 347.42	Ticks: 23



// after swapping find(filter:) for find().filter()
calls		time		avg		    function
96	    	96.7		1.007		roleMover.run
237		    72.3		0.305		Creep.moveTo
25		    63.4		2.536		roomTracking
175		    50.3		0.287		roleMoverExt.run
222		    43.9		0.198		Creep.move
168		    40.6		0.242		RoomPosition.findClosestByPath
7167	    39.6		0.006		Room.find
25		    37.1		1.482		structs
100		    33.4		0.334		roleHarvSup.run
100		    32.3		0.323		roleHarvester.run
152		    32.0		0.211		Creep.moveByPath
175		    30.8		0.176		roleHarvesterExt.run
25		    30.8		1.231		creepTracking
75		    23.6		0.314		roleUpgrader.run
96		    21.8		0.227		Creep.harvest
50		    19.7		0.395		roleBuilder.run
300		    18.4		0.061		Creep.transfer
6305	   	16.0		0.003		RoomPosition.inRangeTo
70		    15.0		0.215		Creep.upgradeController
56		    10.4		0.186		roleClaimer.run
69		    9.2	        0.134		RoomPosition.findPathTo
69		    8.3	        0.121		Room.findPath
744		    8.3	        0.011		RoomPosition.findClosestByRange
1837	   	8.0	        0.004		RoomPosition.isNearTo
56		    5.7	        0.102		Creep.reserveController
25		    5.7	        0.227		renew
Avg: 21.03	Total: 483.65	Ticks: 23

*/

// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const profiler = require("screeps-profiler");

// This line monkey patches the global prototypes.
profiler.enable();

// Line to run profiling from: https://github.com/screepers/screeps-profiler
// Game.profiler.profile(10)

try {
    runBaseBuilder = profiler.registerFN(runBaseBuilder, "runBaseBuilder");
    runRenew = profiler.registerFN(runRenew, "renew");
    runRoads = profiler.registerFN(runRoads, "roads");
    runStructs = profiler.registerFN(runStructs, "structs");
    runSpawns = profiler.registerFN(runSpawns, "spawns");
    creepTracking = profiler.registerFN(creepTracking, "creepTracking");
    roomTracking = profiler.registerFN(roomTracking, "roomTracking");

    profiler.registerObject(roleHarvester, "roleHarvester");
    profiler.registerObject(roleHarvSup, "roleHarvSup");
    profiler.registerObject(roleHarvesterExt, "roleHarvesterExt");
    profiler.registerObject(roleUpgrader, "roleUpgrader");
    profiler.registerObject(roleBuilder, "roleBuilder");
    profiler.registerObject(roleBuilderExt, "roleBuilderExt");
    profiler.registerObject(roleClaimer, "roleClaimer");
    profiler.registerObject(roleMover, "roleMover");
    profiler.registerObject(roleMoverExt, "roleMoverExt");
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
        for (var i in Memory.creeps) {
            if (!Game.creeps[i]) {
                delete Memory.creeps[i];
            }
        }

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

        creepTracking();

        roomTracking();

        runStructs();

        runSpawns();

        runCreeps();

        runRenew();

        // runRoads();

        runBaseBuilder();

        // createRoadBetweenTargets(Game.getObjectById("5bbcaca99099fc012e635f5f"), Game.getObjectById("613a2d3b1c64906ca07f5676"))
    });
};
