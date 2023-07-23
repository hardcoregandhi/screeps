global.runSpawns = function () {
    Debug = function (roomName, str) {
        if (0 && roomName == "W17N1") {
            console.log(`${roomName}: ${str}`);
        }
    };
    global.nextSpawnOffset = 1;

    // spawnCreep(roleBuilder, "auto", {memory:{interShard:["W10S0", "PORTAL", "W11S5"], baseRoomName:"W11S5"}}, "W6S1")

    for (var room in Game.rooms) {
        r = Game.rooms[room];
        if (!myRooms[Game.shard.name].includes(r.name) || Memory.rooms[r.name].mainSpawn == undefined) {
            // console.log(`skipping ${r.name}`)
            continue;
        }
        // console.log(`runSpawns(): ${r.name}`)energyCapacityAvailable
        // if((Memory.rooms[room].mainStorage == undefined && creepRoomMap.get(r.name + "harvester") < Memory.rooms[r.name].totalMiningSpots * 2) || r.controller.level <=2) {
        //     spawnCreep(roleHarvester, [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,], { memory: { baseRoomName: r.name, experimentalMovement: true, focusBuilding: true } }, "W6S1");
        //     continue;
        // }

        // if (r.find(STRUCTURE_SPAWN).length === 0 && creepRoomMap.get(r.name + "builder") < 5){
        //     // No spawn? Builders to create it, which will then default to upgraders to maintain the room after
        //     spawnCreep(roleBuilder, [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,], { memory: { baseRoomName: r.name } }, "W6S1");
        //     continue
        // }

        // if (Memory.rooms[room].structs.terminal && r.name != "W17N1")
        // delete Memory.rooms[room].structs.terminal.supportRoom

        // Neighbouring room investigations
        unsearchedNeighbouringRooms = _.filter(Memory.rooms[r.name].neighbouringRooms, (roomName) => {
            return Memory.rooms[roomName] == undefined;
        });
        // console.log(unsearchedNeighbouringRooms)

        if (Memory.rooms[r.name].spawnQueue != undefined && Memory.rooms[r.name].spawnQueue.length) {
            customBody = Memory.rooms[r.name].spawnQueue[0][1]
            if (getBodyCost(customBody) == 0 || getBodyCost(customBody) > Game.rooms[r.name].energyCapacityAvailable) {
                customBody = "auto"
            }
            var ret = spawnCreep(eval(Memory.rooms[r.name].spawnQueue[0][0]), customBody, Memory.rooms[r.name].spawnQueue[0][2], Memory.rooms[r.name].spawnQueue[0][3]);
            if (ret == 0) {
                Memory.rooms[r.name].spawnQueue = _.drop(Memory.rooms[r.name].spawnQueue);
                continue;
            }
        }
        Debug(r.name, "runSpawns");

        mainStorage = Game.getObjectById(Memory.rooms[r.name].mainStorage);

        if (Memory.createClaimer) {
            if (spawnCreep(roleClaimer, null, { memory: { baseRoomName: r.name } }, r.name) == 0) {
                Memory.createClaimer = false;
            }
        } else if (Memory.rooms[r.name].mainStorage != null && creepRoomMap.get(r.name + "eenergy") != 0 && (creepRoomMap.get(r.name + "handler") == undefined || creepRoomMap.get(r.name + "handler") < 1)) {
            // console.log("spawnHandler")
            spawnCreep(roleHandler, "auto", null, r.name);
            continue;
        } else if (spawnMover(r)) {
            // console.log("spawnMover")
            continue;
        } else if (creepRoomMap.get(r.name + "moverLink") < 1 && r.memory.link_storage != undefined) {
            spawnCreep(roleMoverLink, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "harvester") == undefined || spawnHarvester(r)) {
            // console.log("spawnHarvester")
            continue;
            /*} else if (unsearchedNeighbouringRooms.length > 0) {
            // spawnCreep(roleExplorer, null, {memory: {targetRoomName:unsearchedNeighbouringRooms[0]}}, r.name);
            continue;*/
        } else if (Memory.rooms[r.name].mainStorage == undefined) {
            continue;
        } else if (creepRoomMap.get(r.name + "builder") < 1 && creepRoomMap.get(r.name + "csites") != 0 && mainStorage.store.getUsedCapacity() > mainStorage.store.getCapacity()/10) {
            spawnCreep(roleBuilder, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (r.controller.level >=5 && creepRoomMap.get(r.name + "handler") < 2 && r.energyCapacityAvailable > 1000) {
            spawnCreep(roleHandler, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 1 && r.controller.level < 8 && mainStorage.store.getUsedCapacity() > mainStorage.store.getCapacity()/10) {
            // console.log("spawnUpgrader")
            spawnCreep(roleUpgrader, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if ((creepRoomMap.get(r.name + "upgraderSupport") == undefined || creepRoomMap.get(r.name + "upgraderSupport") < Math.max(1, Math.floor(creepRoomMap.get(r.name + "upgrader") / 2))) &&
                    r.controller.level < 8 && creepRoomMap.get(r.name + "upgrader") >= 1) {
            // console.log("spawnUpgraderSupport")
            spawnCreep(roleUpgraderSupport, "auto", { memory: { baseRoomName: r.name, noHeal: true } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 2 && r.controller.level < 8 && r.energyAvailable == r.energyCapacityAvailable && mainStorage.store.getFreeCapacity() <= mainStorage.store.getCapacity()/10 && (Memory.rooms[r.name].roomExpansion ? Memory.rooms[r.name].roomExpansion.active : true)) {
            spawnCreep(roleUpgrader, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 1 && r.controller.level == 8 && r.controller.ticksToDowngrade < 10000) {
            spawnCreep(roleUpgrader, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        // } else if (r.controller.level >=3 && creepRoomMap.get(r.name + "repairer") == undefined){
        //     spawnCreep(roleRepairer, "auto", { memory: { baseRoomName: r.name } }, r.name);
        } else if (creepRoomMap.get(r.name + "builder") < Math.min(creepRoomMap.get(r.name + "csites"), 3) && creepRoomMap.get(r.name + "csites") != 0 && creepRoomMap.get(r.name + "eenergy") > 10000) {
            spawnCreep(roleBuilder, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") == 2 && creepRoomMap.get(r.name + "eenergy") > 50000 && (r.controller.level < 8 || (r.controller.level == 8 && r.controller.ticksToDowngrade < 10000)) && !Memory.rooms[r.name].pauseGrowth) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (
            room.energyAvailable == room.energyCapacityAvailable &&
            Game.getObjectById(Memory.rooms[r.name].mainStorage).store.getFreeCapacity() <= 50 &&
            Game.getObjectById(Memory.rooms[r.name].mainStorage).structureType == STRUCTURE_STORAGE
        ) {
            spawnCreep(roleUpgrader, "auto", { memory: { baseRoomName: r.name, noHeal: true } }, r.name);
            continue;
        } else if (r.controller.level < 3) {
            continue;
        } else if (scoutNeighbouringRooms(r)) {
            continue;
        } else if (r.controller.level >= 6 && creepRoomMap.get(r.name + "eenergy") > 150000 && spawnHarvesterMineralSupport(r.name)) {
            continue;
        } else if (r.controller.level >= 6 && spawnHarvesterMineral(r)) {
            continue;
        } else if (roomExpansion(r.name)) {
            continue;
        } else if (( creepRoomMap.get(r.name + "repairer")  == undefined || creepRoomMap.get(r.name + "repairer") < 1) &&
                    creepRoomMap.get(r.name + "eenergy") > 70000) {
            spawnCreep(roleRepairer, "auto", null, r.name);
            continue;
        } else if (r.controller.level < 4) {
            continue;
        } else if (roomExpansion(r.name)) {
            continue;
        } else if (spawnExternalMover(r.name)) {
            continue;
        } else if (spawnExternalHarvester(r.name)) {
            continue;
        } else if (creepRoomMap.get(r.name + "handler") < 2 && r.energyCapacityAvailable > 1000) {
            spawnCreep(roleHandler, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "handler") < 3 && r.energyCapacityAvailable > 1000 && r.controller.level >= 7) {
            spawnCreep(roleHandler, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "eenergy") > 750000 && r.controller.level < 8) {
            spawnCreep(roleBuilder, "auto", { memory: { baseRoomName: r.name, noHeal: true } }, r.name); //spawn builders to upgrade which will then use the storage annd not the link
            continue;

        } else if (creepRoomMap.get(r.name + "csites") > 5) {
            continue;
        } else if (r.controller.level == 8 && spawnPowerHarvester(r.name)) {
            continue;
        } else if (creepRoomMap.get(r.name + "eenergy") > 150000 && spawnHarvesterDeposit(r.name)) {
            continue;
        } else if (spawnBuilderExt(r.name)) {
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") + creepRoomMap.get(r.name + "builder") < 1 && creepRoomMap.get(r.name + "csites") < 1 && r.controller.level < 8 && !Memory.rooms[r.name].pauseGrowth && (Memory.rooms.W5N8.roomExpansion ? Memory.rooms.W5N8.roomExpansion.active : true)) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        }
        // else if (r.energyAvailable == r.energyCapacityAvailable) {
        //     spawnCreep(roleHandler, "auto")
        // }
        // if (creepRoomMap.get(r.name+"upgrader") > 2) {
        //     // _.forEach(Game.creeps, c => { if(c.memory.role == 'harvester' && c.body.length == 5){ console.log(c.body.length)} } )
        //     c = _.find(Game.creeps, function(c) { if(c.memory.role == 'harvester' && c.body.length == 5){ return c } } )
        //     if(c) {
        //         c.memory.role = 'DIE'
        //     }
        // }

        // else if (r.name == "W16S21" && creepRoomMap.get(r.name+"harvesterExt") < 1) {
        //     spawnCreep(roleHarvesterExt, null, { memory: {baseRoomName: r.name }}, r.name);
        //     continue
        // }
        // else if (r.name == "W16S21" && creepRoomMap.get(r.name+"moverExt") < 2) {
        //     spawnCreep(roleMoverExt, null, { memory: {baseRoomName: r.name }}, r.name);
        //     continue
        // }
        nextSpawnOffset += 1;
    }

    // if (!Game.rooms["W17S21"].controller.my) {
    // spawnCreep(roleClaimer);
    // }

    // if (spawn.spawning == true) {
    //     var spawningCreep = Game.creeps[spawn.spawning.name];
    //     spawn.room.visual.text("🛠️" + spawningCreep.name, spawn.pos.x + 1, spawn.pos.y, {
    //         align: "left",
    //         opacity: 0.8,
    //     });
    // }
};

function spawnMover(room) {
    for (var sourceId in Memory.rooms[room.name].sources) {
        // console.log(`sourceId ${sourceId}`)
        source = Game.getObjectById(sourceId);
        // console.log(`source ${source}`)
        if (source == undefined || source == null) {
            return;
        }

        if (source.room.controller && source.room.controller.reservation != undefined && source.room.controller.reservation.username != g_myUsername && Memory.rooms[source.room.name].reservation.username != g_myUsername) {
            return;
        }

        if (Memory.rooms[room.name].mainStorage != undefined) {
            if (creepRoomMap.get(room.name+"eenergy") > 2000 && (creepRoomMap.get(room.name + "handler") == undefined || creepRoomMap.get(room.name + "handler") == 0)) {
                return false
            }
        }

        if (Memory.rooms[room.name].sources[source.id].link != undefined && Game.getObjectById(Memory.rooms[room.name].sources[source.id].link) != null) {
            return false;
        }

        if (Memory.rooms[source.room.name].sources[source.id].targetCarryParts == undefined || (Memory.rooms[source.room.name].sources[source.id].targetCarryParts == 0 && Memory.rooms[source.room.name].sources[source.id].targettedByMover > 0)) {
            Memory.rooms[source.room.name].sources[source.id].targetCarryParts = calcTargetCarryParts(source, Memory.rooms[source.room.name].mainSpawn, Memory.rooms[source.room.name].sources[source.id]);
        }

        // console.log(`Memory.rooms[${source.room.name}].sources[${source.id}].currentCarryParts ${Memory.rooms[source.room.name].sources[source.id].currentCarryParts}`)
        // console.log(`Memory.rooms[${source.room.name}].sources[${source.id}].targetCarryParts ${Memory.rooms[source.room.name].sources[source.id].targetCarryParts}`)

        if (
            // 0 ||
            (creepRoomMap.get(source.room.name + "harvesterTarget" + source.id) != undefined || creepRoomMap.get(source.room.name + "harvesterTarget" + source.id) >= 1) &&
            Memory.rooms[source.room.name].sources[source.id].targetCarryParts != undefined &&
            Memory.rooms[source.room.name].sources[source.id].currentCarryParts < Memory.rooms[source.room.name].sources[source.id].targetCarryParts &&
            (
                Memory.rooms[source.room.name].sources[source.id].container == undefined && (creepRoomMap.get(source.room.name + "moverTarget" + source.id) == undefined || creepRoomMap.get(source.room.name + "moverTarget" + source.id) < 5) ||
                Memory.rooms[source.room.name].sources[source.id].container != undefined && (creepRoomMap.get(source.room.name + "moverTarget" + source.id) == undefined || creepRoomMap.get(source.room.name + "moverTarget" + source.id) < 2) 
            )
            // ((creepRoomMap.get(source.room.name + "moverTarget" + source.id) == undefined || creepRoomMap.get(source.room.name + "moverTarget" + source.id) < 2)) &&
        ) {
            // console.log(`Spawniong creep in ${source.room.name}`)
            // console.log(`Memory.rooms[${source.room.name}].sources[${source.id}].currentCarryParts ${Memory.rooms[source.room.name].sources[source.id].currentCarryParts}`)
            // console.log(`Memory.rooms[${source.room.name}].sources[${source.id}].targetCarryParts ${Memory.rooms[source.room.name].sources[source.id].targetCarryParts}`)
            var customBody = Array(Memory.rooms[source.room.name].sources[source.id].targetCarryParts).fill(CARRY);
            customBody = customBody.concat(Array(Math.ceil(Memory.rooms[source.room.name].sources[source.id].targetCarryParts / 2)).fill(MOVE));
            // console.log(Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].targetCarryParts)
            // console.log(customBody);
            if (getBodyCost(customBody) == 0 || getBodyCost(customBody) > Game.rooms[source.room.name].energyCapacityAvailable) {
                customBody = "auto"
            }
            if (creepRoomMap.get(source.room.name+"mover") == 0) {
                
            }

            spawnCreep(roleMover, customBody, { memory: { targetSource: source.id } }, room.name);
            return true
        }
    }

    return false;
}


function spawnHarvester(room) {
    // Debug(room.name, "spawnHarvester");
    ret = false;
    if (Memory.rooms[room.name].mainStorage != undefined) {
        if (creepRoomMap.get(room.name+"eenergy") > 2000 && (creepRoomMap.get(room.name + "handler") == undefined || creepRoomMap.get(room.name + "handler") == 0)) {
            return false
        }
    }
    _.forEach(Memory.rooms[room.name].sources, (s) => {
        if (
            (s.currentMiningParts != undefined && s.currentMiningParts < 7 && s.targettedBy < s.miningSpots) ||
            (Memory.rooms[room.name].sources[s.id].container == undefined && /*Memory.rooms[room.name].sources[s.id].link == undefined &&*/ s.targettedBy < s.miningSpots)
        ) {
            if (r.energyAvailable <= 350 && Memory.rooms[room.name].sources[s.id].container == undefined 
                // && 
                // (Memory.rooms[room.name].sources[source.id].link == undefined || (Memory.rooms[room.name].sources[source.id].link != undefined && Game.getObjectById(Memory.rooms[room.name].sources[source.id].link) == null))
                )
            {
                BaseBodyParts = [WORK, WORK, MOVE, MOVE];
                // console.log(1)
                spawnCreep(roleHarvester, BaseBodyParts, { memory: { targetSource: s.id } }, room.name);
            } else {
                // console.log(2)
                // console.log(`${s.id.substr(-3)} s.currentMiningParts:${s.currentMiningParts} s.targettedBy:${s.targettedBy}`)
                spawnCreep(roleHarvester, "auto", { memory: { targetSource: s.id } }, room.name);
            }
            ret = true;
            return false;
        } else {
            // console.log(-1)
        }
    });
    Debug(room.name, ret);
    return ret;
}

function spawnExternalMover(roomName) {
    // console.log(`spawnExternalMover(${roomName}))`)
    Debug(roomName, "spawnExternalMover");
    var potentialSources = [];
    if (Memory.rooms[roomName].externalSources != undefined && Memory.rooms[roomName].externalSources.length) {
        _.forEach(Memory.rooms[roomName].externalSources, (sourceId) => {
            // console.log(sourceId)
            source = Game.getObjectById(sourceId);
            if (source == undefined || source == null) {
                return;
            }
            // console.log(source.room.name + "harvesterExtTarget" + source.id)

            if (source.room.controller && source.room.controller.reservation != undefined && source.room.controller.reservation.username != g_myUsername && Memory.rooms[source.room.name].reservation.username != g_myUsername) {
                return;
            }

            if (Memory.rooms[source.room.name].sources[source.id].container == undefined) {
                // console.log(`Memory.rooms[${source.room.name}].sources[${source.id}].container ${Memory.rooms[source.room.name].sources[source.id].container}`)
                return;
            }

            container = Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id);
            if (container == undefined) {
                return;
            }
            // console.log(container)

            if (Memory.rooms[source.room.name].sources[source.id].targetCarryParts == undefined || (Memory.rooms[source.room.name].sources[source.id].targetCarryParts == 0 && Memory.rooms[source.room.name].sources[source.id].targettedByMover > 0)) {
                console.log(`corrupt currentCarryParts/targettedByMoverList found for ${source.id}`);
                var totalCarryParts = 0;
                _.forEach(Memory.rooms[source.room.name].sources[source.id].targettedByMoverList, (creepName) => {
                    if (Memory.creeps[creepName].DIE == undefined) {
                        creepCarryParts = Game.creeps[creepName].body.reduce((previous, p) => {
                            return p.type == CARRY ? (previous += 1) : previous;
                        }, 0);
                        creepCarryPartsMap.push([creepName, creepCarryParts]);
                        totalCarryParts += creepCarryParts;
                    }
                });
                if (creepRoomMap.get(`${Memory.rooms[source.room.name].parentRoom}moverExtRepairTarget${source.id}`) != undefined) {
                    totalCarryParts += roleMoverExtRepair.BodyParts.reduce((previous, p) => {
                        return p == CARRY ? (previous += 1) : previous;
                    }, 0);
                }
                Memory.rooms[source.room.name].sources[source.id].currentCarryParts = totalCarryParts;
                Memory.rooms[source.room.name].sources[source.id].targetCarryParts = calcTargetCarryParts(source, Memory.rooms[room.name].mainSpawn, Memory.rooms[source.room.name].sources[source.id]);
                console.log(Memory.rooms[source.room.name].sources[source.id].targetCarryParts)
            }

            if (Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id) == null) {
                // console.log(`${source.room.name} ${source.id} container is dead`)
                delete Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container);
                return;
            }

            if (
                Memory.rooms[source.room.name].sources[source.id].targetCarryParts != undefined &&
                Memory.rooms[source.room.name].sources[source.id].currentCarryParts < Memory.rooms[source.room.name].sources[source.id].targetCarryParts &&
                (creepRoomMap.get(roomName + "moverExtTarget" + source.id) == undefined || creepRoomMap.get(roomName + "moverExtTarget" + source.id) < 4) &&
                Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id) != null &&
                Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id).store.getUsedCapacity() > 500
            ) {
                potentialSources.push(source);
                // console.log(`creepRoomMap.get(${roomName}+"moverExtTarget"+${source.id}) ${creepRoomMap.get(roomName+"moverExtTarget"+source.id)}`)
                // console.log(`s: ${source.id.substr(-3)} r: ${source.room.name} curParts: ${Memory.rooms[source.room.name].sources[source.id].targetCarryParts} tarBy: ${Memory.rooms[source.room.name].sources[source.id].targetCarryParts}`)
            }
        });

        // console.log(`potentialSources: ${potentialSources}`)

        if (potentialSources.length) {
            potentialSources = potentialSources.sort(function (s1, s2) {
                if (Memory.rooms[s1.room.name].sources[s1.id].targetCarryParts == Memory.rooms[s2.room.name].sources[s2.id].targetCarryParts &&
                    Game.getObjectById(Memory.rooms[s1.room.name].sources[s1.id].container.id) != null &&
                    Game.getObjectById(Memory.rooms[s2.room.name].sources[s2.id].container.id) != null) {
                    return Game.getObjectById(Memory.rooms[s1.room.name].sources[s1.id].container.id).store.getUsedCapacity() - Game.getObjectById(Memory.rooms[s2.room.name].sources[s2.id].container.id).store.getUsedCapacity();
                } else {
                    return Memory.rooms[s1.room.name].sources[s1.id].targetCarryParts - Memory.rooms[s2.room.name].sources[s2.id].targetCarryParts;
                }
            });
            if (creepRoomMap.get(`${roomName}moverExtRepairTarget${potentialSources[0].id}`) == undefined || creepRoomMap.get(`${roomName}moverExtRepairTarget${potentialSources[0].id}`) == 0) {
                customBodyParts = "auto";
                spawnCreep(
                    roleMoverExtRepair,
                    customBodyParts,
                    { memory: { targetRoomName: potentialSources[0].room.name, targetSource: potentialSources[0].id, targetContainer: Memory.rooms[potentialSources[0].room.name].sources[potentialSources[0].id].container.id, noHeal: true } },
                    roomName
                );
            } else {
                customBodyParts = generateBodyParts(roomName, roleMoverExt)
                    .filter((p) => {
                        return p != CARRY;
                    })
                    .concat(Array(Memory.rooms[potentialSources[0].room.name].sources[potentialSources[0].id].targetCarryParts).fill(CARRY));
                if (getBodyCost(customBodyParts) == 0 || getBodyCost(customBodyParts) > Game.rooms[roomName].energyCapacityAvailable) {
                    customBodyParts = "auto"
                }
                spawnCreep(
                    roleMoverExt,
                    customBodyParts,
                    { memory: { targetRoomName: potentialSources[0].room.name, targetSource: potentialSources[0].id, targetContainer: Memory.rooms[potentialSources[0].room.name].sources[potentialSources[0].id].container.id, noHeal: true } },
                    roomName
                );
            }
            return true;
        }
    }

    return false;
}


function spawnExternalHarvester(roomName) {
    // console.log(`spawnExternalHarvester`)
    Debug(roomName, "spawnExternalHarvester");

    if (Memory.rooms[roomName].externalSources != undefined && Memory.rooms[roomName].externalSources.length) {
        Memory.rooms[roomName].externalSources.forEach((sourceId) => {
            // console.log(sourceId)
            source = Game.getObjectById(sourceId);
            if (source == undefined || source == null) {
                return;
            }
            // console.log(roomName + "harvesterExtTarget" + source.id)
            if (
                source.room.controller == undefined ||
                (source.room.controller && source.room.controller.reservation != undefined && source.room.controller.reservation.username != g_myUsername) ||
                (Memory.rooms[source.room.name].reservation && Memory.rooms[source.room.name].reservation.username != g_myUsername)
            ) {
                return;
            }

            if (Memory.rooms[source.room.name].sources[source.id].currentMiningParts == 0 && Memory.rooms[source.room.name].sources[source.id].targettedBy > 0) {
                console.log(`corrupt currentMiningParts/targettedByList found for ${source.id}`);
                totalMiningParts = 0;
                _.forEach(Memory.rooms[source.room.name].sources[source.id].targettedByList, (creepName) => {
                    creepMiningParts = Game.creeps[creepName].body.reduce((previous, p) => {
                        return p.type == WORK ? (previous += 1) : previous;
                    }, 0);
                    totalMiningParts += creepMiningParts;
                });
                Memory.rooms[source.room.name].sources[source.id].currentMiningParts = totalMiningParts;
            }
            try {
                if (Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id).store.getUsedCapacity()) {
                    // console.log("Wiener")
                }
            }catch (e) {
                // console.log("yahtzee")
            }

            if (
                (Memory.rooms[source.room.name].sources[source.id].currentMiningParts == undefined || Memory.rooms[source.room.name].sources[source.id].currentMiningParts < 7) &&
                Memory.rooms[source.room.name].sources[source.id].targettedBy < Memory.rooms[source.room.name].sources[source.id].miningSpots &&
                (Memory.rooms[source.room.name].sources[source.id].container == undefined ||
                    Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id) == null ||
                    (Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id) != null &&
                        Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id).store.getUsedCapacity() <= 500))
            ) {
                // console.log(`s: ${source.id.substr(-3)} r: ${source.room.name} curParts: ${Memory.rooms[source.room.name].sources[source.id].currentMiningParts} tarBy: ${Memory.rooms[source.room.name].sources[source.id].targettedBy} spots: ${Memory.rooms[source.room.name].sources[source.id].miningSpots} `)
                spawnCreep(roleHarvesterExt, "auto", { memory: { targetRoomName: source.room.name, targetSource: source.id, noHeal: true } }, roomName);
                return true;
            }
        });
    }
    // console.log(`${roomName} no harvesterExt to spawn`)
    return false;
}

function scoutNeighbouringRooms(room) {
    // console.log("scoutNeighbouringRooms")
    Debug(room.name, "scoutNeighbouringRooms");

    ret = false;
    _.forEach(Memory.rooms[room.name].neighbouringRooms, (n) => {
        if (room.controller.level >= 7 && isHighwayRoom(n)) {
            if (
                creepRoomMap.get(room.name + "wandererTarget" + n) == undefined ||
                (room.controller.level == 7 && creepRoomMap.get(room.name + "wandererTarget" + n) < 1) ||
                (room.controller.level == 8 && creepRoomMap.get(room.name + "wandererTarget" + n) < 10)
            ) {
                spawnRet = spawnCreep(roleWanderer, null, { memory: { targetRoomName: n, currentTargetRoom: Memory.rooms[room.name].creeps.wanderers.nextTargetRoomIndex || undefined } }, room.name);
                if (spawnRet == 0) {
                    if (Memory.rooms[room.name].creeps.wanderers.nextTargetRoomReverse) {
                        if (Memory.rooms[room.name].creeps.wanderers.nextTargetRoomIndex <= 0) {
                            Memory.rooms[room.name].creeps.wanderers.nextTargetRoomReverse = !Memory.rooms[room.name].creeps.wanderers.nextTargetRoomReverse;
                            Memory.rooms[room.name].creeps.wanderers.nextTargetRoomIndex++;
                        } else {
                            Memory.rooms[room.name].creeps.wanderers.nextTargetRoomIndex--;
                        }
                    } else {
                        if (Memory.rooms[room.name].creeps.wanderers.nextTargetRoomIndex >= 10) {
                            Memory.rooms[room.name].creeps.wanderers.nextTargetRoomReverse = !Memory.rooms[room.name].creeps.wanderers.nextTargetRoomReverse;
                            Memory.rooms[room.name].creeps.wanderers.nextTargetRoomIndex--;
                        } else {
                            Memory.rooms[room.name].creeps.wanderers.nextTargetRoomIndex++;
                        }
                    }
                }
                ret = true;
                return false; //early escape
            }
        }
        if (Game.rooms[n] == undefined) {
            if (Memory.rooms[n] && Memory.rooms[n].reservation != undefined && Memory.rooms[n].reservation.username != g_myUsername) {
                //do this in the if so it will still scout neghbouring neghbour rooms
                // This room is reserved by someone else, just ignore it
                return;
            }
            if (creepRoomMap.get(room.name + "explorerTarget" + n) == undefined || creepRoomMap.get(room.name + "explorerTarget" + n) < 1) {
                spawnCreep(roleExplorer, null, { memory: { targetRoomName: n } }, room.name);
                ret = true;
                return false; //early escape
            }
        } else {
            _.forEach(Memory.rooms[n].neighbouringRooms, (nn) => {
                if (Memory.rooms[nn] && Memory.rooms[nn].reservation != undefined && Memory.rooms[nn].reservation.username != g_myUsername) {
                    // This room is reserved by someone else, just ignore it
                    return;
                }
                if (Game.rooms[nn] == undefined) {
                    if (creepRoomMap.get(room.name + "explorerTarget" + nn) == undefined || creepRoomMap.get(room.name + "explorerTarget" + nn) < 1) {
                        spawnCreep(roleExplorer, null, { memory: { targetRoomName: nn } }, room.name);
                        ret = true;
                        return false; //early escape
                    }
                }
            });
            if (ret == true) {
                return false; //early escape
            }
        }
    });
    if (ret == false && Memory.rooms[room.name].extraRooms != undefined) {
        _.forEach(Memory.rooms[room.name].extraRooms, (n) => {
            if (Memory.rooms[n] && Memory.rooms[n].reservation != undefined && Memory.rooms[n].reservation.username != g_myUsername) {
                //do this in the if so it will still scout neghbouring neghbour rooms
                // This room is reserved by someone else, just ignore it
                return;
            }
            if (creepRoomMap.get(room.name + "explorerTarget" + n) == undefined || creepRoomMap.get(room.name + "explorerTarget" + n) < 1) {
                spawnCreep(roleExplorer, null, { memory: { targetRoomName: n } }, room.name);
                ret = true;
                return false; //early escape
            }
        });
    }
    return ret;
}

function spawnBuilderExt(roomName) {
    Debug(roomName, "spawnBuilderExt");
    ret = false;
    if (Memory.rooms[roomName].externalSources != undefined && Memory.rooms[roomName].externalSources.length) {
        Memory.rooms[roomName].externalSources.forEach((sourceId) => {
            // console.log(sourceId)
            source = Game.getObjectById(sourceId);
            if (source == undefined || source == null) {
                return;
            }
            // console.log(roomName + "harvesterExtTarget" + source.id)
            if (source.room.controller && source.room.controller.reservation != undefined && source.room.controller.reservation.username != g_myUsername) {
                return;
            }

            if (creepRoomMap.get(source.room.name + "csites") != undefined && creepRoomMap.get(source.room.name + "csites") > 3) {
                if (creepRoomMap.get(roomName + "builderExtTarget" + source.room.name) == undefined || creepRoomMap.get(roomName + "builderExtTarget" + source.room.name) > 1) {
                    ret = spawnCreep(roleBuilderExt, "auto", { memory: { targetRoomName: source.room.name } }, roomName);
                    if (ret == OK) {
                        ret = true;
                        return false; //early escape
                    }
                }
            }
        });
    }
    return ret;
}

function spawnDepositHarvester(r) {
    Debug(r.name, "spawnDepositHarvester");
    if (Object.keys(Memory.rooms[r.name].deposits[d.id].creeps).length < Memory.rooms[r.name].deposits[d.id].miningSpots && d.lastCooldown < 100) {
        _role = roleHarvesterDeposit;
        spawn = Game.getObjectById(Memory.rooms[r.name].mainSpawn.id);

        if (0 && !spawn.spawning) {
            var newName = _.capitalize(_role.name) + "_" + (Math.floor(Math.random() * (999 - 100 + 1)) + 100);
            console.log("Spawning new " + _role.name + " : " + newName);

            ret = spawn.spawnCreep(
                _role.BodyParts,
                newName,
                _.merge(
                    {
                        memory: {
                            role: _role.name,
                            currentSource: "0",
                            baseRoomName: spawn.room.name,
                            targetRoomName: d.room.name,
                            targetSource: d.id,
                        },
                    },
                    _role.memory
                )
            );
            if (ret == 0) {
                refreshCreepTrackingNextTick = true;
                Memory.rooms[r.name].deposits[d.id].creepsUntracked.push(newName);
            } else if (ret != 0) {
                console.log("Spawn failed: ", ret);
            }
        } else {
            // console.log(`Funds not available: ${cost}`)
            displaySpawnFailMessage(spawn.room.name, _role.name, 0, "[Spawning]");
        }
    }
}

function spawnHarvesterMineral(room) {
    // console.log(`spawnMineralHarvester(${room.name})`)
    // console.log(`Memory.rooms[room.name].mineral ${Memory.rooms[room.name].mineral}`)
    // console.log(`Memory.rooms[room.name].mineral.extractor ${Memory.rooms[room.name].mineral.extractor}`)
    // console.log(`mineral.mineralAmount ${Game.getObjectById(Memory.rooms[room.name].mineral.id).mineralAmount}`)
    // console.log(`creepRoomMap.get(room.name+"harvesterMineral") ${creepRoomMap.get(room.name+"harvesterMineral")}`)
    if (
        Memory.rooms[room.name].mineral != undefined &&
        Memory.rooms[room.name].mineral.extractor &&
        Game.getObjectById(Memory.rooms[room.name].mineral.id).mineralAmount &&
        (creepRoomMap.get(room.name + "harvesterMineral") == undefined || creepRoomMap.get(room.name + "harvesterMineral") == 0)
    ) {
        spawnCreep(roleHarvesterMineral, null, { memory: { targetSource: Memory.rooms[room.name].mineral.id } }, room.name);
        return true;
    }
    return false;
}

function spawnHarvesterDeposit(roomName) {
    if (0 && creepRoomMap.get(roomName + "eenergy") > 500000) {
        for (var deposit of Memory.rooms[roomName].deposits) {
            if (creepRoomMap.get(roomName + "harvesterDepositTarget" + deposit.id) == undefined || creepRoomMap.get(roomName + "harvesterDepositTarget" + deposit.id) < deposit.miningSpots) {
                ret = spawnCreep(roleHarvesterDeposit, null, { memory: { targetRoomName: deposit.room.name, targetSource: deposit.id } }, roomName);
                if (ret == 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function spawnHarvesterMineralSupport(roomName) {
    _.forEach(Memory.rooms[roomName].mineral, (mineral) => {
        // try {
        // console.log(mineral)
        // console.log(mineral.container)
        // console.log(mineral.container.id)
        // console.log(Game.getObjectById(mineral.container.id))
        // console.log(Game.getObjectById(mineral.container.id).store.getUsedCapacity())
        // console.log(creepRoomMap.get(roomName+"harvesterMineralSupportTarget"+mineral.id))
        // } catch {}
        if (mineral.container && mineral.container.id && Game.getObjectById(mineral.container.id).store.getUsedCapacity() > 1750 && creepRoomMap.get(roomName + "harvesterMineralSupportTarget" + mineral.id) == undefined) {
            ret = spawnCreep(roleHarvesterMineralSupport, "auto", { memory: { targetSource: mineral.id } }, roomName);
            return true;
        }
    });

    return false;
}

function spawnPowerHarvester(roomName) {
    // console.log("spawnPowerHarvester")
    if (0 && creepRoomMap.get(roomName + "eenergy") > 300000 && Game.getObjectById(Memory.rooms[roomName].mainStorage).store.getUsedCapacity(RESOURCE_POWER) < 20000) {
        // console.log("spawnPowerHarvester > 1000000")
        for (var pBank of Object.values(Memory.rooms[roomName].powerBanks)) {
            // console.log(JSON.stringify(pBank))
            if (pBank.miningSpots >= 3) {
                // console.log("pBank.miningSpots >= 3")
                if ((pBank.expirationTime - Game.time > 2500 && pBank.initialSpawns == undefined) || pBank.initialSpawns == false) {
                    // console.log(pBank.miningSpots)

                    for (var i in _.range(pBank.miningSpots)) {
                        // console.log(i)
                        queueSpawnCreep(rolePowHarvester, null, { memory: { targetRoomName: pBank.room.name, targetSource: pBank.id, noHeal: true } }, roomName);
                        queueSpawnCreep(rolePowHealer, Array(19).fill(HEAL).concat(Array(19).fill(MOVE)), { memory: { targetRoomName: pBank.room.name, targetSource: pBank.id, noHeal: true } }, roomName);
                        pBank.initialSpawns = true;
                    }
                    if (pBank.targettedByList == undefined) {
                        pBank.targettedByList = [];
                    }
                }
            }
        }
    }
}
