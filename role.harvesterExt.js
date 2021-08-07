function log(creep, str) {
    // if (creep.name == "Harvester_393")
    if (0) console.log(str);
}

var roleHarvester = require("role.harvester");

global.roleHarvesterExt = {
    name: "harvesterExt",
    roleMemory: { memory: { targetRoomName: "W17S21" } },

    // prettier-ignore
    BodyParts: [
        WORK, WORK, WORK, WORK, WORK,
        WORK, WORK, WORK, WORK, WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE
        ],

    /** @param {Creep} creep **/
    run: function (creep) {
        // TODO a creep should not spawn other creeps
        if (creep.memory.targetRoomName != undefined && Game.rooms[creep.memory.targetRoomName] != undefined) {
            if ((Game.rooms[creep.memory.targetRoomName].controller.reservation == undefined || Game.rooms[creep.memory.targetRoomName].controller.reservation.ticksToEnd < 1000) && creepRoomMap.get(creep.memory.targetRoomName + "claimer") != 1) {
                //TODO FIX THIS
                console.log(1);
                console.log(spawnCreep(roleClaimer, null, { memory: { baseRoomName: "W17S21" } }, "W16S21"));
            }
        }
        if (creep.ticksToLive > 1400) {
            creep.memory.healing = false;
        }

        if (creep.ticksToLive < 300) {
            creep.say("healing");
            creep.memory.healing = true;
            returnToHeal(creep, creep.memory.baseRoomName);
            return;
        }
        if (creep.memory.mining && creep.store.getFreeCapacity() == 0) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
        }
        if (!creep.memory.mining && creep.store.getUsedCapacity() == 0) {
            creep.memory.healing = false;
            creep.memory.mining = true;
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
            pickupNearby(creep);
            var targetSource = creep.pos.findClosestByRange(creep.room.find(FIND_SOURCES));
            if (creep.harvest(targetSource) != OK) {
                // console.log(creep.harvest(targetSource))
                creep.moveTo(targetSource, { visualizePathStyle: { stroke: "#ffaa00" } }, { swampCost: 1 });
            }
            return;
        } else {
            //Build any nearby container or road
            csites = creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: (site) => {
                    return creep.pos.inRangeTo(site, 3);
                },
            });
            if (csites.length) {
                if (creep.build(csites[0]) == ERR_NOT_IN_RANGE) {
                    moveToTarget(creep, csites[0], true);
                }
                return;
            }
            targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_CONTAINER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
            if (!targets.length) {
                log(creep, "no exts, spawn, or container found");
            } else {
                target = creep.pos.findClosestByPath(targets);
                if (target.hitsMax - target.hits > 100) creep.repair(target);
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
