function log(creep, str) {
    if (0) if (creep.name == "MoverLink_875") console.log(str);
}

/*

*/

global.roleMoverLink = {
    Status: {
        MOVING: 1,
        PICKUP: 2,
        LOADING: 3,
    },
    name: "moverLink",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        MOVE,
        CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY,
        ],
    baseBodyParts: [MOVE],
    bodyLoop: [CARRY],
    bodyPartsMaxCount: 17,

    /** @param {Creep} creep **/
    run: function (creep) {
        log(creep, 0);
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            if (creep.memory.experimentalMovement != undefined) {
                moveToRoom(creep, creep.memory.baseRoomName);
                return;
            }
            log(creep, 1);
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit, {
                    visualizePathStyle: { stroke: "#ffffff" },
                });
            } else {
                creep.say("No route found");
            }
            return;
        }

        log(creep, 2);

        if (creep.memory.moving == undefined) creep.memory.moving = true;
        if (creep.memory.moving && creep.store.getUsedCapacity() == 0) {
            log(creep, "setting moving false");
            creep.memory.moving = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.moving && creep.store.getFreeCapacity() == 0) {
            log(creep, "setting moving true");
            creep.memory.moving = true;
            creep.say("dropping");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        log(creep, 5);

        var link_controller = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_controller);
        var link_storage = Game.getObjectById(Memory.rooms[creep.room.name].link_storage);
        var mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
        if (creepRoomMap.get(creep.room.name + "eenergy") > 100000 && link_controller.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            log(creep, "controller empty, filling ", link_controller);
            creep.withdraw(mainStorage, RESOURCE_ENERGY);
            creep.transfer(link_storage, RESOURCE_ENERGY);
            link_storage.transferEnergy(link_controller, link_storage.store.getUsedCapacity(RESOURCE_ENERGY));
            return;
        }

        if (creep.memory.moving) {
            log(creep, "moving");

            if (mainStorage == undefined) {
                log(creep, "mainStorage could not be found");
            } else {
                log(creep, "using mainStorage");
                if (creep.transfer(mainStorage, RESOURCE_ENERGY) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.moveTo(mainStorage, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                    });
                }
            }
            return;
        } else {
            log(creep, "!moving");
            try {
                if (link_storage.store.getUsedCapacity() == 0) {
                    // no energy, but can still store what is already withdrawn
                    creep.memory.moving = true;
                }
                // if (creepRoomMap.get(creep.room.name + "eenergy") < 20000) {
                if (creep.withdraw(link_storage, RESOURCE_ENERGY) != OK) {
                    log(creep, creep.withdraw(link_storage, RESOURCE_ENERGY));
                    log(creep, "moving to " + link_storage);
                    creep.moveTo(link_storage);
                }
                // } else {
                //     try {
                //
                //         if (link_controller.store.getFreeCapacity(RESOURCE_ENERGY) > 10) {
                //             console.log(link_storage.transferEnergy(link_controller, link_controller.store.getFreeCapacity(RESOURCE_ENERGY)))
                //             return
                //         }
                //     } catch (e) {
                //         console.log(`${creep.name} failed to use ${link}, ${e}`)
                //     }
                // }
                return;
            } catch (e) {
                console.log(`${creep}: ${e}`);
            }
        }
    },
};

module.exports = roleMoverLink;
