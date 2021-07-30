function log(creep, str) {
    // if (creep.name == "Harvester_393")
    if (0) console.log(str);
}

var roleHarvester = require("role.harvester");

global.roleHarvesterExt = {
    name: "harvesterExt",
    roleMemory: { memory: { targetRoomName: null } },

    BodyParts: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.healing === true) {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_SPAWN;
                },
            });
            if (creep.transfer(targets[0], RESOURCE_ENERGY) != OK) {
                creep.moveTo(targets[0], {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
            return;
        }

        if (creep.memory.mining && creep.store.getFreeCapacity() == 0) {
            creep.memory.mining = false;
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
            creep.say("🔄 dropping");
        }
        if (!creep.memory.mining && creep.store.getUsedCapacity() == 0) {
            if (creep.ticksToLive < 400) {
                creep.say("healing");
                creep.memory.healing = true;
                return;
            }
            creep.memory.healing = false;
            creep.memory.mining = true;
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
            creep.say("⛏️ mining");
        }

        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
        }

        if (creep.room.name != creep.memory.fakeBaseRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.fakeBaseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                moveToTarget(creep, exit, true);
            } else {
                creep.say("No route found");
            }
            return;
        }

        if (creep.memory.mining) {
            var targetSource = creep.pos.findClosestByRange(creep.room.find(FIND_SOURCES));
            if (creep.harvest(targetSource) != OK) {
                // console.log(creep.harvest(targetSource))
                creep.moveTo(targetSource, { visualizePathStyle: { stroke: "#ffaa00" } }, { swampCost: 1 });
            }
            return;
        } else {
            targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_CONTAINER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
            if (!targets.length) {
                log(creep, "no exts, spawn, or container found");
            } else {
                target = creep.pos.findClosestByPath(targets);
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    moveToTarget(creep, target.pos, true);
                }
            }

            /*
            var targetCreep = creep.pos.findClosestByRange(
                creep.room.find(FIND_MY_CREEPS, {
                        filter: (creep) => {
                            return (creep.memory.role == "moverExt")
                        }
                    })
                )
            if (targetCreep) {
                creep.say('No creep found');
                creep.transfer(targetCreep, RESOURCE_ENERGY)
            }
            */
        }
    },
};

module.exports = roleHarvesterExt;
