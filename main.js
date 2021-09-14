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

PathFinder.use(true);

focusHealing = false;
global.myRooms = ["W6S1", "W3S2"];


/*
2250 energy capacity might be too little to harvest 2 ext rooms

*/

// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const profiler = require("screeps-profiler");

// This line monkey patches the global prototypes.
profiler.enable();

// Line to run profiling from: https://github.com/screepers/screeps-profiler
// Game.profiler.profile(10)


try {
    profiler.registerObject(runBaseBuilder, 'runBaseBuilder');
    profiler.registerObject(runRenew, 'renew');
    profiler.registerObject(runRoads, 'roads');
    profiler.registerObject(creepTracking, 'creepTracking');
    profiler.registerObject(roomTracking, 'roomTracking');
    

    
    profiler.registerObject(roleHarvester, 'roleHarvester');
    profiler.registerObject(roleHarvSup, 'roleHarvSup');
    profiler.registerObject(roleHarvesterExt, 'roleHarvesterExt');
    profiler.registerObject(roleUpgrader, 'roleUpgrader');
    profiler.registerObject(roleBuilder, 'roleBuilder');
    profiler.registerObject(roleBuilderExt, 'roleBuilderExt');
    profiler.registerObject(roleClaimer, 'roleClaimer');
    profiler.registerObject(roleMover, 'roleMover');
    profiler.registerObject(roleMoverExt, 'roleMoverExt');
    profiler.registerObject(roleDefence, 'roleDefence');
    profiler.registerObject(roleScavenger, 'roleScavenger');
    profiler.registerObject(roleTraveller, 'roleTraveller');
    profiler.registerObject(roleTrucker, 'roleTrucker');
    profiler.registerObject(roleSoldier, 'roleSoldier');
    profiler.registerObject(roleGunner, 'roleGunner');
    profiler.registerObject(roleSieger, 'roleSieger');
    profiler.registerObject(rolePowHarvester, 'rolePowHarvester');
    profiler.registerObject(rolePowMover, 'rolePowMover');
    profiler.registerObject(roleDoctor, 'roleDoctor');
    profiler.registerObject(roleExplorer, 'roleExplorer');
    profiler.registerObject(roleCleaner, 'roleCleaner');

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
    });
};
