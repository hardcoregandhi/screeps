var roleTower = require("tower");

global.runStructs = function () {
    console.log(Game.shard.name);
    myRooms.forEach((r) => {
        room = Game.rooms[r];

        if (room == null) return;

        console.log(room);

        // var allStructures = room.find(FIND_STRUCTURES);

        // var stores = [];
        // var pspawns = [];
        // var containers = [];
        // var towers = [];
        // var links = [];
        // var observers = [];

        // for (structure of allStructures) {
        //     switch (structure.structureType) {
        //         case STRUCTURE_STORAGE:
        //             stores.push(structure);
        //             break;
        //         case STRUCTURE_CONTAINER:
        //             containers.push(structure);
        //             break;
        //         case STRUCTURE_SPAWN:
        //             spawns.push(structure);
        //             break;
        //         case STRUCTURE_TOWER:
        //             roleTower.run(structure);
        //             towers.push(structure);
        //             break;
        //         case STRUCTURE_POWER_SPAWN:
        //             pspawns.push(structure);
        //             p.processPower();
        //             break;
        //         case STRUCTURE_LINK:
        //             links.push(structure);
        //             break;
        //         case STRUCTURE_OBSERVER:
        //             observers.push(structure);
        //             break;
        //     }
        // }

        // var towers = room.find(FIND_STRUCTURES).filter((s) => s.structureType == STRUCTURE_TOWER);
        // for (t of Memory.rooms[room.name].towers) {
        //     roleTower.run(Game.getObjectById(t));
        // }

        runTowers(room);

        if (Memory.rooms[room.name].link_storage && Memory.rooms[room.name].link_controller) {
            // console.log(`${room.name} has 2 links`)
            var link_storage = Game.getObjectById(Memory.rooms[room.name].link_storage);
            if (link_storage == null) {
                Memory.rooms[room.name].link_storage == undefined;
                Memory.rooms[room.name].link_controller == undefined;
            }

            // if (link_storage && link_storage.store.getUsedCapacity([RESOURCE_ENERGY]) == 800 && creepRoomMap.get(room.name + "eenergy") > 2000) {
            //     var link_controller = Game.getObjectById(Memory.rooms[room.name].link_controller);
            //     if (link_controller == null) {
            //         Memory.rooms[room.name].link_storage == undefined
            //         Memory.rooms[room.name].link_controller == undefined
            //     }
            //     if (link_controller.store.getUsedCapacity([RESOURCE_ENERGY]) == 0) {
            //         // console.log(`Sending energy: ${room.name} Return:` + link_storage.transferEnergy(link_controller, 800));
            //         link_storage.transferEnergy(link_controller, 800);
            //     }
            // }
        }
        // else if(links.length > 2) {

        // }

        if (Memory.rooms[room.name].observer != undefined) {
            // set target rooms and iterator
            targetPowerRooms = ["W13S21", "W14S21", "W15S21", "W16S21", "W17S21", "W18S21", "W19S21"];
            if (Memory.rooms[room.name].targetPowerRooms == undefined) {
                Memory.rooms[room.name].targetPowerRooms = targetPowerRooms;
                Memory.rooms[room.name].targetPowerRoom = 0;
            }

            o = Game.getObjectById(Memory.rooms[room.name].observer);
            observerTarget = Memory.rooms[room.name].targetPowerRooms[Memory.rooms[room.name].targetPowerRoom];
            o.observeRoom(observerTarget);
            console.log(Game.rooms[observerTarget]);
            // the room will be available on the next tick after observeRoom runs
            if (Game.rooms[observerTarget] != undefined) {
                var powerBanks = room.find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_POWER_BANK);
                if (powerBanks.length) {
                    // TODO: do something with found power bank
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

        var hostileCreeps = room.find(FIND_HOSTILE_CREEPS).filter((c) => c.body.find((part) => part.type == ATTACK));
        if (hostileCreeps.length > 2) {
            if (room.controller.my && room.controller.safeModeAvailable) room.controller.activateSafeMode();
            Game.notify(">2 attackers in " + room.name + ". Activated Safe Mode.");
        }
        if (hostileCreeps.length > 1 && room.controller.level <= 3 /* && towers.length == 0*/) {
            if (room.controller != undefined && room.controller.my && room.controller.safeModeAvailable) {
                room.controller.activateSafeMode();
            }
        }
    });
};
