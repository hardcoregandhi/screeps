var roleTower = require("tower");

global.runStructs = function () {
    myRooms.forEach((r) => {
        room = Game.rooms[r];

        allStructures = room.find(FIND_STRUCTURES);

        stores = [];
        pspawns = [];
        containers = [];
        towers = [];
        links = [];
        observers = [];

        for (structure of allStructures) {
            switch (structure.structureType) {
                case STRUCTURE_STORAGE:
                    stores.push(structure);
                    break;
                case STRUCTURE_CONTAINER:
                    containers.push(structure);
                    break;
                case STRUCTURE_SPAWN:
                    spawns.push(structure);
                    break;
                case STRUCTURE_TOWER:
                    roleTower.run(structure);
                    towers.push(structure);
                    break;
                case STRUCTURE_POWER_SPAWN:
                    pspawns.push(structure);
                    p.processPower();
                    break;
                case STRUCTURE_LINK:
                    links.push(structure);
                    break;
                case STRUCTURE_OBSERVER:
                    observers.push(structure);
                    break;
            }
        }

        if (towers.length == 0) {
            if (room.controller != undefined && room.controller.my && room.controller.safeModeAvailable) room.controller.activateSafeMode();
        }

        if (links.length == 2) {
            var l_from = Memory.rooms[room.name].l_from.id;
            var l_to = Memory.rooms[room.name].l_to.id;

            if (l_from && l_from.store.getUsedCapacity([RESOURCE_ENERGY]) == 800 && creepRoomMap.get(room.name + "eenergy") > 2000) {
                if (l_to.store.getUsedCapacity([RESOURCE_ENERGY]) == 0) {
                    // console.log(`Sending energy: ${room.name} Return:` + l_from.transferEnergy(l_to, 800));
                    l_from.transferEnergy(l_to, 800);
                }
            }
        }

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
    });
};
