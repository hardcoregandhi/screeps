require("movement");
require("role.common");

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
        Log(creep, "roleRepairer")
        if (creep.memory.interShard) {
            interShardMove(creep);
            return;
        }

        if (!creep.memory.currentSource == null) {
            creep.memory.currentSource = 0;
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            Log(creep, "returning home.")
            moveToMultiRoomTarget(creep, new RoomPosition(25, 25, creep.memory.baseRoomName));
            return;
        }

        if (creep.memory.repairing && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.repairing = false;
            creep.say("🔄 harvest");
            Log(creep, "setting repairing false")
        }
        if (!creep.memory.repairing && creep.store.getFreeCapacity() == 0) {
            creep.memory.repairing = true;
            creep.say("🚧 build");
            Log(creep, "setting repairing true")
        }

        if (creep.memory.repairing) {
            Log(creep, "repairing")

            if (creep.memory.currentTarget != null) {
                target = Game.getObjectById(creep.memory.currentTarget);
                Log(creep, `currentTarget ${creep.memory.currentTarget}: ${target}`)
                Log(creep, `target.hits: ${target.hits}: getStructureHealLimit: ${getStructureHealLimit(creep.room, target)}`)
                if (target != undefined && getStructureHealLimit(creep.room, target)) {
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
                    }
                } else {
                    Log(creep, `currentTarget is now null`)
                    creep.memory.currentTarget = null;
                }
            }
            if (creep.memory.currentTarget == null) {
                var customStructureSpecificPercentLimits = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                    return getStructureHealLimit(creep.room, structure) && (Game.flags.DISMANTLE == undefined || !Game.flags.DISMANTLE.pos.isEqualTo(structure.pos));
                });
                if (customStructureSpecificPercentLimits.length) {
                    creep.memory.currentTarget = creep.pos.findClosestByRange(customStructureSpecificPercentLimits).id
                }
            }
                
        } else {
            Log(creep, "!repairing")

            mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
            if (mainStorage == undefined) {
                Log(creep, "mainStorage could not be found");
            } else {
                Log(creep, "using mainStorage");
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
                return;
            }

        }
    },
};

module.exports = roleRepairer;
