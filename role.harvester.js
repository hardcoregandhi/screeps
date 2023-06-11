require("role.harvesterCommon");

global.roleHarvester = {
    name: "harvester",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE],
    baseBodyParts: [WORK,WORK,CARRY,MOVE],
    bodyLoop: [WORK, WORK, WORK, CARRY, MOVE],
    bodyPartsMaxCount: 13,
    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, "roleHarvester")

        creep.memory.noHeal = true;
        var sources = creep.room.find(FIND_SOURCES);
        if (creep.memory.targetSource == undefined) {
            var lowestSource = 99;
            
            _.forEach(Memory.rooms[creep.memory.baseRoomName].sources, (s) => {
                if (myRooms[Game.shard.name].includes(r.name) || Memory.rooms[r.name].mainSpawn != undefined) { // for new rooms we don't care
                    if (s.targettedBy >= s.miningSpots && s.container == undefined) {
                        return;
                    }
                }
                if (s.targettedBy < lowestSource) {
                    lowestSource = s.targettedBy;
                    creep.memory.targetSource = s.id;
                }
            });
        }
        if (creep.memory.mining == undefined) {
            creep.memory.mining = true;
        }

        if (creep.memory.scoopSize == undefined || creep.spawning) {
            scoopSize = 0;
            _.forEach(creep.body, (b) => {
                if (b.type == WORK) {
                    scoopSize += 2;
                }
            });
            // console.log(creep.name, scoopSize)
            creep.memory.scoopSize = scoopSize;
        }

        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            creep.memory.experimentalMovement = true
            if (creep.memory.experimentalMovement != undefined) {
                moveToRoom(creep, creep.memory.baseRoomName);
                return;
            }
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

        if (creep.memory.mining && creep.store.getFreeCapacity() < creep.memory.scoopSize) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
        }
        if (!creep.memory.mining && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.mining = true;
            creep.say("⛏️ mining");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (upgradeCreep(creep.name) == 0) {
                return;
            }
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.memory.mining) {
            pickupNearby(creep);

            targetSource = Game.getObjectById(creep.memory.targetSource);
            if (trackedHarvest(creep, targetSource) != OK) {
                creep.moveTo(targetSource, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        } else {
            if (creep.memory.focusBuilding) {
                fallbackToOtherRoles(creep);
                return;
            }

            if (healRoads(creep) == OK) return;
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (
                        (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_CONTAINER ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER ||
                            structure.structureType == STRUCTURE_STORAGE) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > structure.store.getCapacity(RESOURCE_ENERGY) / 2
                    );
                },
            });
            var towers = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            });
            focusHealing = false;
            if (targets.length > 0) {
                var target = null;
                //Priority is
                /* 
                    1. itself
                    2. the colony
                    3. healing
                    4. speed
                */
                var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                // console.log(closestHostile)
                if (closestHostile && towers.length) {
                    if (creep.transfer(towers[0], RESOURCE_ENERGY) != OK) {
                        creep.moveTo(towers[0]);
                    }
                    return;
                }

                // If we have Movers, just use the storage
                if (creepRoomMap.get(creep.memory.baseRoomName + "mover") != undefined && creepRoomMap.get(creep.memory.baseRoomName + "mover") > 0) {
                    Log(creep, "movers found");

                    if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].link != undefined) {
                        Log(creep, "local link found");
                        if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container != undefined) {
                            if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.id != undefined) {
                                old_container = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.id)
                                if (old_container != undefined) {
                                    old_container.destroy()
                                    delete Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container
                                }
                            }
                        }


                        var link = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].link);
                        if (link == null) {
                            Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].link = undefined;
                        }
                        if (creep.transfer(link, RESOURCE_ENERGY) != OK) {
                            moveToMultiRoomTarget(creep, link.pos);
                        }

                        Log(creep, link.store.getFreeCapacity(RESOURCE_ENERGY));

                        if (link.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                            // transmit
                            Log(creep, "transmitting");
                            // try {
                            //     link_controller = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_controller)
                            //     if (link_controller.store.getFreeCapacity(RESOURCE_ENERGY) > 10) {
                            //         link.transferEnergy(link_controller, link_controller.store.getFreeCapacity(RESOURCE_ENERGY))
                            //         return
                            //     }
                            // } catch (e) {
                            //     console.log(`${creep.name} failed to use ${link}, ${e}`)
                            // }

                            try {
                                link_storage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_storage);
                                link_controller = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_controller);
                                if (link_controller && link_controller.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                                    link.transferEnergy(link_controller, link_controller.store.getFreeCapacity(RESOURCE_ENERGY));
                                    return;
                                } else if (link_storage){
                                    link.transferEnergy(link_storage, link_storage.store.getFreeCapacity(RESOURCE_ENERGY));
                                    return;
                                }
                            } catch (e) {
                                console.log(`${creep.name}@${creep.pos} failed to use ${link}, ${e}`);
                            }
                        }
                        return;
                    } else {
                        if (creep.room.controller.level >= 6) {
                            //try to build a link
                            var csites = creep.room.find(FIND_CONSTRUCTION_SITES).filter((site) => {
                                return creep.pos.inRangeTo(site, 1);
                            });
                            if (csites.length) {
                                Log(creep, "building");
                                if (creep.build(csites[0]) == ERR_NOT_IN_RANGE) {
                                    moveToMultiRoomTarget(creep, csites[0]);
                                }
                                return;
                            } else {
                                targetSource = Game.getObjectById(creep.memory.targetSource);
                                if (targetSource.pos.inRangeTo(creep.pos, 2)) {
                                    var csites = Game.rooms[creep.memory.baseRoomName].find(FIND_CONSTRUCTION_SITES, {
                                        filter: (site) => {
                                            return targetSource.pos.inRangeTo(site, 3); //; && site.structureType == STRUCTURE_CONTAINER;
                                        },
                                    });
                                    if (csites.length == 0) {
                                        const terrain = creep.room.getTerrain();
                                        for (var i = targetSource.pos.x - 1; i <= targetSource.pos.x + 1; i++) {
                                            for (var j = targetSource.pos.y - 1; j <= targetSource.pos.y + 1; j++) {
                                                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                                                    for (var ii = i - 1; ii <= i + 1; ii++) {
                                                        for (var jj = j - 1; jj <= j + 1; jj++) {
                                                            if (terrain.get(ii, jj) != TERRAIN_MASK_WALL) {
                                                                if(creep.room.createConstructionSite(ii, jj, STRUCTURE_LINK) == OK)
                                                                    return;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    moveToMultiRoomTarget(creep, targetSource);
                                }
                            }
                        }
                    }

                    if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container != undefined) {
                        target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.id);
                        creep.memory.targetContainer = target.id;
                        Log(creep, "local ccont found");
                        Log(creep, target);
                        
                        if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targetCarryParts == undefined) {
                            
                            ret = calcTargetCarryParts(target, Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainSpawn.id), Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container);
                            if (ret != -1) {
                                Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targetCarryParts = ret
                            } else {
                                console.log(`failed to calc targetCarryParts for ${creep.memory.targetSource.substr(-3)}, cant continue`)
                                return
                            }
                        }
                        

                        if (
                            Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targettedBy == 0 ||
                            Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targetCarryParts != undefined &&
                            Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targetCarryParts != 0 &&
                            Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.currentCarryParts < Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targetCarryParts &&
                            Memory.rooms[creep.memory.baseRoomName].mainStorage != undefined
                        ) {
                            Log(creep, "spawning harvSup")
                            customBody = [];
                            if (Memory.rooms[creep.memory.baseRoomName].mainTower == undefined) {
                                customBody.push(WORK);
                            }
                            customBody = customBody.concat(Array(Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targetCarryParts).fill(CARRY));
                            customBody = customBody.concat(Array(Math.ceil(Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targetCarryParts/2)).fill(MOVE));
                            // console.log(Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targetCarryParts)
                            console.log(customBody)
                            
                            spawnCreep(roleHarvSup, customBody, { memory: { targetSource: creep.memory.targetSource, targetContainer: creep.memory.targetContainer } }, creep.memory.baseRoomName);
                        }

                        if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targettedBy == 0) {
                            if (target != null && target.hits < 200000) {
                                Log(creep, `healing ${target}`);
                                if (creep.repair(target) != OK) {
                                    moveToMultiRoomTarget(creep, target);
                                }
                                return;
                            }
                            if (target.store.getFreeCapacity() <= 50){
                                roleHarvSup.run(creep);
                                return;
                            }
                        }

                        source = Game.getObjectById(creep.memory.targetSource);
                        return depositInSupportedContainer(creep, source, target);
                    } else {
                        creep.say("makin con");
                        source = Game.getObjectById(creep.memory.targetSource)
                        
                        if (source.pos.inRangeTo(creep.pos, 2)) {
                            var csites = Game.rooms[creep.memory.baseRoomName].find(FIND_CONSTRUCTION_SITES, {
                                filter: (site) => {
                                    return source.pos.inRangeTo(site, 3); //; && site.structureType == STRUCTURE_CONTAINER;
                                },
                            });
                            if (csites.length == 0) {
                                const terrain = creep.room.getTerrain();
                                for (var i = source.pos.x - 1; i <= source.pos.x + 1; i++) {
                                    for (var j = source.pos.y - 1; j <= source.pos.y + 1; j++) {
                                        if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                                            for (var ii = i - 1; ii <= i + 1; ii++) {
                                                for (var jj = j - 1; jj <= j + 1; jj++) {
                                                    if (terrain.get(ii, jj) != TERRAIN_MASK_WALL) {
                                                        if(creep.room.createConstructionSite(ii, jj, STRUCTURE_CONTAINER) == OK)
                                                            return;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            moveToMultiRoomTarget(creep, source);
                        }

                    }

                    var csites = Game.rooms[creep.memory.baseRoomName].find(FIND_CONSTRUCTION_SITES).filter((site) => {
                        return creep.pos.inRangeTo(site, 1);
                    });
                    if (csites.length) {
                        Log(creep, "building");
                        if (creep.build(csites[0]) == ERR_NOT_IN_RANGE) {
                            moveToMultiRoomTarget(creep, csites[0]);
                        }
                        return;
                    }

                    mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
                    if (mainStorage != undefined) {
                        Log(creep, "mainStorage found");
                        if (mainStorage != null && mainStorage.hits < 200000 && mainStorage.structureType == STRUCTURE_CONTAINER) {
                            if (creep.repair(mainStorage) == ERR_NOT_IN_RANGE) {
                                moveToMultiRoomTarget(creep, mainStorage.pos);
                            }
                        } else if (mainStorage.store.getFreeCapacity() == 0) {
                            roleUpgrader.run(creep);
                        } else {
                            if (creep.transfer(mainStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                moveToMultiRoomTarget(creep, mainStorage.pos);
                            }
                        }
                        return;
                    }
                    Log(creep, "mainStorage not found");

                    targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                        return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    });
                    if (!targets.length) {
                        Log(creep, "no storage found");
                        targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                            return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                        });

                        if (!targets.length) {
                            Log(creep, "no container found");
                        } else target = creep.pos.findClosestByPath(targets);
                        if (target != null && target.hits < 200000 && target.structureType == STRUCTURE_CONTAINER) {
                            creep.repair(target);
                        } else if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            moveToMultiRoomTarget(creep, target.pos);
                        }
                        return;
                    }
                } else {
                    Log(creep, "no movers found");
                    targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                        return (
                            (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_TOWER) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                        );
                    });
                    if (!targets.length) {
                        Log(creep, "no exts, spawn, or container found");
                        targets = towers;
                    }
                    // console.log(targets)
                }
                target = creep.pos.findClosestByPath(targets);
                Log(creep, `target: ${target}`);

                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    moveToTarget(creep, target.pos);
                }
            } else {
                fallbackToOtherRoles(creep);
            }
        }
    },
};

function fallbackToOtherRoles(creep) {
    Log(creep, "fallbackToOtherRoles")
    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (targets.length) {
        roleBuilder.run(creep);
        return;
    } else {
        roleUpgrader.run(creep);
        return;
    }
}

module.exports = roleHarvester;
