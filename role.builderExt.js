var roleHarvester = require("role.harvester");
require("movement");
require("role.common");



global.roleBuilderExt = {
    name: "builderExt",
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
    roleMemory: { memory: { building: false, targetRoomName: null, targetSource: null } },
    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, 0);
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say("🔄 harvest");
        }
        if (creep.memory.building == undefined || (!creep.memory.building && creep.store.getFreeCapacity() == 0)) {
            creep.memory.building = true;
            creep.say("🚧 build");
        }

        if (creep.ticksToLive < 300 || creep.memory.healing) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.memory.targetRoomName == undefined) {
            Log(creep, 2);
            creep.say("awaiting target");
            Log(creep, "awaiting target");
            creep.memory.targetRoomName = undefined;
            return;
        }

        if (creep.memory.building) {
            Log(creep, 5);
            Log(creep, creep.memory.targetRoomName);
            // var targets = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            // if (targets.length > 0) {
            //     if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            //         creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            //     }
            // }

           if (healRoads(creep) == OK) return;

            if (creep.memory.currentTarget != null) {
                target = Game.getObjectById(creep.memory.currentTarget)
                if (target != undefined) {
                    if (creep.build(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {
                            visualizePathStyle: { stroke: "#ffffff" },
                        });
                    }
                    return
                } else {
                    creep.memory.currentTarget = null
                    roomRefreshMap[creep.memory.targetRoomName] = Game.time;       
                }
            }

            if (Game.rooms[creep.memory.targetRoomName] == null) {
                moveToMultiRoomTarget(creep, new RoomPosition(25, 25, creep.memory.targetRoomName));
                return;
            }

            var targets = Game.rooms[creep.memory.targetRoomName].find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                Log(creep, targets);
                var closest = creep.pos.findClosestByPath(targets);
                if (closest == null) {
                    // not in the correct room so can't figure out closest
                    moveToMultiRoomTarget(creep, targets[0], false);
                    return
                }
                creep.memory.currentTarget = closest.id
                if (creep.build(closest) != OK) {
                    moveToMultiRoomTarget(creep, closest, false);
                    // creep.moveTo(closest, {
                    //     visualizePathStyle: { stroke: "#ffffff" },
                    // });
                }
            } else {
                creep.say("no targets");
                roleBuilder.run(creep);
            }
        } else {
            Log(creep, 7);
            var containers = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES).filter((structure) => {
                return structure.structureType == STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 500;
            });

            if (containers.length) {
                Log(creep, 71);
                var closest = creep.pos.findClosestByPath(containers);
                if (closest == null) {
                    // not in room cant look for closest yet
                    closest = containers[0];
                }
                if (creep.withdraw(closest, RESOURCE_ENERGY) != OK) {
                    moveToMultiRoomTarget(creep, closest);
                }
                return;
            }

            Log(creep, 8);
            var targets = Game.rooms[creep.memory.baseRoomName].find(FIND_STRUCTURES).filter((structure) => {
                return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity() > 0;
            });

            if (targets.length) {
                if (creep.withdraw(targets[0], RESOURCE_ENERGY) != OK) {
                    moveToMultiRoomTarget(creep, targets[0], {
                        visualizePathStyle: { stroke: "#ffaa00" },
                    });
                }
            } else {
                creep.say("oopsiewoopsie");
            }
        }
    },
};

module.exports = roleBuilderExt;
