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
require("role.common");
require("global.logging");

var roleHarvester = require("role.harvester");
var roleHarvSup = require("role.harvesterSup");
var roleHarvesterExt = require("role.harvesterExt");
var roleHarvesterDeposit = require("role.harvesterDeposit");
var roleUpgrader = require("role.upgrader");
var roleBuilder = require("role.builder");
var roleBuilderExt = require("role.builderExt");
var roleTower = require("tower");
var roleClaimer = require("role.claimer");
var roleMover = require("role.mover");
var roleMoverExt = require("role.moverExt");
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

PathFinder.use(true);

focusHealing = false;
global.myRooms = {};

myRooms["shard3"] = ["W6S1", "W3S2", "W6S2"];
myRooms["shard2"] = ["W11S5"];
global.creepRoomMap = new Map();
global.nextCreepRoomMapRefreshInterval = 60;
global.nextCreepRoomMapRefreshTime = Game.time + nextCreepRoomMapRefreshInterval;
global.refreshCreepTrackingNextTick = false;
/*
calls		time		avg		    function
2119		571.4		0.270		Creep.moveTo
2127		407.4		0.192		Creep.move
1547		317.2		0.205		Creep.moveByPath
498		    266.1		0.534		roleMover.run
579		    254.5		0.440		roleMoverExt.run
577		    189.0		0.328		roleHarvester.run
536		    172.2		0.321		roleHarvesterExt.run
30149		142.8		0.005		Room.find
415		    132.2		0.318		roleUpgrader.run
83		    129.7		1.563		roomTracking
805		    127.2		0.158		Creep.harvest
83		    108.2		1.303		structs
166		    83.2		0.501		roleGunner.run
553		    78.3		0.142		RoomPosition.findPathTo
553		    71.8		0.130		Room.findPath
727		    71.6		0.098		Creep.transfer
166		    70.7		0.426		roleSoldier.run
3807		60.4		0.016		RoomPosition.findClosestByRange
166		    56.3		0.339		roleBuilder.run
166		    55.7		0.336		roleHarvSup.run
82		    53.4		0.651		renew
200		    42.5		0.213		Creep.heal
839		    21.0		0.025		Creep.withdraw
208		    19.6		0.094		Creep.repair
82		    19.3		0.235		Spawn.renewCreep
79		    18.7		0.237		Creep.upgradeController
78		    18.4		0.236		roleClaimer.run
Avg: 19.10	Total: 1872.12	Ticks: 98
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
            console.log("Refreshing CreepRoomMap");
            creepTracking();
            resetSourceContainerTracking();
            nextCreepRoomMapRefreshTime += nextCreepRoomMapRefreshInterval;
        }

        try {
            roomTracking();
        } catch (e) {
            console.log(`roomTracking() failed: ${e}`);
        }

        try {
            runStructs();
        } catch (e) {
            console.log(`runStructs() failed: ${e}`);
            for (var b in e) {
                console.log(b);
            }
        }

        try {
            runSpawns();
        } catch (e) {
            console.log(`runSpawns() failed: ${e}`);
        }

        try {
            runCreeps();
        } catch (e) {
            console.log(`runCreeps() failed: ${e}`);
        }

        try {
            runRenew();
        } catch (e) {
            console.log(`runRenew() failed: ${e}`);
        }

        try {
            runBaseBuilder();
        } catch (e) {
            console.log(`runBaseBuilder() failed: ${e}`);
        }
        
        drawGUI();

        // runRoads();

        // createRoadBetweenTargets(Game.getObjectById("6147ee1a74690ff102592dd3"), Game.getObjectById("5bbcac7f9099fc012e635904"), false)

        // Memory.prevMemory = Object.assign({}, Memory)
    });
};
