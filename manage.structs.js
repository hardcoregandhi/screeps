var roleTower = require("tower");

global.runStructs = function () {
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

        var links = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_LINK;
            },
        });
        var storage = null;
        var storages = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_STORAGE;
            },
        });
        if (storages.length) {
            storage = storages[0];
            if (Memory.rooms[room.name] == undefined) {
                Memory.rooms[room.name] = {};
            }
            Memory.rooms[room.name].storage = storage.id;
        }
        if (links.length == 2 && storage != null) {
            var l_from = storage.pos.findClosestByRange(links);
            var l_to = links.filter((l) => l != l_from)[0];
            if (Memory.rooms[room.name] == undefined) {
                Memory.rooms[room.name] = {};
            }

            Memory.rooms[room.name].l_from = l_from.id;
            Memory.rooms[room.name].l_to = l_to.id;
            Memory.rooms[room.name].storage = storage.id;

            if (l_from && l_from.store.getUsedCapacity([RESOURCE_ENERGY]) == 800 && creepRoomMap.get(room.name + "eenergy") > 2000) {
                if (l_to.store.getUsedCapacity([RESOURCE_ENERGY]) == 0) {
                    console.log(`Sending energy: ${room.name} Return:` + l_from.transferEnergy(l_to, 800));
                }
            }
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
};
