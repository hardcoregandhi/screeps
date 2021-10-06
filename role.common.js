/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.common');
 * mod.thing == 'a thing'; // true
 */

function log(creep, msg) {
    if (0) if (creep.name == "MoverExt_250") console.log(msg);
}

global.healRoads = function (creep) {
    // Heal Roads
    var towers = creep.room.find(FIND_STRUCTURES).filter((structure) => {
        return structure.structureType == STRUCTURE_TOWER;
    });
    if (towers.length == 0) {
        log(creep, "no towers");
        const damagedStructs = creep.room.find(FIND_STRUCTURES).filter((object) => {
            return object.structureType == STRUCTURE_ROAD && object.hits < object.hitsMax / 2 && creep.pos.inRangeTo(object, 1);
        });
        damagedStructs.sort((a, b) => a.hits - b.hits);
        if (damagedStructs.length > 0) {
            log(creep, "damaged tower found");
            log(creep, creep.repair(damagedStructs[0]));

            return creep.repair(damagedStructs[0]);
        }
    }
    //END Heal Roads
};

global.pickupNearby = function (creep) {
    // console.log("pickupNearby")
    var droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES).filter((r) => r.amount >= 150);
    var tombstoneResource = creep.room.find(FIND_TOMBSTONES).filter((r) => r.store.getUsedCapacity() >= 150);
    var ruinResource = creep.room.find(FIND_RUINS).filter((object) => creep.pos.inRangeTo(object, 1));

    if (droppedEnergy.length > 0) {
        // console.log(creep.name + " picking up Nearby")
        creep.pickup(droppedEnergy[0]);
    }
    if (tombstoneResource.length > 0) {
        creep.withdraw(tombstoneResource[0], RESOURCE_ENERGY);
    }
    if (ruinResource.length > 0) {
        creep.withdraw(ruinResource[0], RESOURCE_ENERGY);
    }
};

global.returnToHeal = function (creep, room) {
    if (creep.ticksToLive >= 1400) {
        creep.memory.healing = false;
        return false;
    }
    if (Game.rooms[room].energyAvailable < 50) {
        return false;
    }

    if (creep.memory.healing === true) {
        spawn = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainSpawn.id);
        if (creep.room.name != room) {
            moveToMultiRoomTarget(creep, spawn);
            return true;
        }

        // if (targets.length == 0 || (creep.room.energyAvailable < 100 && creep.store.getUsedCapacity(RESOURCE_ENERGY) < 50)) {
        //     return false;
        // }

        if (creep.transfer(spawn, RESOURCE_ENERGY) != OK) {
            creep.moveTo(spawn, {
                visualizePathStyle: { stroke: "#ffaa00" },
            });
        }
        return true;
    }
};

global.interShardMove = function (creep) {
    if (creep.memory.interShard.length == 0) {
        delete creep.memory.interShard;
    }

    switch (creep.memory.interShard[0]) {
        case "PORTAL":
            portal = creep.room.find(FIND_STRUCTURES).filter((s) => {
                return s.structureType == STRUCTURE_PORTAL;
            });
            if (!portal.length) {
                console.log(`${creep.name}@${creep.pos} error: no portal found`);
                return;
            }
            if (portal.isNearTo(creep)) {
                creep.memory.interShard.shift();
                return;
            }
            creep.moveTo(portal[0]);

            break;
        default:
            if (creep.room.name != creep.memory.interShard[0]) {
                const route = Game.map.findRoute(creep.room.name, creep.memory.interShard[0]);
                if (route.length > 0) {
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            } else {
                creep.memory.interShard.shift();
            }
            break;
    }
};
