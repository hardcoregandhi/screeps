/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.common');
 * mod.thing == 'a thing'; // true
 */

global.Log = function (creep, str) {
    if (creep.memory.debug != undefined && creep.memory.debug == true) console.log(`${creep.name}: ${str}`);
};

global.healRoads = function (creep) {
    // Heal Roads
    var towers = creep.room.find(FIND_STRUCTURES).filter((structure) => {
        return structure.structureType == STRUCTURE_TOWER;
    });
    if (towers.length == 0) {
        Log(creep, "no towers");
        const damagedStructs = creep.room.find(FIND_STRUCTURES).filter((object) => {
            return object.structureType == STRUCTURE_ROAD && object.hits < object.hitsMax / 2 && creep.pos.inRangeTo(object, 1);
        });
        damagedStructs.sort((a, b) => a.hits - b.hits);
        if (damagedStructs.length > 0) {
            Log(creep, "damaged tower found");
            Log(creep, creep.repair(damagedStructs[0]));

            return creep.repair(damagedStructs[0]);
        }
    }
    return -1
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
    Log(creep, "returnToHeal")

    if (creep.ticksToLive >= 1400) {
        delete creep.memory.timeStartingRenew;
        creep.memory.healing = false;
        return false;
    }
    
    if (creep.memory.timeStartingRenew == undefined) {
        creep.memory.timeStartingRenew = Game.time
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

        if (creep.pos.isNearTo(spawn)) {
            // console.log(`${creep.name} setting ${spawn.name} renewRequested: true` )
            lowestWaitListSpawn = null
            lowestWaitListLength = 99
            _.forEach(Memory.rooms[creep.room.name].spawns, (s) => {
                // console.log(JSON.stringify(s))
                if (Object.keys(s.creeps).length < lowestWaitListLength) {
                    lowestWaitListLength = Object.keys(s.creeps).length
                    lowestWaitListSpawn = Game.getObjectById(s.id);
                }
            })
            // console.log(`lowestWaitListLength: ${lowestWaitListLength}`)
            // console.log(`lowestWaitListSpawn: ${lowestWaitListSpawn}`)
            spawn = lowestWaitListSpawn
            Memory.rooms[creep.room.name].spawns[spawn.name].renewRequested = true;
            Memory.rooms[creep.room.name].spawns[spawn.name].creeps[creep.id] = true;
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

global.fallbackToOtherRoles = function (creep, roomName) {
    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (targets.length) {
        roleBuilder.run(creep);
        return;
    } else {
        roleUpgrader.run(creep);
        return;
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
            portal = portal[0];
            InterShardMemory.setLocal(JSON.stringify(creep.memory));
            creep.moveTo(portal);

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

global.EnemyCheckFleeRequestBackup = function(creep) {

    Log(creep, "EnemyCheckFleeRequestBackup")
    
    if (isHighwayRoom(creep.room.name)) {
        return
    }

    if (Game.rooms[creep.memory.targetRoomName] != undefined) {
        var invaderCore = Game.rooms[creep.memory.targetRoomName].find(FIND_HOSTILE_STRUCTURES).filter((structure) => {
                return structure.structureType == STRUCTURE_INVADER_CORE;
            });
        var hostileCreeps = Game.rooms[creep.memory.targetRoomName].find(FIND_HOSTILE_CREEPS)
        var hostileAttackCreeps = hostileCreeps.filter((c) => {
                return c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK);
            });
        rangedCount = 0;
        meleeCount = 0;
        if (hostileAttackCreeps.length) {
            console.log(hostileCreeps);
            _.forEach(hostileCreeps, (c) => {
                _.forEach(c.body, (part) => {
                    switch (part.type) {
                        case ATTACK:
                            meleeCount++;
                            if (part.boost != undefined) {
                                meleeCount++;
                            }
                            break;
                        case RANGED_ATTACK:
                            rangedCount++;
                            if (part.boost != undefined) {
                                rangedCount++;
                            }
                            break;
                        case HEAL:
                            meleeCount++;
                            rangedCount++;
                            if (part.boost != undefined) {
                                meleeCount++;
                                rangedCount++;
                            }
                            break;
                    }
                });
            });
        }
        

        if (hostileAttackCreeps.length && hostileCreeps[0].owner.username != "Tigga" || invaderCore.length ) {
            try {
                if (meleeCount > rangedCount || creepRoomMap.get(creep.memory.baseRoomName + "soldierTarget" + creep.memory.targetRoomName) == undefined || creepRoomMap.get(creep.memory.baseRoomName + "soldierTarget" + creep.memory.targetRoomName) < 1) {
                    requestSoldier(creep.memory.baseRoomName, creep.memory.targetRoomName, meleeCount+rangedCount);
                } else if (meleeCount < rangedCount || creepRoomMap.get(creep.memory.baseRoomName + "gunnerTarget" + creep.memory.targetRoomName) == undefined || creepRoomMap.get(creep.memory.baseRoomName + "gunnerTarget" + creep.memory.targetRoomName) < 1) {
                    requestGunner(creep.memory.baseRoomName, creep.memory.targetRoomName, meleeCount+rangedCount);
                }
            } catch (e) {
                console.log(`${creep}: ${e}`);
            }
            if (invaderCore.length) return;
            creep.memory.fleeing = 20;
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                moveToTarget(creep, exit);
                return;
            }
        } else {
            creep.memory.fleeing = false;
        }
    }
}

global.TransferAll = function(creep, storage) {
    Log(creep, "TransferAll");
    for (const resourceType in creep.store) {
        if (creep.transfer(storage, resourceType) != OK) {
            // console.log(creep.transfer(storage, resourceType) )
            creep.moveTo(storage);
            return;
        }
    }
}
