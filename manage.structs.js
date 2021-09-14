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
        
        if(towers.length == 0) {
            if(room.controller != undefined && room.controller.my && room.controller.safeModeAvailable) room.controller.activateSafeMode();
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
                    // console.log(`Sending energy: ${room.name} Return:` + l_from.transferEnergy(l_to, 800));
                    l_from.transferEnergy(l_to, 800);
                }
            }
        }

        var observers = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_OBSERVER;
            },
        });

        for (var o of observers) {
            // set target rooms and iterator
            targetPowerRooms = ["W13S21", "W14S21", "W15S21", "W16S21", "W17S21", "W18S21", "W19S21"];
            if (Memory.rooms[room.name].targetPowerRooms == undefined) {
                Memory.rooms[room.name].targetPowerRooms = targetPowerRooms;
                Memory.rooms[room.name].targetPowerRoom = 0;
            }

            observerTarget = Memory.rooms[room.name].targetPowerRooms[Memory.rooms[room.name].targetPowerRoom];
            o.observeRoom(observerTarget);
            console.log(Game.rooms[observerTarget]);
            // the room will be available on the next tick after observeRoom runs
            if (Game.rooms[observerTarget] != undefined) {
                var powerBanks = room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_POWER_BANK;
                    },
                });
                if (powerBanks.length) {
                } else {
                    console.log("no power found, iterating observer");
                    Memory.rooms[room.name].targetPowerRoom = Memory.rooms[room.name].targetPowerRooms.length == Memory.rooms[room.name].targetPowerRoom ? 0 : Memory.rooms[room.name].targetPowerRoom + 1;
                }
            }
        }

        // var ramparts = room.find(FIND_STRUCTURES, {
        //     filter: (structure) => {
        //         return structure.structureType == STRUCTURE_RAMPART;
        //     },
        // });
        // for (var r of ramparts) {
        //     r.setPublic(false)
        // }

        var hostileCreeps = room.find(FIND_HOSTILE_CREEPS, {filter: (c) => {return c.body.find((part) => part.type == ATTACK)}})
        if (hostileCreeps.length > 2) {
            if(room.controller.my && room.controller.safeModeAvailable)
                room.controller.activateSafeMode();
            Game.notify("2 attackers in " + room.name + ". Activated Safe Mode.");
        }
    });
};
