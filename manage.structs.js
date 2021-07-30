var roleTower = require("tower");

global.runStructs = function() {
    _.forEach(Game.rooms, (room) => {
        var towers = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_TOWER;
            },
        });

        for (var t of towers) {
            roleTower.run(t);
        }

        var pspawns = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_POWER_SPAWN;
            },
        });
        for (var p of pspawns) {
            p.processPower();
        }
    });

    // Renew
    for (var s in Game.spawns) {
        for (var i in Game.creeps) {
            if (Game.spawns[s].renewCreep(Game.creeps[i]) == 0) {
                Game.creeps[i].cancelOrder("move");
            }
        }
    }
}

