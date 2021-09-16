require("movement");

function log(creep, str) {
    if (0) if (creep.name === "Upgrader_758") console.log(str);
}

global.roleUpgrader = {
    name: "upgrader",
    roleMemory: { memory: {} },
    // memory: { baseRoomName: "W15S21" },
    // prettier-ignore
    BodyParts: [
        WORK, WORK, WORK, WORK, WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [WORK, CARRY, CARRY, MOVE, MOVE],
    bodyLoop: [WORK, CARRY, MOVE],
    /** @param {Creep} creep **/
    run: function (creep) {
        log(creep, "run");
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
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
        var sources = creep.room.find(FIND_SOURCES);

        if (creep.memory.upgrading == undefined) {
            creep.memory.upgrading = false;
        }

        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say("⚡ upgrade");
        }
        log(creep, 1);

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        pickupNearby(creep);

        var mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);

        if (creep.memory.upgrading) {
            log(creep, 2);

            healRoads(creep);
            if (creep.upgradeController(creep.room.controller) != OK) {
                moveToTarget(creep, creep.room.controller.pos, false);
            }
        } else {
            var links = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_LINK;
                },
            });
            if (creep.room.memory.l_from != undefined && creep.room.memory.l_to != undefined) {
                try {
                    var l_to = Game.getObjectById(Memory.rooms[creep.room.name].l_to);
                    if (l_to && l_to.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                        creep.say("h2link");
                        if (creep.withdraw(l_to, RESOURCE_ENERGY) != OK) {
                            moveToTarget(creep, l_to);
                        }
                        moveToTarget(creep, l_to);
                        return;
                    }
                } catch (error) {
                    console.log(error);
                    console.trace();
                }
            }
            if (mainStorage != undefined && links.length != 2) {
                if (
                    (creepRoomMap.get(creep.room.name + "eenergy") < 2000 && creep.room.energyAvailable < creep.room.energyCapacityAvailable - 400) ||
                    (mainStorage.structureType == STRUCTURE_CONTAINER && mainStorage.store.getUsedCapacity() < mainStorage.store.getCapacity() / 2)
                ) {
                    moveToTarget(creep, creep.room.controller.pos, false);
                    return;
                } else {
                    if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                        moveToTarget(creep, mainStorage.pos, false);
                    }
                }
            }
        }
    },
};

module.exports = roleUpgrader;
