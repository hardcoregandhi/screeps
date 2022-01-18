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
require("manage.market");
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
var roleRaider = require("role.raider");

PathFinder.use(true);

focusHealing = false;
global.myRooms = {};

while (Memory.myRooms == undefined || Memory.myRooms.length == 0) {
    for (const i in Game.spawns) {
        Memory.myRooms = []
        if (Memory.myRooms.indexOf(Game.spawns[i].room.name) === -1) {
            Memory.myRooms.push(Game.spawns[i].room.name)
        }
    }
}

myRooms[Game.shard.name] = Memory.myRooms

// myRooms["shard3"] = ["W6S1", "W3S2", "W6S2"];
// myRooms["shard2"] = ["W11S5"];
global.creepRoomMap = new Map();
global.nextCreepRoomMapRefreshInterval = 60;
global.nextCreepRoomMapRefreshTime = Game.time;
global.refreshCreepTrackingNextTick = false;

global.roomTrackingRefreshInterval = 120;
global.nextRoomTrackingRefreshTime = Game.time;
global.refreshRoomTrackingNextTick = false;

global.roomRefreshMap = {}
for (s of Object.keys(myRooms)) {
    for (r of myRooms[s]) {
        roomRefreshMap[r] = nextRoomTrackingRefreshTime;
    }
}


global.creepsToKill = []

Memory.RoomVisualData = {}

/*
calls	time	avg		function
205		68.5	0.334		Creep.moveTo
136		45.5	0.335		roleMoverExt.run
247		32.2	0.130		Creep.move
80		28.9	0.361		roleHarvesterExt.run
155		25.4	0.164		Creep.moveByPath
83		23.8	0.287		RoomPosition.findPathTo
83		22.7	0.274		Room.findPath
48		21.9	0.457		roleMover.run
48		19.7	0.410		roleHarvester.run
88		16.2	0.184		Creep.harvest
24		12.9	0.538		roleBuilderExt.run
40		12.2	0.304		roleClaimer.run
2871	11.5	0.004		Room.find
120		10.8	0.090		Creep.transfer
24		10.0	0.415		towers
8		6.4		0.801		structs
78		3.7		0.048		Creep.withdraw
40		3.7		0.093		Creep.reserveController
8		3.6		0.452		renew
13		3.1		0.237		Spawn.renewCreep
464		2.3		0.005		RoomPosition.isNearTo
8		2.3		0.282		roleBuilder.run
9		2.0		0.223		Creep.repair
615		1.7		0.003		RoomPosition.inRangeTo
95		0.9		0.010		RoomPosition.findClosestByRange
132		0.7		0.005		Creep.say
8		0.5		0.063		roomTracking
8		0.5		0.060		Creep.build
8		0.5		0.059		spawns
Avg: 25.35	Total: 202.77	Ticks: 8*/

// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
global.profiler = require("screeps-profiler");

// This line monkey patches the global prototypes.
profiler.enable();

// Line to run profiling from: https://github.com/screepers/screeps-profiler
// Game.profiler.profile(10)

try {
    runBaseBuilder = profiler.registerFN(runBaseBuilder, "runBaseBuilder");
    runRenew = profiler.registerFN(runRenew, "renew");
    runRoads = profiler.registerFN(runRoads, "roads");
    runStructs = profiler.registerFN(runStructs, "structs");
    runTowers = profiler.registerFN(runTowers, "towers");
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
            nextCreepRoomMapRefreshTime = Game.time + nextCreepRoomMapRefreshInterval;
        }
        
        if (refreshRoomTrackingNextTick) {
            console.log("refreshRoomTrackingNextTick is true. Refreshing forced.")
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
            // Must be ran after creeps that will have set healingRequested
            myRooms[Game.shard.name].forEach((r) => {
                room = Game.rooms[r];
                runTowers(room);
            })
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
