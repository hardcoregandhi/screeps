require("movement");
require("role.common");

getRepairerStructureHealLimit = function (room, structure, wallHealPercent) {
    switch (structure.structureType) {
        case STRUCTURE_ROAD:
            return (structure.hits / structure.hitsMax) * 100 < 50;
        case STRUCTURE_CONTAINER:
            return (structure.hits / structure.hitsMax) * 100 < 50;
        case STRUCTURE_RAMPART:
            return (structure.hits / structure.hitsMax) * 100 < wallHealPercent * 10;
        case STRUCTURE_WALL:
            return (structure.hits / structure.hitsMax) * 100 < wallHealPercent;
    }
};

global.roleRepairer = {
    name: "repairer",
    // prettier-ignore
    BodyParts: [
        WORK, WORK, WORK, WORK, WORK,
        WORK, WORK, WORK, WORK, WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [],
    bodyLoop: [WORK, CARRY, MOVE],
    roleMemory: { memory: {} },
    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, "roleRepairer");
        if (creep.memory.interShard) {
            interShardMove(creep);
            return;
        }
        if (creep.memory.wallHealPercent == undefined) {
            creep.memory.wallHealPercent = Game.rooms[creep.memory.baseRoomName].controller.level * 0.01;
        }

        if (!creep.memory.currentSource == null) {
            creep.memory.currentSource = 0;
        }

        if ((creep.ticksToLive < 100 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (upgradeCreep(creep.name) == 0) {
                return;
            }
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            Log(creep, "returning home.");
            moveToMultiRoomTarget(creep, new RoomPosition(25, 25, creep.memory.baseRoomName));
            return;
        }

        if (creep.memory.repairing && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.repairing = false;
            creep.say("🔄 harvest");
            Log(creep, "setting repairing false");
        }
        if (!creep.memory.repairing && creep.store.getFreeCapacity() == 0) {
            creep.memory.repairing = true;
            creep.say("🚧 build");
            Log(creep, "setting repairing true");
        }

        if (creep.memory.repairing) {
            Log(creep, "repairing");

            if (creep.memory.currentTarget != null) {
                target = Game.getObjectById(creep.memory.currentTarget);
                Log(creep, `currentTarget ${creep.memory.currentTarget}: ${target}`);
                Log(creep, `target.hits: ${target.hits}: getRepairerStructureHealLimit: ${getRepairerStructureHealLimit(creep.room, target)}`);
                if (target != undefined && getRepairerStructureHealLimit(creep.room, target, creep.memory.wallHealPercent)) {
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
                    }
                } else {
                    Log(creep, `currentTarget is now null`);
                    creep.memory.currentTarget = null;
                }
            }
            if (creep.memory.currentTarget == null) {
                var customStructureSpecificPercentLimits = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                    return getRepairerStructureHealLimit(creep.room, structure, creep.memory.wallHealPercent) && (Game.flags.DISMANTLE == undefined || !Game.flags.DISMANTLE.pos.isEqualTo(structure.pos));
                });
                Log(creep, customStructureSpecificPercentLimits);
                if (customStructureSpecificPercentLimits.length) {
                    Log(creep, "repair targets found:" + customStructureSpecificPercentLimits);
                    customStructureSpecificPercentLimits.sort((a, b) => a.hits - b.hits);
                    creep.memory.currentTarget = customStructureSpecificPercentLimits[0].id;
                } else {
                    creep.memory.wallHealPercent = creep.memory.wallHealPercent + 0.01;
                }
            }
        } else {
            Log(creep, "!repairing");

            mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
            link_controller = Game.getObjectById(Memory.rooms[creep.room.name].link_controller);
            if (mainStorage == undefined) {
                Log(creep, "mainStorage could not be found");
            } else {
                Log(creep, "using mainStorage");
                if (link_controller && creep.pos.getRangeTo(link_controller) < creep.pos.getRangeTo(mainStorage) && creep.room.controller.level == 8) {
                    if (creep.withdraw(link_controller, RESOURCE_ENERGY) != OK) {
                        // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                        creep.moveTo(link_controller, {
                            visualizePathStyle: { stroke: "#ffaa00" },
                            maxRooms: 0,
                        });
                    }
                } else {
                    if (mainStorage.store.getUsedCapacity() > mainStorage.store.getCapacity() * 0.01) {
                        if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                            // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                            creep.moveTo(mainStorage, {
                                visualizePathStyle: { stroke: "#ffaa00" },
                                maxRooms: 0,
                            });
                        }
                    } else {
                        moveToTarget(creep, creep.room.controller.pos);
                        return;
                    }
                }
                return;
            }
        }
    },
};

module.exports = roleRepairer;
